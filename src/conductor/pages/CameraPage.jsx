import { useCallback, useEffect, useRef, useState } from 'react'
import { CircleAlert, Loader2, Minus, Play, Plus, RotateCw, Square, Users, VideoOff } from 'lucide-react'
import Card, { PageHeader } from '../../admin/components/Card.jsx'
import Button from '../../admin/components/Button.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useConductor } from '../context/ConductorContext.jsx'
import { capacityStatus } from '../utils/capacity.js'

const DOORS = [
  { id: 'door-1', title: 'Door 1 camera' },
  { id: 'door-2', title: 'Door 2 camera' },
]

// ESP32-CAM on its own Wi-Fi (see firmware/esp32cam). Its MJPEG stream sends
// Access-Control-Allow-Origin: *, so the AI can read frames from an <img crossOrigin>.
const WIFI_SOURCE = '__wifi__'
const DEFAULT_WIFI_URL = 'http://192.168.4.1:81/stream'

const selectClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20'

function usePersonModel() {
  const [model, setModel] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const modelPromise = useRef(null)

  const load = useCallback(async () => {
    if (model) return model
    if (!modelPromise.current) {
      setStatus('loading')
      setError('')
      modelPromise.current = (async () => {
        const tf = await import('@tensorflow/tfjs')
        await tf.ready()
        const cocoSsd = await import('@tensorflow-models/coco-ssd')
        return cocoSsd.load({ base: 'lite_mobilenet_v2' })
      })().then((loaded) => {
        setModel(loaded)
        setStatus('ready')
        return loaded
      }).catch((loadError) => {
        modelPromise.current = null
        setStatus('error')
        setError(`Could not load the person-detection model: ${loadError.message}`)
        throw loadError
      })
    }
    return modelPromise.current
  }, [model])

  return { model, modelStatus: status, modelError: error, loadModel: load }
}

// Tracking tuning. Positions are fractions of the frame (0..1).
const MIN_SCORE = 0.45 // person confidence; people close to the camera are often only partly visible
const MATCH_RADIUS = 0.35 // how far a person may move between two checks and still be the same track
const TRACK_TTL_MS = 2000 // keep a lost track this long so a brief miss does not split one walk into two people
const DETECT_PAUSE_MS = 30 // short pause between checks so the page stays responsive
const LINE_DEAD_ZONE = 0.05 // band around the line where the side is undecided (prevents jitter double-counts)
const SMOOTHING = 0.6 // weight of the newest position; the rest is the track's previous position (damps box jumps)
const CONFIRM_CHECKS = 2 // a person must be seen on the new side this many checks in a row…
const CONFIRM_MS = 300 // …and for at least this long before a crossing counts (ignores one-frame bounces)
// No per-person cooldown: if a bounce ever slips through it produces an exit AND an entry,
// which cancel out so the onboard total stays right (a cooldown would keep only half of it).
const CROSSING_COOLDOWN_MS = 0
const STREAM_STALL_MS = 4000 // Wi-Fi camera: if the picture is pixel-identical this long, the stream died; reconnect
const RETRY_MS = 5000 // Wi-Fi camera: wait between reconnect attempts (a restarting ESP32 needs a few seconds)
const RETRY_PAUSE_MS = 500 // how often to look for the picture to come back while reconnecting
const LONG_OUTAGE_MS = 15000 // after this long, also tell the conductor to check the phone's Wi-Fi
const MAX_BOX_SPAN = 0.85 // a box wider (vertical line) / taller (horizontal line) than this fills nearly the whole
// picture (someone right at the lens); its centre says little about which side they are on, so it is not trusted

// Advance one track by one check. Returns the updated track and, if a crossing was confirmed,
// the side the person came from.
function stepTrack(track, rawCenter, orientation, now, trusted = true) {
  const x = track.x + (rawCenter.x - track.x) * SMOOTHING
  const y = track.y + (rawCenter.y - track.y) * SMOOTHING
  const side = trusted ? sideOfLine({ x, y }, orientation) : null
  const next = { ...track, x, y, seenAt: now }
  let crossedFrom = null

  if (side === null) return { track: next, crossedFrom }
  if (track.side === null) return { track: { ...next, side, pendingSide: null, pendingCount: 0 }, crossedFrom }
  if (side === track.side) return { track: { ...next, pendingSide: null, pendingCount: 0 }, crossedFrom }

  const pendingCount = track.pendingSide === side ? track.pendingCount + 1 : 1
  const pendingSince = track.pendingSide === side ? track.pendingSince : now
  if (pendingCount >= CONFIRM_CHECKS && now - pendingSince >= CONFIRM_MS) {
    if (now - (track.countedAt ?? -Infinity) >= CROSSING_COOLDOWN_MS) {
      crossedFrom = track.side
      next.countedAt = now
    }
    return { track: { ...next, side, pendingSide: null, pendingCount: 0 }, crossedFrom }
  }
  return { track: { ...next, pendingSide: side, pendingCount, pendingSince }, crossedFrom }
}

// A person often walks out of view right after crossing, before the live confirmation finishes.
// When their track expires, count the crossing if they were last seen settled on the other side.
function finishTrack(track, now) {
  const endedOnOtherSide = track.side !== null && track.pendingSide !== null && track.pendingSide !== track.side
  if (!endedOnOtherSide || track.pendingCount < CONFIRM_CHECKS) return null
  if (now - (track.countedAt ?? -Infinity) < CROSSING_COOLDOWN_MS) return null
  return track.side
}

function newTrack(id, center, orientation, now, trusted = true) {
  return { id, ...center, side: trusted ? sideOfLine(center, orientation) : null, seenAt: now, pendingSide: null, pendingCount: 0 }
}

function isTrustedBox(person, orientation) {
  return (orientation === 'horizontal' ? person.height : person.width) <= MAX_BOX_SPAN
}

function sideOfLine(point, orientation) {
  const coordinate = orientation === 'horizontal' ? point.y : point.x
  if (coordinate <= 0.5 - LINE_DEAD_ZONE) return 0
  if (coordinate >= 0.5 + LINE_DEAD_ZONE) return 1
  return null
}

// Pair each detected person with the nearest existing track, closest pairs first.
function matchToTracks(centers, tracks) {
  const pairs = []
  centers.forEach((center, personIndex) => {
    tracks.forEach((track, trackIndex) => {
      const distance = Math.hypot(center.x - track.x, center.y - track.y)
      if (distance < MATCH_RADIUS) pairs.push({ personIndex, trackIndex, distance })
    })
  })
  pairs.sort((a, b) => a.distance - b.distance)
  const trackForPerson = new Map()
  const usedTracks = new Set()
  for (const { personIndex, trackIndex } of pairs) {
    if (trackForPerson.has(personIndex) || usedTracks.has(trackIndex)) continue
    trackForPerson.set(personIndex, trackIndex)
    usedTracks.add(trackIndex)
  }
  return { trackForPerson, usedTracks }
}

function DoorCamera({
  door, devices, selectedDevice, onDeviceChange, onDevicesChanged,
  claimDevice, releaseDevice, model, loadModel, modelStatus, onCrossing,
}) {
  const videoRef = useRef(null)
  const imgRef = useRef(null)
  const activeDeviceId = useRef('')
  const [stream, setStream] = useState(null)
  const [wifiUrl, setWifiUrl] = useState(DEFAULT_WIFI_URL)
  const [activeWifiUrl, setActiveWifiUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [detections, setDetections] = useState([])
  const [checksPerSecond, setChecksPerSecond] = useState(0)
  const [lastCrossing, setLastCrossing] = useState(null)
  const [reconnects, setReconnects] = useState(0)
  // Wi-Fi camera link: 'connecting' (first picture not in yet), 'live', or 'reconnecting'.
  // Counting is paused whenever the link is not live.
  const [link, setLink] = useState({ state: 'connecting', since: 0 })
  const [clock, setClock] = useState(0)
  const [orientation, setOrientation] = useState('horizontal')
  const [outsideSide, setOutsideSide] = useState(0)
  const isWifiSource = selectedDevice === WIFI_SOURCE
  const active = Boolean(stream || activeWifiUrl)

  const stop = useCallback(() => {
    stream?.getTracks().forEach((track) => track.stop())
    if (imgRef.current) imgRef.current.src = ''
    if (activeDeviceId.current) releaseDevice(door.id, activeDeviceId.current)
    activeDeviceId.current = ''
    setStream(null)
    setActiveWifiUrl('')
    setDetections([])
    setChecksPerSecond(0)
    setLastCrossing(null)
    setReconnects(0)
    setLink({ state: 'connecting', since: 0 })
    setMessage('')
  }, [door.id, releaseDevice, stream])

  useEffect(() => {
    if (!activeWifiUrl) return undefined
    const img = imgRef.current
    return () => {
      if (img) img.src = ''
      if (activeDeviceId.current) releaseDevice(door.id, activeDeviceId.current)
      activeDeviceId.current = ''
    }
  }, [activeWifiUrl, door.id, releaseDevice])

  useEffect(() => {
    if (!stream) return undefined
    return () => {
      stream.getTracks().forEach((track) => track.stop())
      if (activeDeviceId.current) releaseDevice(door.id, activeDeviceId.current)
      activeDeviceId.current = ''
    }
  }, [door.id, releaseDevice, stream])

  const startWifi = async () => {
    let url
    try {
      url = new URL(wifiUrl.trim())
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('bad protocol')
    } catch {
      setMessage('Enter the camera stream address, for example http://192.168.4.1:81/stream')
      return
    }
    const claimId = `wifi:${url.href}`
    if (!claimDevice(door.id, claimId)) {
      setMessage('This Wi-Fi camera is already assigned to the other door. Use a different camera address.')
      return
    }
    setBusy(true)
    setMessage('')
    activeDeviceId.current = claimId
    try {
      await loadModel()
      setLink({ state: 'connecting', since: Date.now() })
      setActiveWifiUrl(url.href)
    } catch (error) {
      releaseDevice(door.id, claimId)
      activeDeviceId.current = ''
      setMessage(error.message || 'Could not start the person counter.')
    } finally {
      setBusy(false)
    }
  }

  const start = async () => {
    if (isWifiSource) {
      await startWifi()
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage('This browser cannot access cameras. Use a supported browser on HTTPS or localhost.')
      return
    }

    setBusy(true)
    setMessage('')
    let newStream
    try {
      newStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: selectedDevice ? { deviceId: { exact: selectedDevice } } : true,
      })
      const activeId = newStream.getVideoTracks()[0]?.getSettings().deviceId || ''
      if (!claimDevice(door.id, activeId)) {
        newStream.getTracks().forEach((track) => track.stop())
        newStream = null
        setMessage('This camera is already assigned to the other door. Select a different camera source.')
        return
      }
      activeDeviceId.current = activeId
      await loadModel()
      setStream(newStream)
      if (activeId) onDeviceChange(activeId)
      onDevicesChanged()
    } catch (error) {
      newStream?.getTracks().forEach((track) => track.stop())
      if (activeDeviceId.current) releaseDevice(door.id, activeDeviceId.current)
      activeDeviceId.current = ''
      setMessage(error.message || 'Could not start this camera. Check browser permission and try again.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    const source = stream ? videoRef.current : imgRef.current
    if ((!stream && !activeWifiUrl) || !model || !source) return undefined

    let cancelled = false
    let timeoutId
    let tracks = []
    let nextTrackId = 0
    const countCrossing = (crossedFrom, now) => {
      if (crossedFrom === null) return
      const direction = crossedFrom === outsideSide ? 'entry' : 'exit'
      onCrossing(direction)
      setLastCrossing({ direction, at: now })
    }
    const frameSize = () => (stream
      ? { width: source.videoWidth, height: source.videoHeight }
      : { width: source.naturalWidth, height: source.naturalHeight })
    const frameReady = () => (stream
      ? source.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
      : source.naturalWidth > 0)

    if (stream) {
      source.srcObject = stream
      source.play().catch((error) => {
        if (!cancelled) setMessage(`Could not play camera video: ${error.message}`)
      })
    }

    let checkTimes = []
    // TF.js reads an <img> at its on-screen size, not the camera's resolution. Copy each
    // Wi-Fi frame to a canvas at its natural size so boxes and frame size always agree.
    const frameCanvas = stream ? null : document.createElement('canvas')
    const detectionInput = () => {
      if (!frameCanvas) return source
      const { width, height } = frameSize()
      if (frameCanvas.width !== width || frameCanvas.height !== height) {
        frameCanvas.width = width
        frameCanvas.height = height
      }
      frameCanvas.getContext('2d').drawImage(source, 0, 0, width, height)
      return frameCanvas
    }

    // Wi-Fi camera health. The link never gives up: if the camera restarts or the phone briefly
    // drops its Wi-Fi, keep asking for the stream every few seconds until the picture moves again.
    // A dropped MJPEG connection often fires no error (the <img> just keeps the last frame), but a
    // live sensor always has a little pixel noise, so an unchanged picture also means it froze.
    const stallCanvas = stream ? null : Object.assign(document.createElement('canvas'), { width: 16, height: 12 })
    let lastSignature = ''
    let lastChangeAt = Date.now()
    let live = false
    let nextRetryAt = Date.now() + RETRY_MS * 2 // first connection: allow extra time
    const pictureSignature = () => {
      if (source.naturalWidth === 0) return null // broken image (camera unreachable)
      try {
        const context = stallCanvas.getContext('2d', { willReadFrequently: true })
        context.drawImage(source, 0, 0, 16, 12)
        return context.getImageData(0, 0, 16, 12).data.join(',')
      } catch {
        return null
      }
    }
    const retry = (now) => {
      nextRetryAt = now + RETRY_MS
      const separator = activeWifiUrl.includes('?') ? '&' : '?'
      source.src = `${activeWifiUrl}${separator}retry=${now}`
    }
    const markDown = (now) => {
      if (!live) return
      live = false
      tracks = [] // people move during an outage; old tracks would produce false crossings
      setDetections([])
      setReconnects((count) => count + 1)
      setLink({ state: 'reconnecting', since: now })
    }
    // Returns true when the Wi-Fi picture is live and safe to count on.
    const checkWifiLink = (now) => {
      const signature = pictureSignature()
      if (signature !== null && signature !== lastSignature) {
        lastSignature = signature
        lastChangeAt = now
        if (!live) {
          live = true
          setLink({ state: 'live', since: now })
        }
        return true
      }
      if (live && now - lastChangeAt >= STREAM_STALL_MS) {
        markDown(now)
        retry(now)
        return false
      }
      if (!live && now >= nextRetryAt) retry(now)
      return live
    }
    const onImageError = () => {
      const now = Date.now()
      markDown(now)
      // Retry soon, but never hammer the camera while it is restarting.
      nextRetryAt = Math.max(Math.min(nextRetryAt, now + RETRY_MS), now + 2000)
    }
    if (!stream) source.addEventListener('error', onImageError)

    const detect = async () => {
      if (cancelled) return
      if (!stream && !checkWifiLink(Date.now())) {
        setChecksPerSecond(0)
        timeoutId = window.setTimeout(detect, RETRY_PAUSE_MS)
        return
      }
      if (!frameReady()) {
        timeoutId = window.setTimeout(detect, 200)
        return
      }

      try {
        const { width: frameWidth, height: frameHeight } = frameSize()
        const results = await model.detect(detectionInput(), 20, MIN_SCORE)
        if (cancelled) return
        const now = Date.now()
        checkTimes = [...checkTimes.filter((time) => now - time < 2000), now]
        const people = results
          .filter((result) => result.class === 'person' && result.score >= MIN_SCORE)
          .map((result) => {
            const [x, y, width, height] = result.bbox
            return {
              x: x / frameWidth,
              y: y / frameHeight,
              width: width / frameWidth,
              height: height / frameHeight,
              score: result.score,
            }
          })

        const centers = people.map((person) => ({ x: person.x + person.width / 2, y: person.y + person.height / 2 }))
        const { trackForPerson, usedTracks } = matchToTracks(centers, tracks)
        const nextTracks = centers.map((center, personIndex) => {
          const trackIndex = trackForPerson.get(personIndex)
          const trusted = isTrustedBox(people[personIndex], orientation)
          if (trackIndex === undefined) return newTrack(nextTrackId++, center, orientation, now, trusted)
          // Count once when a tracked person settles on the other side of the line.
          const { track, crossedFrom } = stepTrack(tracks[trackIndex], center, orientation, now, trusted)
          countCrossing(crossedFrom, now)
          return track
        })

        const unmatched = tracks.filter((track, index) => !usedTracks.has(index))
        for (const track of unmatched) {
          if (now - track.seenAt >= TRACK_TTL_MS) countCrossing(finishTrack(track, now), now)
        }
        tracks = [...nextTracks, ...unmatched.filter((track) => now - track.seenAt < TRACK_TTL_MS)]
        setDetections(people.map((person, index) => ({
          ...person,
          trackId: nextTracks[index].id,
          side: isTrustedBox(person, orientation) ? nextTracks[index].side : null,
          dotX: nextTracks[index].x, // smoothed position the counter actually uses
          dotY: nextTracks[index].y,
        })))
        setChecksPerSecond(checkTimes.length > 1 ? (checkTimes.length - 1) / ((now - checkTimes[0]) / 1000) : 0)
      } catch (error) {
        if (!cancelled) {
          setMessage(`Person detection stopped: ${error.message}`)
          if (stream) {
            stream.getTracks().forEach((track) => track.stop())
            setStream(null)
          } else {
            source.src = ''
            setActiveWifiUrl('')
          }
        }
        return
      }
      timeoutId = window.setTimeout(detect, DETECT_PAUSE_MS)
    }

    detect()
    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
      if (!stream) source.removeEventListener('error', onImageError)
      if (stream) {
        source.pause()
        source.srcObject = null
      }
    }
  }, [stream, activeWifiUrl, model, orientation, outsideSide, onCrossing])

  // Hide the "+1 entry / −1 exit" badge a moment after each crossing.
  useEffect(() => {
    if (!lastCrossing) return undefined
    const timer = window.setTimeout(() => setLastCrossing(null), 2500)
    return () => window.clearTimeout(timer)
  }, [lastCrossing])

  // Tick once a second while the Wi-Fi link is down, so the "paused for N s" text stays current.
  const linkDown = Boolean(activeWifiUrl) && link.state !== 'live'
  useEffect(() => {
    if (!linkDown) return undefined
    const timer = window.setInterval(() => setClock(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [linkDown])
  const outageSeconds = linkDown && link.since ? Math.max(0, Math.round((Math.max(clock, link.since) - link.since) / 1000)) : 0

  const status = linkDown
    ? (link.state === 'connecting' ? 'Connecting' : 'Reconnecting')
    : active ? 'Online' : busy ? 'Connecting' : message ? 'Error' : 'Offline'

  return (
    <Card title={door.title} action={<StatusBadge status={status} />} bodyClass="space-y-3 p-3 sm:p-4">
      <div className="relative mx-auto aspect-video w-full max-w-[560px] overflow-hidden rounded-lg bg-slate-950">
        {active ? (
          <>
            {stream ? (
              <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-fill" aria-label={`${door.title} live video`} />
            ) : (
              <img
                ref={imgRef}
                src={activeWifiUrl}
                crossOrigin="anonymous"
                className="h-full w-full object-fill"
                alt={`${door.title} Wi-Fi camera live video`}
              />
            )}
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">
              {orientation === 'horizontal'
                ? <line x1="0" y1="0.5" x2="1" y2="0.5" stroke="#facc15" strokeWidth="0.004" strokeDasharray="0.02 0.01" />
                : <line x1="0.5" y1="0" x2="0.5" y2="1" stroke="#facc15" strokeWidth="0.004" strokeDasharray="0.02 0.01" />}
              {detections.map((person, index) => {
                // Dot colour shows which side the tracker thinks the person is on (grey = on the line).
                const sideColor = person.side === null ? '#94a3b8' : person.side === outsideSide ? '#f97316' : '#38bdf8'
                return (
                  <g key={`${index}-${person.x}-${person.y}`}>
                    <rect
                      x={person.x + person.width * 0.06}
                      y={person.y + person.height * 0.04}
                      width={person.width * 0.88}
                      height={person.height * 0.92}
                      fill="none"
                      stroke="#4ade80"
                      strokeWidth="0.002"
                    />
                    <circle cx={person.dotX} cy={person.dotY} r="0.015" fill={sideColor} stroke="#fff" strokeWidth="0.003" />
                  </g>
                )
              })}
            </svg>
            {!linkDown && (
              <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-xs font-semibold text-white">
                {detections.length} visible · AI {checksPerSecond.toFixed(1)}/s
                {reconnects > 0 && ` · reconnected ${reconnects}×`}
              </span>
            )}
            {lastCrossing && (
              <span className={`absolute right-2 top-2 rounded px-2 py-1 text-xs font-bold text-white ${lastCrossing.direction === 'entry' ? 'bg-green-600' : 'bg-amber-600'}`}>
                {lastCrossing.direction === 'entry' ? '+1 entry' : '−1 exit'}
              </span>
            )}
            {!linkDown && (
              <span className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-[11px] text-white">
                <span className="text-orange-400">●</span> outside · <span className="text-sky-400">●</span> inside · <span className="text-slate-400">●</span> on line
              </span>
            )}
            {linkDown && (
              // Sits above every other label on the video, centred, so nothing covers the warning.
              <div role="status" className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/60 p-3">
                <div className="flex max-w-xs flex-col items-center rounded-lg bg-black/85 px-4 py-3 text-center text-white shadow-lg">
                <Loader2 size={28} className="animate-spin text-amber-300" />
                <p className="mt-2 text-sm font-semibold">
                  {link.state === 'connecting' ? 'Connecting to camera…' : 'Reconnecting to camera…'}
                </p>
                <p className="mt-1 text-xs font-semibold text-amber-200">Counting paused{outageSeconds > 0 && ` · ${outageSeconds} s`}</p>
                {outageSeconds * 1000 >= LONG_OUTAGE_MS && (
                  <p className="mt-2 text-xs text-slate-200">
                    Still trying. Check that this phone is connected to the camera Wi-Fi and that the camera has power.
                    People who pass the door now are not counted.
                  </p>
                )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center text-slate-300">
            {busy ? <Loader2 size={32} className="animate-spin" /> : message ? <CircleAlert size={32} className="text-red-400" /> : <VideoOff size={32} />}
            <p className="mt-2 text-sm font-semibold">{busy ? 'Starting camera and AI…' : message ? 'Camera unavailable' : 'Camera is off'}</p>
            {message && <p role="alert" className="mt-1 text-xs text-red-200">{message}</p>}
          </div>
        )}
      </div>

      <label className="block text-xs font-semibold text-navy">
        Camera source
        <select
          className={`${selectClass} mt-1`}
          value={selectedDevice}
          disabled={active || busy}
          onChange={(event) => onDeviceChange(event.target.value)}
        >
          <option value="">Default camera</option>
          {devices.map((device, index) => (
            <option key={device.deviceId} value={device.deviceId}>{device.label || `Camera ${index + 1}`}</option>
          ))}
          <option value={WIFI_SOURCE}>Wi-Fi camera (ESP32-CAM)</option>
        </select>
      </label>

      {isWifiSource && (
        <label className="block text-xs font-semibold text-navy">
          Wi-Fi camera stream address
          <input
            type="url"
            inputMode="url"
            value={wifiUrl}
            disabled={active || busy}
            onChange={(event) => setWifiUrl(event.target.value)}
            className={`${selectClass} mt-1 font-mono`}
            placeholder={DEFAULT_WIFI_URL}
          />
          <span className="mt-1 block font-normal text-slate-500">Connect this device to the camera&apos;s Wi-Fi first. The camera allows one viewer at a time.</span>
        </label>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-navy">
          Crossing line
          <select className={`${selectClass} mt-1`} value={orientation} onChange={(event) => { setOrientation(event.target.value); setOutsideSide(0) }}>
            <option value="horizontal">Horizontal · top/bottom</option>
            <option value="vertical">Vertical · left/right</option>
          </select>
        </label>
        <label className="block text-xs font-semibold text-navy">
          Outside is on the
          <select className={`${selectClass} mt-1`} value={outsideSide} onChange={(event) => setOutsideSide(Number(event.target.value))}>
            {orientation === 'horizontal'
              ? <><option value={0}>Top side</option><option value={1}>Bottom side</option></>
              : <><option value={0}>Left side</option><option value={1}>Right side</option></>}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {active ? (
          <Button variant="secondary" icon={Square} onClick={stop}>Stop counter</Button>
        ) : (
          <Button icon={busy ? Loader2 : Play} onClick={start} disabled={busy || modelStatus === 'loading'}>
            {busy ? 'Starting…' : 'Start person counter'}
          </Button>
        )}
      </div>
    </Card>
  )
}

// The counter lives in the conductor layout and stays mounted on every conductor page, so the
// cameras keep scanning when the conductor opens the map or settings. `visible` only hides it.
export function CameraPanel({ feed, visible = true }) {
  const { passengerCount, passengerEntries, passengerExits, recordPassengerCrossing, setPassengerCount, adjustPassengerCount } = useConductor()
  const capacity = capacityStatus(passengerCount, feed?.assignment?.bus?.capacity)
  const { model, modelStatus, modelError, loadModel } = usePersonModel()
  const [devices, setDevices] = useState([])
  const [selectedDevices, setSelectedDevices] = useState({ 'door-1': '', 'door-2': '' })
  const [baseline, setBaseline] = useState('')
  const [deviceError, setDeviceError] = useState('')
  const activeDevices = useRef({})

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setDeviceError('This browser cannot enumerate camera devices.')
      return
    }
    try {
      const available = await navigator.mediaDevices.enumerateDevices()
      setDevices(available.filter((device) => device.kind === 'videoinput'))
      setDeviceError('')
    } catch (error) {
      setDeviceError(`Could not list camera devices: ${error.message}`)
    }
  }, [])

  const updateDevice = (doorId, deviceId) => {
    // Two doors may both use Wi-Fi cameras; their stream addresses are checked when they start.
    if (deviceId && deviceId !== WIFI_SOURCE && Object.entries(selectedDevices).some(([id, selected]) => id !== doorId && selected === deviceId)) {
      setDeviceError('Choose a different camera source for each door.')
      return
    }
    setDeviceError('')
    setSelectedDevices((current) => ({ ...current, [doorId]: deviceId }))
  }

  const claimDevice = useCallback((doorId, deviceId) => {
    if (deviceId && Object.entries(activeDevices.current).some(([id, activeId]) => id !== doorId && activeId === deviceId)) {
      return false
    }
    activeDevices.current[doorId] = deviceId
    return true
  }, [])

  const releaseDevice = useCallback((doorId, deviceId) => {
    if (activeDevices.current[doorId] === deviceId) delete activeDevices.current[doorId]
  }, [])

  const saveBaseline = (event) => {
    event.preventDefault()
    const count = Number(baseline)
    if (!baseline.trim() || !Number.isSafeInteger(count) || count < 0) {
      setDeviceError('Starting onboard count must be a whole number greater than or equal to zero.')
      return
    }
    setPassengerCount(count)
    setBaseline('')
    setDeviceError('')
  }

  return (
    <div
      className={visible ? 'mx-auto max-w-6xl space-y-4' : 'pointer-events-none fixed left-[-200vw] top-0 w-[min(100vw,72rem)] space-y-4'}
      aria-hidden={!visible}
      inert={!visible}
    >
      <PageHeader
        hideTitle
        title="Passenger counter"
        actions={<Button variant="secondary" icon={RotateCw} onClick={refreshDevices}>Refresh cameras</Button>}
      />

      <Card
        title="Onboard passenger count"
        action={<span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${capacity.badge}`}>{capacity.label}</span>}
      >
        <div className="grid gap-4 lg:grid-cols-[auto_1fr] lg:items-center">
          <div className="flex items-center justify-between gap-3 lg:justify-start">
            <Button variant="secondary" icon={Minus} onClick={() => adjustPassengerCount(-1)} disabled={passengerCount === 0} aria-label="Remove one passenger" className="h-14 w-14 shrink-0" />
            <div className="min-w-[6.5rem] flex-1 text-center lg:flex-none">
              <p className="text-4xl font-bold leading-none text-navy">{passengerCount}</p>
              <p className="mt-1 text-xs text-slate-500">{capacity.limit ? `of ${capacity.limit} max` : 'onboard'}</p>
            </div>
            <Button variant="secondary" icon={Plus} onClick={() => adjustPassengerCount(1)} aria-label="Add one passenger" className="h-14 w-14 shrink-0" />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center sm:gap-3">
            <div className="rounded-lg bg-green-50 p-3">
              <p className="text-xs text-green-800">Entries</p>
              <p className="mt-1 text-lg font-bold text-green-900">{passengerEntries}</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-3">
              <p className="text-xs text-amber-800">Exits</p>
              <p className="mt-1 text-lg font-bold text-amber-900">{passengerExits}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-600">Max</p>
              <p className="mt-1 text-lg font-bold text-navy">{capacity.limit ?? '—'}</p>
            </div>
          </div>
        </div>

        {capacity.limit && (
          <div className="mt-4">
            <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Bus load" aria-valuenow={Math.min(capacity.pct, 100)} aria-valuemin={0} aria-valuemax={100}>
              <div className={`h-full rounded-full transition-all ${capacity.bar}`} style={{ width: `${Math.min(capacity.pct, 100)}%` }} />
            </div>
            <p className="mt-1 text-xs text-slate-500">{capacity.pct}% of the limit set by the admin</p>
          </div>
        )}
        {capacity.key === 'over' && (
          <p role="alert" className="mt-3 flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white">
            <CircleAlert size={16} className="shrink-0" />
            Overboard: {capacity.over} {capacity.over === 1 ? 'passenger' : 'passengers'} over the limit. Do not let more people on.
          </p>
        )}
        {capacity.key === 'full' && (
          <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">The bus is full. Do not let more people on.</p>
        )}
        {capacity.key === 'unknown' && (
          <p className="mt-3 text-xs text-slate-500">No passenger limit yet. It appears here once an admin assigns you a bus with a capacity.</p>
        )}

        <form onSubmit={saveBaseline} className="mt-4 flex items-end gap-2 border-t border-slate-100 pt-4">
          <label className="block min-w-0 flex-1 text-xs font-semibold text-navy sm:flex-none">
            Set onboard count
            <input
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={baseline}
              placeholder={String(passengerCount)}
              onChange={(event) => setBaseline(event.target.value)}
              className={`${selectClass} mt-1 sm:w-40`}
            />
          </label>
          <Button type="submit" variant="secondary" className="shrink-0">Set count</Button>
        </form>
        <p className="mt-3 text-xs text-slate-500">Use − and + to fix a wrong count. The camera adds one for each person who walks in and removes one for each person who walks out.</p>
      </Card>

      {deviceError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{deviceError}</p>}
      {modelError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{modelError}</p>}
      {modelStatus === 'loading' && (
        <p role="status" className="flex items-center gap-2 text-sm text-slate-600"><Loader2 size={16} className="animate-spin" /> Loading the person-detection model…</p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {DOORS.map((door) => (
          <DoorCamera
            key={door.id}
            door={door}
            devices={devices}
            selectedDevice={selectedDevices[door.id]}
            onDeviceChange={(deviceId) => updateDevice(door.id, deviceId)}
            onDevicesChanged={refreshDevices}
            claimDevice={claimDevice}
            releaseDevice={releaseDevice}
            model={model}
            loadModel={loadModel}
            modelStatus={modelStatus}
            onCrossing={recordPassengerCrossing}
          />
        ))}
      </div>

      <p className="flex items-start gap-2 text-xs text-slate-500"><Users size={15} className="mt-0.5 shrink-0" /> Configure the line across each doorway and choose which side is outside. A person crossing outside-to-inside adds one; inside-to-outside subtracts one. Use separate camera views for the two doors.</p>
    </div>
  )
}

// The /conductor/camera route renders nothing itself: the layout shows CameraPanel on that page
// and keeps it running in the background on the others.
export default function CameraPage() {
  return null
}
