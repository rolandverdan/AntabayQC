import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, Eye, MapPin, Pencil, Trash2 } from 'lucide-react'
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
import MapPicker from '../components/MapPicker.jsx'
import MapView from '../components/MapView.jsx'
import { inputClass } from '../utils/ui.js'
import { includesText, nextId } from '../utils/format.js'
import { downloadCsv, todayStamp } from '../utils/csv.js'
import { exportCategory } from '../utils/exportConfig.js'
import { ACCOUNT_STATUSES } from '../data/constants.js'

export default function CreateBusStops() {
  const { stops, routes, saveStop, deleteStop } = useAdminData()
  const { notify } = useToast()
  const [params, setParams] = useSearchParams()

  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [routeF, setRouteF] = useState('')
  const [form, setForm] = useState(null)
  const [isEdit, setIsEdit] = useState(false)
  const [errors, setErrors] = useState({})
  const [viewId, setViewId] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const routesOf = (stopId) => routes.filter((r) => r.stopIds.includes(stopId))

  const openCreate = () => {
    setErrors({}); setIsEdit(false)
    setForm({ id: nextId('S', stops), name: '', address: '', lat: '', lng: '', status: 'Active', routeIds: [] })
  }
  const openEdit = (s) => { setErrors({}); setIsEdit(true); setForm({ ...s, lat: String(s.lat), lng: String(s.lng), routeIds: routesOf(s.id).map((r) => r.id) }) }

  useEffect(() => {
    if (params.get('new')) { openCreate(); setParams({}, { replace: true }) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const rows = useMemo(
    () => stops.filter((s) =>
      (!status || s.status === status) && (!routeF || routes.find((r) => r.id === routeF)?.stopIds.includes(s.id)) &&
      (!q || includesText([s.id, s.name, s.address], q))),
    [stops, routes, q, status, routeF],
  )

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const toggleRoute = (id) => setForm((f) => ({ ...f, routeIds: f.routeIds.includes(id) ? f.routeIds.filter((r) => r !== id) : [...f.routeIds, id] }))
  const picked = form && form.lat !== '' && form.lng !== '' && Number.isFinite(+form.lat) && Number.isFinite(+form.lng) ? { lat: +form.lat, lng: +form.lng } : null
  const outsideQC = picked && (picked.lat < 14.55 || picked.lat > 14.78 || picked.lng < 120.97 || picked.lng > 121.15)

  const submit = (ev) => {
    ev.preventDefault()
    const e = {}
    const id = form.id.trim().toUpperCase()
    if (!id) e.id = 'Stop ID is required.'
    else if (!isEdit && stops.some((s) => s.id === id)) e.id = 'Stop ID already exists.'
    if (!form.name.trim()) e.name = 'Stop name is required.'
    if (!form.address.trim()) e.address = 'Address / location description is required.'
    const lat = Number(form.lat), lng = Number(form.lng)
    if (form.lat === '' || !Number.isFinite(lat) || lat < -90 || lat > 90) e.lat = 'Valid latitude required (click the map to pick).'
    if (form.lng === '' || !Number.isFinite(lng) || lng < -180 || lng > 180) e.lng = 'Valid longitude required.'
    setErrors(e)
    if (Object.keys(e).length) return
    saveStop({ id, name: form.name.trim(), address: form.address.trim(), lat, lng, status: form.status }, form.routeIds)
    notify(`Bus stop ${id} ${isEdit ? 'updated' : 'added'} successfully.`)
    setForm(null)
  }

  const tryDelete = (s) => {
    const used = routesOf(s.id)
    if (used.length) notify(`${s.name} is used by ${used.map((r) => r.id).join(', ')}. Remove it from those routes first (Edit → untick the routes).`, 'error')
    else setConfirm(s)
  }

  const view = stops.find((s) => s.id === viewId)

  // Exports exactly what the table shows: same search and filters.
  const exportCsv = () => {
    if (!rows.length) {
      notify('No bus stops match the current search and filters, so nothing was exported.', 'error')
      return
    }
    const cat = exportCategory('stops')
    downloadCsv(`antabay-${cat.file}-${todayStamp()}.csv`, rows, cat.columns())
    notify(`Exported ${rows.length} record(s) to CSV.`, 'info')
  }

  const columns = [
    { key: 'id', header: 'Stop ID', render: (s) => <span className="font-semibold text-navy">{s.id}</span> },
    { key: 'name', header: 'Name', render: (s) => (<div><p className="font-semibold text-navy">{s.name}</p><p className="max-w-56 truncate text-xs text-slate-500">{s.address}</p></div>) },
    { key: 'coords', header: 'Latitude, longitude', render: (s) => <span className="font-mono text-xs">{s.lat.toFixed(4)}, {s.lng.toFixed(4)}</span> },
    { key: 'routes', header: 'Routes', render: (s) => (<div className="flex flex-wrap gap-1">{routesOf(s.id).map((r) => <Badge key={r.id} tone="blue">{r.id}</Badge>)}{routesOf(s.id).length === 0 && <span className="text-slate-400">None</span>}</div>) },
    { key: 'status', header: 'Status', render: (s) => <Badge>{s.status}</Badge> },
    {
      key: 'actions', header: 'Actions', render: (s) => (
        <div className="flex gap-0.5">
          <IconButton icon={Eye} title="View details" onClick={() => setViewId(s.id)} />
          <IconButton icon={Pencil} title="Edit" onClick={() => openEdit(s)} />
          <IconButton icon={Trash2} tone="danger" title="Delete" onClick={() => tryDelete(s)} />
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader hideTitle title="Bus Stops" description="Create and manage bus stops. Click the map in the form to set coordinates." actions={<><Button icon={Download} variant="secondary" onClick={exportCsv} disabled={rows.length === 0}>Export CSV ({rows.length})</Button><Button icon={MapPin} onClick={openCreate}>Add Bus Stop</Button></>} />
      <SearchFilterBar
        search={q} onSearch={setQ} placeholder="Search stop ID, name, address…"
        filters={[
          { label: 'Status', value: status, onChange: setStatus, options: ACCOUNT_STATUSES.map((s) => ({ value: s, label: s })) },
          { label: 'Route', value: routeF, onChange: setRouteF, options: routes.map((r) => ({ value: r.id, label: `${r.id} ${r.name}` })) },
        ]}
        onClear={() => { setQ(''); setStatus(''); setRouteF('') }}
      />
      <DataTable columns={columns} rows={rows} emptyTitle="No bus stops match" />

      <Modal
        size="lg" open={!!form} onClose={() => setForm(null)} title={isEdit ? `Edit ${form?.id}` : 'Add bus stop'}
        footer={<><Button variant="secondary" onClick={() => setForm(null)}>Cancel</Button><Button type="submit" form="stop-form">{isEdit ? 'Save changes' : 'Add bus stop'}</Button></>}
      >
        {form && (
          <form id="stop-form" onSubmit={submit} noValidate className="grid gap-5 md:grid-cols-2">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Stop ID" required error={errors.id}><input className={inputClass(errors.id)} value={form.id} onChange={set('id')} disabled={isEdit} /></Field>
                <Field label="Status"><select className={inputClass(false)} value={form.status} onChange={set('status')}>{ACCOUNT_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></Field>
              </div>
              <Field label="Bus stop name" required error={errors.name}><input className={inputClass(errors.name)} value={form.name} onChange={set('name')} /></Field>
              <Field label="Address / location description" required error={errors.address}><input className={inputClass(errors.address)} value={form.address} onChange={set('address')} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Latitude" required error={errors.lat}><input className={inputClass(errors.lat)} value={form.lat} onChange={set('lat')} inputMode="decimal" placeholder="14.6500" /></Field>
                <Field label="Longitude" required error={errors.lng}><input className={inputClass(errors.lng)} value={form.lng} onChange={set('lng')} inputMode="decimal" placeholder="121.0500" /></Field>
              </div>
              {outsideQC && <p className="text-xs font-medium text-amber-700">These coordinates look outside Quezon City. Double-check before saving.</p>}
              <div>
                <p className="mb-1 text-xs font-semibold text-navy">Routes serving this stop</p>
                <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
                  {routes.map((r) => (
                    <label key={r.id} className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" className="accent-brand" checked={form.routeIds.includes(r.id)} onChange={() => toggleRoute(r.id)} />
                      {r.id} · {r.name} {r.status === 'Inactive' && <span className="text-xs text-slate-400">(inactive)</span>}
                    </label>
                  ))}
                </div>
                <p className="mt-1 text-xs text-slate-500">Newly ticked routes get this stop added at the end; reorder it in Create Routes.</p>
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-navy">Pick location on map (OpenStreetMap)</p>
              <MapPicker className="h-72 md:h-full md:min-h-80" value={picked} onChange={({ lat, lng }) => setForm((f) => ({ ...f, lat: String(lat), lng: String(lng) }))} />
            </div>
          </form>
        )}
      </Modal>

      <Modal open={!!view} onClose={() => setViewId(null)} title={view ? view.name : ''} footer={<Button variant="secondary" onClick={() => setViewId(null)}>Close</Button>}>
        {view && (
          <div className="space-y-4">
            <DetailGrid items={[
              ['Stop ID', view.id], ['Status', view.status], ['Address', view.address, true],
              ['Latitude', view.lat], ['Longitude', view.lng],
              ['Routes serving', routesOf(view.id).map((r) => `${r.id} ${r.name}`).join(', ') || 'None', true],
            ]} />
            <MapView stops={[view]} className="h-56" scrollWheelZoom={false} />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirm} title="Delete bus stop?" confirmLabel="Delete"
        message={confirm ? `${confirm.id} · ${confirm.name} will be permanently removed.` : ''}
        onCancel={() => setConfirm(null)}
        onConfirm={() => { deleteStop(confirm.id); notify(`${confirm.name} deleted.`); setConfirm(null) }}
      />
    </>
  )
}
