import { useEffect, useRef, useState } from 'react'
import { Camera as CameraIcon, Play, Square, Maximize2, VideoOff, Loader2, CircleAlert } from 'lucide-react'
import Card, { PageHeader, Notice } from '../../admin/components/Card.jsx'
import Button from '../../admin/components/Button.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { CAMERAS } from '../data/mock.js'

const initialStates = () => Object.fromEntries(CAMERAS.map((c) => [c.id, { status: c.startsOnline ? 'Online' : 'Offline', error: '' }]))

export default function CameraPage() {
  const [selected, setSelected] = useState(CAMERAS[0].id)
  const [states, setStates] = useState(initialStates)
  const [now, setNow] = useState(() => new Date())
  const timers = useRef({})
  const frame = useRef(null)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    const pending = timers.current
    return () => { clearInterval(t); Object.values(pending).forEach(clearTimeout) }
  }, [])

  const cam = CAMERAS.find((c) => c.id === selected)
  const state = states[selected]
  const set = (id, patch) => setStates((s) => ({ ...s, [id]: { ...s[id], ...patch } }))

  const start = (c) => {
    set(c.id, { status: 'Connecting', error: '' })
    timers.current[c.id] = setTimeout(() => {
      if (c.reachable) set(c.id, { status: 'Online', error: '' })
      else set(c.id, { status: 'Offline', error: `${c.name} did not respond. Check the camera power and cable, then try again.` })
    }, 1600)
  }
  const stop = (c) => {
    clearTimeout(timers.current[c.id])
    set(c.id, { status: 'Offline', error: '' })
  }
  const canFullscreen = typeof document !== 'undefined' && !!document.fullscreenEnabled
  const fullscreen = () => frame.current?.requestFullscreen?.()

  const onlineCount = Object.values(states).filter((s) => s.status === 'Online').length

  return (
    <div>
      <PageHeader title="Vehicle cameras" description={`${onlineCount} of ${CAMERAS.length} cameras online.`} />
      <Notice tone="blue" icon={CameraIcon}>
        This page shows placeholder feeds only. It does not use your device camera and is not connected to a real CCTV system.
      </Notice>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_18rem]">
        <Card
          title={`${cam.name} · ${cam.location}`}
          action={<StatusBadge status={state.status} />}
          bodyClass="p-3 sm:p-4"
        >
          <div ref={frame} className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg bg-slate-900 text-white">
            {state.status === 'Online' && (
              <>
                <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.03)_0,rgba(255,255,255,0.03)_2px,transparent_2px,transparent_4px)]" aria-hidden="true" />
                <div className="text-center" role="img" aria-label={`Camera feed for ${cam.name}`}>
                  <CameraIcon size={44} className="mx-auto text-slate-500" />
                  <p className="mt-2 text-sm font-semibold">Live feed</p>
                </div>
                <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded bg-black/60 px-2 py-1 text-xs font-semibold">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" aria-hidden="true" /> LIVE
                </span>
                <span className="absolute right-3 top-3 rounded bg-black/60 px-2 py-1 font-mono text-xs">{cam.id}</span>
                <span className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 font-mono text-xs">
                  {now.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'medium' })}
                </span>
              </>
            )}
            {state.status === 'Connecting' && (
              <div className="text-center" role="status">
                <Loader2 size={36} className="mx-auto animate-spin text-slate-300" />
                <p className="mt-2 text-sm">Connecting to {cam.name}…</p>
              </div>
            )}
            {state.status === 'Offline' && (
              <div className="px-6 text-center">
                {state.error ? <CircleAlert size={40} className="mx-auto text-red-400" /> : <VideoOff size={40} className="mx-auto text-slate-500" />}
                <p className="mt-2 text-sm font-semibold">{state.error ? 'Camera unavailable' : 'Camera is off'}</p>
                <p className="mt-1 text-xs text-slate-400">{state.error || 'Press Start feed to begin the preview.'}</p>
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {state.status === 'Online' ? (
              <Button variant="secondary" icon={Square} onClick={() => stop(cam)}>Stop feed</Button>
            ) : (
              <Button icon={Play} onClick={() => start(cam)} disabled={state.status === 'Connecting'}>
                {state.error ? 'Try again' : 'Start feed'}
              </Button>
            )}
            {canFullscreen && (
              <Button variant="secondary" icon={Maximize2} onClick={fullscreen} disabled={state.status !== 'Online'}>Full screen</Button>
            )}
          </div>
        </Card>

        <Card title="Cameras" bodyClass="p-2">
          <ul className="space-y-1" aria-label="Select camera">
            {CAMERAS.map((c) => {
              const active = c.id === selected
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(c.id)}
                    aria-pressed={active}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-brand/40 ${
                      active ? 'border-brand bg-brand/5' : 'border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-navy">{c.name}</span>
                      <span className="block truncate text-xs text-slate-500">{c.id} · {c.location}</span>
                    </span>
                    <StatusBadge status={states[c.id].status} />
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>
    </div>
  )
}
