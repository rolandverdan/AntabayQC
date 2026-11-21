import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Ban, CircleCheck, Download, Eye, Pencil, Route as RouteIcon } from 'lucide-react'
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
import MapView from '../components/MapView.jsx'
import { inputClass } from '../utils/ui.js'
import { includesText, nextId } from '../utils/format.js'
import { downloadCsv, todayStamp } from '../utils/csv.js'
import { exportCategory } from '../utils/exportConfig.js'
import { ROUTE_COLORS, routeColor } from '../utils/geo.js'
import { ACCOUNT_STATUSES } from '../data/constants.js'
import Select from '../../shared/components/Select.jsx'
import { Section } from '../components/FormParts.jsx'

export default function CreateRoutes() {
  const { routes, buses, stopsById, saveRoute, setRouteStatus } = useAdminData()
  const { notify } = useToast()
  const [params, setParams] = useSearchParams()

  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [form, setForm] = useState(null)
  const [isEdit, setIsEdit] = useState(false)
  const [errors, setErrors] = useState({})
  const [viewId, setViewId] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [saving, setSaving] = useState(false)

  const busesOf = (routeId) => buses.filter((b) => b.routeId === routeId)
  const stopName = (id) => stopsById[id]?.name || id
  const ends = (r) => {
    const stopIds = r.stopIds || []
    return { origin: stopName(stopIds[0]), dest: stopName(stopIds[stopIds.length - 1]) }
  }

  const openCreate = () => {
    const id = nextId('R', routes, 2)
    setErrors({})
    setIsEdit(false)
    setForm({ id, name: '', status: 'Active', color: routeColor(id), stopIds: [] })
  }
  const openEdit = (r) => {
    setErrors({})
    setIsEdit(true)
    setForm({ ...r, color: routeColor(r.id, r), stopIds: r.stopIds || [] })
  }

  useEffect(() => {
    if (params.get('new')) { openCreate(); setParams({}, { replace: true }) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const rows = useMemo(
    () => routes.filter((r) => (!status || r.status === status) && (!q || includesText([r.id, r.name, stopName(r.stopIds?.[0]), stopName(r.stopIds?.[r.stopIds.length - 1])], q))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [routes, stopsById, q, status],
  )

  const submit = async (ev) => {
    ev.preventDefault()
    const e = {}
    if (!form.name.trim()) e.name = 'Route name is required.'
    else if (routes.some((r) => r.id !== form.id && r.name.toLowerCase() === form.name.trim().toLowerCase())) e.name = 'A route with this name already exists.'
    setErrors(e)
    if (Object.keys(e).length) return
    setSaving(true)
    try {
      await saveRoute({ id: form.id, name: form.name.trim(), status: form.status, color: form.color, stopIds: form.stopIds || [] })
      notify(`Route ${form.id} ${isEdit ? 'updated' : 'created'} successfully.`)
      setForm(null)
    } catch (error) {
      notify(error.message || 'Could not save the route.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const mapRoute = (r) => ({ id: r.id, name: r.name, color: routeColor(r.id, r), points: (r.stopIds || []).map((id) => stopsById[id]).filter(Boolean) })
  const view = routes.find((r) => r.id === viewId)

  // Exports exactly what the table shows: same search and filters.
  const exportCsv = () => {
    if (!rows.length) {
      notify('No routes match the current search and filters, so nothing was exported.', 'error')
      return
    }
    const cat = exportCategory('routes')
    downloadCsv(`antabay-${cat.file}-${todayStamp()}.csv`, rows, cat.columns({ stopsById }))
    notify(`Exported ${rows.length} record(s) to CSV.`, 'info')
  }

  const columns = [
    { key: 'id', header: 'Route ID', render: (r) => <span className="flex items-center gap-2 font-semibold text-navy"><span className="h-3 w-3 rounded-full" style={{ background: routeColor(r.id, r) }} />{r.id}</span> },
    { key: 'name', header: 'Route name' },
    { key: 'ends', header: 'Origin → destination', render: (r) => ((r.stopIds || []).length ? <span>{ends(r).origin} <span className="text-slate-400">→</span> {ends(r).dest}</span> : '—') },
    { key: 'n', header: 'Stops', render: (r) => (r.stopIds || []).length },
    { key: 'buses', header: 'Assigned buses', render: (r) => (<div className="flex flex-wrap gap-1">{busesOf(r.id).map((b) => <Badge key={b.id} tone="blue">{b.id}</Badge>)}{busesOf(r.id).length === 0 && <span className="text-slate-400">None</span>}</div>) },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status}</Badge> },
    {
      key: 'actions', header: 'Actions', render: (r) => (
        <div className="flex gap-0.5">
          <IconButton icon={Eye} title="View details" onClick={() => setViewId(r.id)} />
          <IconButton icon={Pencil} title="Edit" onClick={() => openEdit(r)} />
          {r.status === 'Active'
            ? <IconButton icon={Ban} tone="danger" title="Deactivate" onClick={() => setConfirm(r)} />
            : <IconButton icon={CircleCheck} tone="success" title="Reactivate" onClick={async () => {
                try {
                  await setRouteStatus(r.id, 'Active')
                  notify(`${r.name} reactivated.`)
                } catch (error) {
                  notify(error.message || 'Could not reactivate the route.', 'error')
                }
              }} />}
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader title="Routes" description="Add routes first. Add bus stops to routes from Bus Stops, then assign routes to buses." actions={<><Button icon={Download} variant="secondary" onClick={exportCsv} disabled={rows.length === 0}>Export CSV ({rows.length})</Button><Button icon={RouteIcon} onClick={openCreate}>Add Route</Button></>} />
      <SearchFilterBar
        search={q} onSearch={setQ} placeholder="Search route ID, name, origin, destination…"
        filters={[{ label: 'Status', value: status, onChange: setStatus, options: ACCOUNT_STATUSES.map((s) => ({ value: s, label: s })) }]}
        onClear={() => { setQ(''); setStatus('') }}
      />
      <DataTable columns={columns} rows={rows} emptyTitle="No routes match" />

      <Modal
        size="lg" open={!!form} onClose={() => setForm(null)} title={isEdit ? `Edit ${form?.id}` : 'Add route'}
        footer={<><Button variant="secondary" onClick={() => setForm(null)} disabled={saving}>Cancel</Button><Button type="submit" form="route-form" disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create route'}</Button></>}
      >
        {form && (
          <form id="route-form" onSubmit={submit} noValidate className="space-y-6">
            <Section title="Route details">
              <div className="grid items-start gap-x-4 gap-y-5 sm:grid-cols-2">
                <Field label="Route ID"><input className={`${inputClass(false)} cursor-not-allowed`} value={form.id} disabled /></Field>
                <Field label="Status"><Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>{ACCOUNT_STATUSES.map((s) => <option key={s}>{s}</option>)}</Select></Field>
                <Field label="Route name" required error={errors.name} className="sm:col-span-2"><input className={inputClass(errors.name)} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
                <Field label="Route color" className="sm:col-span-2">
                  <div className="flex items-center gap-3">
                    <input type="color" aria-label="Route color" className="h-10 w-14 cursor-pointer rounded border border-slate-200 bg-white p-1" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} />
                    <span className="font-mono text-sm uppercase text-slate-600">{form.color}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ROUTE_COLORS.map((color, i) => (
                      <button key={color} type="button" aria-label={`Use route color ${i + 1}`} aria-pressed={form.color.toLowerCase() === color.toLowerCase()} onClick={() => setForm((f) => ({ ...f, color }))} className={`h-7 w-7 rounded-full border-2 ${form.color.toLowerCase() === color.toLowerCase() ? 'border-slate-900 ring-2 ring-slate-300' : 'border-white shadow ring-1 ring-slate-200'}`} style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </Field>
              </div>
            </Section>
          </form>
        )}
      </Modal>

      <Modal size="lg" open={!!view} onClose={() => setViewId(null)} title={view ? `${view.id} · ${view.name}` : ''} footer={<Button variant="secondary" onClick={() => setViewId(null)}>Close</Button>}>
        {view && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
              <Section title="Route details">
                <div className="grid grid-cols-2 items-start gap-x-4 gap-y-4">
                  <div><p className="text-xs font-semibold text-navy">Route ID</p><p className="mt-1 text-sm text-slate-800">{view.id}</p></div>
                  <div><p className="text-xs font-semibold text-navy">Status</p><div className="mt-1"><Badge>{view.status}</Badge></div></div>
                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-navy">Route color</p>
                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-800"><span className="h-4 w-4 rounded-full" style={{ backgroundColor: routeColor(view.id, view) }} />{routeColor(view.id, view)}</div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-navy">Assigned buses</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {busesOf(view.id).map((b) => <Badge key={b.id} tone="blue">{b.id}</Badge>)}
                      {busesOf(view.id).length === 0 && <span className="text-sm text-slate-400">None</span>}
                    </div>
                  </div>
                </div>
              </Section>
              <Section title="Stops in order">
                <ol className="divide-y divide-slate-100">
                  {(view.stopIds || []).map((id, i) => {
                    const first = i === 0
                    const last = i === (view.stopIds || []).length - 1 && (view.stopIds || []).length > 1
                    return (
                      <li key={id} className="flex items-center gap-3 py-2 text-sm">
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${first ? 'bg-green-600' : last ? 'bg-red-600' : 'bg-brand'}`}>{i + 1}</span>
                        <span className="min-w-0 flex-1 truncate text-slate-800">{stopName(id)}</span>
                        {first && <Badge tone="green">Origin</Badge>}
                        {last && <Badge tone="red">Destination</Badge>}
                      </li>
                    )
                  })}
                  {(view.stopIds || []).length === 0 && <li className="py-2 text-sm text-slate-500">No stops yet. Add a bus stop and select this route.</li>}
                </ol>
              </Section>
            </div>
            <div className="flex min-h-0 flex-col">
              <h3 className="mb-4 rounded-md border-l-4 border-brand bg-slate-100 px-3 py-1.5 text-xs font-bold text-navy">Route preview</h3>
              <MapView stops={(view.stopIds || []).map((id) => stopsById[id]).filter(Boolean)} routes={[mapRoute(view)]} numbered roadSnap emptyMessage="This route has no stops yet." className="h-72 md:h-auto md:min-h-80 md:flex-1" scrollWheelZoom={false} />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirm} title="Deactivate route?" confirmLabel="Deactivate"
        message={confirm ? `${confirm.id} · ${confirm.name} will be set to Inactive and hidden from the live map.${busesOf(confirm.id).length ? ` ${busesOf(confirm.id).length} bus(es) are still assigned to it.` : ''}` : ''}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          try {
            await setRouteStatus(confirm.id, 'Inactive')
            notify(`${confirm.name} deactivated.`)
            setConfirm(null)
          } catch (error) {
            notify(error.message || 'Could not deactivate the route.', 'error')
          }
        }}
      />
    </>
  )
}
