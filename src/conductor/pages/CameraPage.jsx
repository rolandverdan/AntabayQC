import { useCallback, useEffect, useRef, useState } from 'react'
import { CircleAlert, Loader2, Play, RotateCw, Square, Users, VideoOff } from 'lucide-react'
import Card, { PageHeader } from '../../admin/components/Card.jsx'
import Button from '../../admin/components/Button.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useConductor } from '../context/ConductorContext.jsx'

const DOORS = [
  { id: 'door-1', title: 'Door 1 camera' },
  { id: 'door-2', title: 'Door 2 camera' },
]

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

function sideOfLine(point, orientation) {
  const coordinate = orientation === 'horizontal' ? point.y : point.x
  if (coordinate <= 0.43) return 0
  if (coordinate >= 0.57) return 1
  return null
}

function DoorCamera({
  door, devices, selectedDevice, onDeviceChange, onDevicesChanged,
  claimDevice, releaseDevice, model, loadModel, modelStatus, onCrossing,
}) {
  const videoRef = useRef(null)
  const activeDeviceId = useRef('')
  const [stream, setStream] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [detections, setDetections] = useState([])
  const [orientation, setOrientation] = useState('horizontal')
  const [outsideSide, setOutsideSide] = useState(0)

  const stop = useCallback(() => {
    stream?.getTracks().forEach((track) => track.stop())
    if (activeDeviceId.current) releaseDevice(door.id, activeDeviceId.current)
    activeDeviceId.current = ''
    setStream(null)
    setDetections([])
    setMessage('')
  }, [door.id, releaseDevice, stream])

  useEffect(() => {
    if (!stream) return undefined
    return () => {
      stream.getTracks().forEach((track) => track.stop())
      if (activeDeviceId.current) releaseDevice(door.id, activeDeviceId.current)
      activeDeviceId.current = ''
    }
  }, [door.id, releaseDevice, stream])

  const start = async () => {
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
    const video = videoRef.current
    if (!stream || !model || !video) return undefined

    let cancelled = false
    let timeoutId
    let tracks = []
    let nextTrackId = 0

    video.srcObject = stream
    video.play().catch((error) => {
      if (!cancelled) setMessage(`Could not play camera video: ${error.message}`)
    })

    const detect = async () => {
      if (cancelled) return
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        timeoutId = window.setTimeout(detect, 400)
        return
      }

      try {
        const results = await model.detect(video, 20, 0.55)
        if (cancelled) return
        const now = Date.now()
        const people = results
          .filter((result) => result.class === 'person' && result.score >= 0.55)
          .map((result) => {
            const [x, y, width, height] = result.bbox
            return {
              x: x / video.videoWidth,
              y: y / video.videoHeight,
              width: width / video.videoWidth,
              height: height / video.videoHeight,
              score: result.score,
            }
          })

        const unmatchedTracks = new Set(tracks.map((track) => track.id))
        const nextTracks = []
        for (const person of people) {
          const center = { x: person.x + person.width / 2, y: person.y + person.height / 2 }
          let closest = null
          let closestDistance = 0.14
          for (const track of tracks) {
            if (!unmatchedTracks.has(track.id)) continue
            const distance = Math.hypot(center.x - track.x, center.y - track.y)
            if (distance < closestDistance) {
              closest = track
              closestDistance = distance
            }
          }

          if (closest) {
            unmatchedTracks.delete(closest.id)
            const currentSide = sideOfLine(center, orientation)
            if (currentSide !== null && closest.side !== null && currentSide !== closest.side) {
              onCrossing(closest.side === outsideSide ? 'entry' : 'exit')
            }
            nextTracks.push({
              id: closest.id,
              ...center,
              side: currentSide ?? closest.side,
              seenAt: now,
            })
          } else {
            nextTracks.push({
              id: nextTrackId++,
              ...center,
              side: sideOfLine(center, orientation),
              seenAt: now,
            })
          }
        }

        tracks = [
          ...nextTracks,
          ...tracks.filter((track) => unmatchedTracks.has(track.id) && now - track.seenAt < 1200),
        ]
        setDetections(people)
      } catch (error) {
        if (!cancelled) {
          setMessage(`Person detection stopped: ${error.message}`)
          stream.getTracks().forEach((track) => track.stop())
          setStream(null)
        }
        return
      }
      timeoutId = window.setTimeout(detect, 400)
    }

    detect()
    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
      video.pause()
      video.srcObject = null
    }
  }, [stream, model, orientation, outsideSide, onCrossing])

  const status = stream ? 'Online' : busy ? 'Connecting' : message ? 'Error' : 'Offline'

  return (
    <Card title={door.title} action={<StatusBadge status={status} />} bodyClass="space-y-3 p-3 sm:p-4">
      <div className="relative mx-auto aspect-video w-full max-w-[560px] overflow-hidden rounded-lg bg-slate-950">
        {stream ? (
          <>
            <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-fill" aria-label={`${door.title} live video`} />
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">
              {orientation === 'horizontal'
                ? <line x1="0" y1="0.5" x2="1" y2="0.5" stroke="#facc15" strokeWidth="0.004" strokeDasharray="0.02 0.01" />
                : <line x1="0.5" y1="0" x2="0.5" y2="1" stroke="#facc15" strokeWidth="0.004" strokeDasharray="0.02 0.01" />}
              {detections.map((person, index) => (
                <rect
                  key={`${index}-${person.x}-${person.y}`}
                  x={person.x + person.width * 0.06}
                  y={person.y + person.height * 0.04}
                  width={person.width * 0.88}
                  height={person.height * 0.92}
                  fill="none"
                  stroke="#4ade80"
                  strokeWidth="0.002"
                />
              ))}
            </svg>
            <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-xs font-semibold text-white">
              {detections.length} visible · AI
            </span>
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
          disabled={Boolean(stream) || busy}
          onChange={(event) => onDeviceChange(event.target.value)}
        >
          <option value="">Default camera</option>
          {devices.map((device, index) => (
            <option key={device.deviceId} value={device.deviceId}>{device.label || `Camera ${index + 1}`}</option>
          ))}
        </select>
      </label>

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
        {stream ? (
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

export default function CameraPage() {
  const { passengerCount, passengerEntries, passengerExits, recordPassengerCrossing, setPassengerCount } = useConductor()
  const { model, modelStatus, modelError, loadModel } = usePersonModel()
  const [devices, setDevices] = useState([])
  const [selectedDevices, setSelectedDevices] = useState({ 'door-1': '', 'door-2': '' })
  const [baseline, setBaseline] = useState(String(passengerCount))
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
    if (deviceId && Object.entries(selectedDevices).some(([id, selected]) => id !== doorId && selected === deviceId)) {
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
    setBaseline(String(count))
    setDeviceError('')
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeader
        hideTitle
        title="Passenger counter"
        description="Browser-side AI estimates people crossing the configured line at each doorway."
        actions={<Button variant="secondary" icon={RotateCw} onClick={refreshDevices}>Refresh cameras</Button>}
      />

      <Card title="Onboard passenger count" action={<span className="text-2xl font-bold text-navy">{passengerCount}</span>}>
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-green-50 p-3">
              <p className="text-xs text-green-800">Entries counted</p>
              <p className="mt-1 text-lg font-bold text-green-900">{passengerEntries}</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-3">
              <p className="text-xs text-amber-800">Exits counted</p>
              <p className="mt-1 text-lg font-bold text-amber-900">{passengerExits}</p>
            </div>
          </div>
          <form onSubmit={saveBaseline} className="flex items-end gap-2">
            <label className="block text-xs font-semibold text-navy">
              Set starting onboard count
              <input
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={baseline}
                onChange={(event) => setBaseline(event.target.value)}
                className={`${selectClass} mt-1 w-32`}
              />
            </label>
            <Button type="submit" variant="secondary">Set count</Button>
          </form>
        </div>
        <p className="mt-3 text-xs text-slate-500">The total and crossing totals persist in this browser only. The starting count is conductor-entered; later changes come from AI-detected line crossings.</p>
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
