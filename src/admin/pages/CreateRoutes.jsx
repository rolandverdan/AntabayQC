import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, Ban, CircleCheck, Eye, Pencil, Plus, Route as RouteIcon, X } from 'lucide-react'
import { useAdminData } from '../context/AdminDataContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { PageHeader } from '../components/Card.jsx'
import Button, { IconButton } from '../components/Button.jsx'
import Badge from '../components/Badge.jsx'
import DataTable from '../components/DataTable.jsx'
import SearchFilterBar from '../components/SearchFilterBar.jsx'
import Modal from '../components/Modal.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import Field from '../components/FormField.jsx'
import DetailGrid from '../components/DetailGrid.jsx'
import MapView from '../components/MapView.jsx'
import { inputClass } from '../utils/ui.js'
import { includesText, nextId } from '../utils/format.js'
import { routeColor } from '../utils/geo.js'
import { ACCOUNT_STATUSES } from '../data/constants.js'

export default function CreateRoutes() {
  const { routes, stops, buses, stopsById, saveRoute, setRouteStatus } = useAdminData()
  const { notify } = useToast()
  const [params, setParams] = useSearchParams()

  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [form, setForm] = useState(null)
  const [isEdit, setIsEdit] = useState(false)
  const [errors, setErrors] = useState({})
  const [addStop, setAddStop] = useState('')
  const [viewId, setViewId] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const busesOf = (routeId) => buses.filter((b) => b.routeId === routeId)
  const stopName = (id) => stopsById[id]?.name || id
  const ends = (r) => ({ origin: stopName(r.stopIds[0]), dest: stopName(r.stopIds[r.stopIds.length - 1]) })

  const openCreate = () => { setErrors({}); setIsEdit(false); setAddStop(''); setForm({ id: nextId('R', routes, 2), name: '', status: 'Active', stopIds: [], busIds: [] }) }
  const openEdit = (r) => { setErrors({}); setIsEdit(true); setAddStop(''); setForm({ ...r, busIds: busesOf(r.id).map((b) => b.id) }) }

  useEffect(() => {
    if (params.get('new')) { openCreate(); setParams({}, { replace: true }) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const rows = useMemo(
    () => routes.filter((r) => (!status || r.status === status) && (!q || includesText([r.id, r.name, stopName(r.stopIds[0]), stopName(r.stopIds[r.stopIds.length - 1])], q))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [routes, stopsById, q, status],
  )

  const move = (i, d) => setForm((f) => {
    const s = [...f.stopIds]; const j = i + d
    if (j < 0 || j >= s.length) return f
    ;[s[i], s[j]] = [s[j], s[i]]
    return { ...f, stopIds: s }
  })
  const removeStop = (i) => setForm((f) => ({ ...f, stopIds: f.stopIds.filter((_, k) => k !== i) }))
  const addSelectedStop = () => { if (addStop) { setForm((f) => ({ ...f, stopIds: [...f.stopIds, addStop] })); setAddStop('') } }
  const toggleBus = (id) => setForm((f) => ({ ...f, busIds: f.busIds.includes(id) ? f.busIds.filter((b) => b !== id) : [...f.busIds, id] }))

  const submit = (ev) => {
    ev.preventDefault()
    const e = {}
    if (!form.name.trim()) e.name = 'Route name is required.'
    else if (routes.some((r) => r.id !== form.id && r.name.toLowerCase() === form.name.trim().toLowerCase())) e.name = 'A route with this name already exists.'
    if (form.stopIds.length < 2) e.stops = 'Add at least two stops (origin and destination).'
    setErrors(e)
    if (Object.keys(e).length) return
    saveRoute({ id: form.id, name: form.name.trim(), status: form.status, stopIds: form.stopIds }, form.busIds)
    notify(`Route ${form.id} ${isEdit ? 'updated' : 'created'} successfully.`)
    setForm(null)
  }

  const mapRoute = (r) => ({ id: r.id, name: r.name, color: routeColor(r.id, r), points: r.stopIds.map((id) => stopsById[id]).filter(Boolean) })
  const view = routes.find((r) => r.id === viewId)
  const availableStops = form ? stops.filter((s) => s.status === 'Active' && !form.stopIds.includes(s.id)) : []

  const columns = [
    { key: 'id', header: 'Route ID', render: (r) => <span className="flex items-center gap-2 font-semibold text-navy"><span className="h-3 w-3 rounded-full" style={{ background: routeColor(r.id, r) }} />{r.id}</span> },
    { key: 'name', header: 'Route name' },
    { key: 'ends', header: 'Origin → destination', render: (r) => (r.stopIds.length ? <span>{ends(r).origin} <span className="text-slate-400">→</span> {ends(r).dest}</span> : '—') },
    { key: 'n', header: 'Stops', render: (r) => r.stopIds.length },
    { key: 'buses', header: 'Assigned buses', render: (r) => (<div className="flex flex-wrap gap-1">{busesOf(r.id).map((b) => <Badge key={b.id} tone="blue">{b.id}</Badge>)}{busesOf(r.id).length === 0 && <span className="text-slate-400">None</span>}</div>) },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status}</Badge> },
    {
      key: 'actions', header: 'Actions', render: (r) => (
        <div className="flex gap-0.5">
          <IconButton icon={Eye} title="View details" onClick={() => setViewId(r.id)} />
          <IconButton icon={Pencil} title="Edit" onClick={() => openEdit(r)} />
          {r.status === 'Active'
            ? <IconButton icon={Ban} tone="danger" title="Deactivate" onClick={() => setConfirm(r)} />
            : <IconButton icon={CircleCheck} tone="success" title="Reactivate" onClick={() => { setRouteStatus(r.id, 'Active'); notify(`${r.name} reactivated.`) }} />}
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader title="Routes" description="Define routes by selecting existing bus stops and arranging them in order." actions={<Button icon={RouteIcon} onClick={openCreate}>Add Route</Button>} />
      <SearchFilterBar
        search={q} onSearch={setQ} placeholder="Search route ID, name, origin, destination…"
        filters={[{ label: 'Status', value: status, onChange: setStatus, options: ACCOUNT_STATUSES.map((s) => ({ value: s, label: s })) }]}
        onClear={() => { setQ(''); setStatus('') }}
      />
      <DataTable columns={columns} rows={rows} emptyTitle="No routes match" />

      <Modal
        size="lg" open={!!form} onClose={() => setForm(null)} title={isEdit ? `Edit ${form?.id}` : 'Add route'}
        footer={<><Button variant="secondary" onClick={() => setForm(null)}>Cancel</Button><Button type="submit" form="route-form">{isEdit ? 'Save changes' : 'Create route'}</Button></>}
      >
        {form && (
          <form id="route-form" onSubmit={submit} noValidate className="grid gap-5 md:grid-cols-2">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Field label="Route ID"><input className={inputClass(false)} value={form.id} disabled /></Field>
                <Field label="Status" className="col-span-2"><select className={inputClass(false)} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>{ACCOUNT_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></Field>
              </div>
              <Field label="Route name" required error={errors.name}><input className={inputClass(errors.name)} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>

              <div>
                <p className="mb-1 text-xs font-semibold text-navy">Ordered bus stops <span className="text-red-500">*</span></p>
                <div className="flex gap-2">
                  <select className={inputClass(false)} value={addStop} onChange={(e) => setAddStop(e.target.value)} aria-label="Select a stop to add">
                    <option value="">Select a stop to add…</option>
                    {availableStops.map((s) => <option key={s.id} value={s.id}>{s.id} · {s.name}</option>)}
                  </select>
                  <Button icon={Plus} variant="secondary" onClick={addSelectedStop} disabled={!addStop}>Add</Button>
                </div>
                {errors.stops && <p className="mt-1 text-xs font-medium text-red-600">{errors.stops}</p>}
                <ol className="mt-2 space-y-1.5">
                  {form.stopIds.map((id, i) => (
                    <li key={id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate">{stopName(id)}
                        {i === 0 && <span className="ml-1 text-xs text-green-700">(origin)</span>}
                        {i === form.stopIds.length - 1 && form.stopIds.length > 1 && <span className="ml-1 text-xs text-red-700">(destination)</span>}
                      </span>
                      <IconButton icon={ArrowUp} title="Move up" onClick={() => move(i, -1)} disabled={i === 0} />
                      <IconButton icon={ArrowDown} title="Move down" onClick={() => move(i, 1)} disabled={i === form.stopIds.length - 1} />
                      <IconButton icon={X} tone="danger" title="Remove stop" onClick={() => removeStop(i)} />
                    </li>
                  ))}
                  {form.stopIds.length === 0 && <li className="text-xs text-slate-500">No stops yet. Origin is the first stop, destination is the last.</li>}
                </ol>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold text-navy">Assigned buses</p>
                <div className="max-h-28 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
                  {buses.map((b) => (
                    <label key={b.id} className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" className="accent-brand" checked={form.busIds.includes(b.id)} onChange={() => toggleBus(b.id)} />
                      {b.id} <span className="text-xs text-slate-400">{b.routeId && b.routeId !== form.id ? `(currently ${b.routeId})` : ''}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-navy">Route preview</p>
              <MapView stops={form.stopIds.map((id) => stopsById[id]).filter(Boolean)} routes={[mapRoute(form)]} className="h-72 md:h-full md:min-h-96" scrollWheelZoom={false} />
              <p className="mt-1 text-xs text-slate-500">Schematic line connecting stops in order (not road-snapped).</p>
            </div>
          </form>
        )}
      </Modal>

      <Modal size="lg" open={!!view} onClose={() => setViewId(null)} title={view ? `${view.id} · ${view.name}` : ''} footer={<Button variant="secondary" onClick={() => setViewId(null)}>Close</Button>}>
        {view && (
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-4">
              <DetailGrid items={[
                ['Route ID', view.id], ['Status', view.status], ['Origin', ends(view).origin], ['Destination', ends(view).dest],
                ['Assigned buses', busesOf(view.id).map((b) => b.id).join(', ') || 'None', true],
              ]} />
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Stops in order</p>
                <ol className="list-decimal space-y-0.5 pl-5 text-sm">{view.stopIds.map((id) => <li key={id}>{stopName(id)}</li>)}</ol>
              </div>
            </div>
            <MapView stops={view.stopIds.map((id) => stopsById[id]).filter(Boolean)} routes={[mapRoute(view)]} className="h-72" scrollWheelZoom={false} />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirm} title="Deactivate route?" confirmLabel="Deactivate"
        message={confirm ? `${confirm.id} · ${confirm.name} will be set to Inactive and hidden from the live map.${busesOf(confirm.id).length ? ` ${busesOf(confirm.id).length} bus(es) are still assigned to it.` : ''}` : ''}
        onCancel={() => setConfirm(null)}
        onConfirm={() => { setRouteStatus(confirm.id, 'Inactive'); notify(`${confirm.name} deactivated.`); setConfirm(null) }}
      />
    </>
  )
}
