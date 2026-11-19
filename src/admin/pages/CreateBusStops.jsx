import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, Eye, MapPin, Pencil, Plus, Trash2, X } from 'lucide-react'
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
import { routeColor } from '../utils/geo.js'
import { ACCOUNT_STATUSES } from '../data/constants.js'
import Select from '../../shared/components/Select.jsx'
import { Section } from '../components/FormParts.jsx'

export default function CreateBusStops() {
  const { stops, routes, stopsById, saveStop, deleteStop } = useAdminData()
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
  const [saving, setSaving] = useState(false)

  const routesOf = (stopId) => routes.filter((r) => (r.stopIds || []).includes(stopId))

  const openCreate = () => {
    setErrors({}); setIsEdit(false)
    setForm({ id: nextId('S', stops), name: '', lat: '', lng: '', status: 'Active', routeIds: [''] })
  }
  const openEdit = (s) => {
    const routeIds = routesOf(s.id).map((r) => r.id)
    setErrors({})
    setIsEdit(true)
    setForm({ ...s, lat: String(s.lat), lng: String(s.lng), routeIds: routeIds.length ? routeIds : [''] })
  }

  useEffect(() => {
    if (params.get('new')) { openCreate(); setParams({}, { replace: true }) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const rows = useMemo(
    () => stops.filter((s) =>
      (!status || s.status === status) && (!routeF || (routes.find((r) => r.id === routeF)?.stopIds || []).includes(s.id)) &&
      (!q || includesText([s.id, s.name, s.address], q))),
    [stops, routes, q, status, routeF],
  )

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const setRoute = (index, id) => {
    setForm((f) => ({
      ...f,
      routeIds: f.routeIds.map((routeId, i) => (i === index ? id : routeId)),
    }))
    setErrors((current) => ({ ...current, routeIds: '' }))
  }
  const addRoute = () => setForm((f) => ({ ...f, routeIds: [...f.routeIds, ''] }))
  const removeRoute = (index) => setForm((f) => {
    const routeIds = f.routeIds.filter((_, i) => i !== index)
    return { ...f, routeIds: routeIds.length ? routeIds : [''] }
  })
  const picked = form && form.lat !== '' && form.lng !== '' && Number.isFinite(+form.lat) && Number.isFinite(+form.lng) ? { lat: +form.lat, lng: +form.lng } : null
  const outsideQC = picked && (picked.lat < 14.55 || picked.lat > 14.78 || picked.lng < 120.97 || picked.lng > 121.15)
  const selectedRouteIds = form ? form.routeIds.filter(Boolean) : []
  const routePreviews = form
    ? routes.filter((route) => selectedRouteIds.includes(route.id)).map((route) => ({
        id: route.id,
        name: route.name,
        color: routeColor(route.id, route),
        points: (route.stopIds || []).map((id) => stopsById[id]).filter((stop) => stop && Number.isFinite(stop.lat) && Number.isFinite(stop.lng)),
      }))
    : []

  const submit = async (ev) => {
    ev.preventDefault()
    const e = {}
    const id = form.id.trim().toUpperCase()
    if (!id) e.id = 'Stop ID is required.'
    else if (id.includes('/')) e.id = 'Stop ID cannot contain a slash.'
    else if (!isEdit && stops.some((s) => s.id === id)) e.id = 'Stop ID already exists.'
    if (!form.name.trim()) e.name = 'Stop name is required.'
    if (!form.routeIds.some(Boolean)) e.routeIds = 'Select at least one route before adding a bus stop.'
    const lat = Number(form.lat), lng = Number(form.lng)
    if (form.lat === '' || !Number.isFinite(lat) || lat < -90 || lat > 90 || form.lng === '' || !Number.isFinite(lng) || lng < -180 || lng > 180) {
      e.location = 'Click the map to choose this bus stop’s location.'
    }
    setErrors(e)
    if (Object.keys(e).length) return
    setSaving(true)
    try {
      await saveStop({ id, name: form.name.trim(), lat, lng, status: form.status }, form.routeIds.filter(Boolean))
      notify(`Bus stop ${id} ${isEdit ? 'updated' : 'added'} successfully.`)
      setForm(null)
    } catch (error) {
      notify(error.message || 'Could not save the bus stop.', 'error')
    } finally {
      setSaving(false)
    }
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
    { key: 'name', header: 'Name', render: (s) => (<div><p className="font-semibold text-navy">{s.name}</p>{s.address && <p className="max-w-56 truncate text-xs text-slate-500">{s.address}</p>}</div>) },
    { key: 'coords', header: 'Latitude, longitude', render: (s) => <span className="font-mono text-xs">{s.lat.toFixed(4)}, {s.lng.toFixed(4)}</span> },
    { key: 'routes', header: 'Routes', render: (s) => (<div className="flex flex-wrap gap-1">{routesOf(s.id).map((r) => <Badge key={r.id}><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ backgroundColor: routeColor(r.id, r) }} />{r.id}</Badge>)}{routesOf(s.id).length === 0 && <span className="text-slate-400">None</span>}</div>) },
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
      <PageHeader title="Create Bus Stops" description="Create bus stops by choosing their route, entering a name, and clicking the map to set the location." actions={<><Button icon={Download} variant="secondary" onClick={exportCsv} disabled={rows.length === 0}>Export CSV ({rows.length})</Button><Button icon={MapPin} onClick={openCreate}>Add Bus Stop</Button></>} />
      <SearchFilterBar
        search={q} onSearch={setQ} placeholder="Search stop ID or name…"
        filters={[
          { label: 'Status', value: status, onChange: setStatus, options: ACCOUNT_STATUSES.map((s) => ({ value: s, label: s })) },
          { label: 'Route', value: routeF, onChange: setRouteF, options: routes.map((r) => ({ value: r.id, label: `${r.id} ${r.name}` })) },
        ]}
        onClear={() => { setQ(''); setStatus(''); setRouteF('') }}
      />
      <DataTable columns={columns} rows={rows} emptyTitle="No bus stops match" />

      <Modal
        size="lg" open={!!form} onClose={() => setForm(null)} title={isEdit ? `Edit ${form?.id}` : 'Add bus stop'}
        footer={<><Button variant="secondary" onClick={() => setForm(null)} disabled={saving}>Cancel</Button><Button type="submit" form="stop-form" disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add bus stop'}</Button></>}
      >
        {form && (
          <form id="stop-form" onSubmit={submit} noValidate className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
              <Section title="Select route first">
                <p className="mb-3 text-xs text-slate-500">Choose one or more routes before entering this stop. Each route can have many stops.</p>
                <div className="space-y-2">
                  {form.routeIds.map((routeId, index) => {
                    const selectedRoute = routes.find((route) => route.id === routeId)
                    const availableRoutes = routes.filter((route) => !selectedRouteIds.includes(route.id) || route.id === routeId)
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: selectedRoute ? routeColor(selectedRoute.id, selectedRoute) : 'transparent' }} />
                        <div className="min-w-0 flex-1">
                          <Select aria-label={`Route ${index + 1}`} value={routeId} onChange={(event) => setRoute(index, event.target.value)}>
                            <option value="">Select a route…</option>
                            {availableRoutes.map((route) => <option key={route.id} value={route.id} data-desc={route.name}>{route.id}{route.status === 'Inactive' ? ' (inactive)' : ''}</option>)}
                          </Select>
                        </div>
                        {form.routeIds.length > 1 && <IconButton icon={X} title="Remove route" onClick={() => removeRoute(index)} />}
                      </div>
                    )
                  })}
                  <Button type="button" variant="secondary" icon={Plus} onClick={addRoute} disabled={!routes.length || form.routeIds.some((routeId) => !routeId) || selectedRouteIds.length >= routes.length}>
                    Add another route
                  </Button>
                  {routes.length === 0 && <p className="text-sm text-slate-500">Create a route first, then return here to add bus stops.</p>}
                </div>
                {errors.routeIds && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.routeIds}</p>}
              </Section>
              {selectedRouteIds.length > 0 && (
                <Section title="Stop details">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Stop ID" required error={errors.id}><input className={inputClass(errors.id)} value={form.id} onChange={set('id')} disabled={isEdit} /></Field>
                      <Field label="Status"><Select value={form.status} onChange={set('status')}>{ACCOUNT_STATUSES.map((s) => <option key={s}>{s}</option>)}</Select></Field>
                    </div>
                    <Field label="Bus stop name" required error={errors.name}><input className={inputClass(errors.name)} value={form.name} onChange={set('name')} /></Field>
                  </div>
                </Section>
              )}
            </div>
            {selectedRouteIds.length > 0 && (
              <Section title="Pick location on map" className="flex min-h-0 flex-col">
                <p className="mb-2 text-xs text-slate-500">Click the map to place the bus stop. The coordinates are set automatically.</p>
                <MapPicker routes={routePreviews} className="h-72 md:h-auto md:min-h-72 md:flex-1" value={picked} onChange={({ lat, lng }) => setForm((f) => ({ ...f, lat: String(lat), lng: String(lng) }))} />
                {picked
                  ? <p className="mt-2 text-xs text-slate-600">Selected: {picked.lat.toFixed(6)}, {picked.lng.toFixed(6)}</p>
                  : <p className="mt-2 text-xs text-slate-500">No location selected yet.</p>}
                {errors.location && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.location}</p>}
                {outsideQC && <p className="mt-1.5 text-xs font-medium text-amber-700">These coordinates look outside Quezon City. Double-check the map pin.</p>}
              </Section>
            )}
          </form>
        )}
      </Modal>

      <Modal open={!!view} onClose={() => setViewId(null)} title={view ? view.name : ''} footer={<Button variant="secondary" onClick={() => setViewId(null)}>Close</Button>}>
        {view && (
          <div className="space-y-4">
            <DetailGrid items={[
              ['Stop ID', view.id], ['Status', <Badge key="status">{view.status}</Badge>],
              ...(view.address ? [['Address', view.address, true]] : []),
              ['Latitude', view.lat], ['Longitude', view.lng],
            ]} />
            <div>
              <p className="text-xs font-semibold text-navy">Routes serving</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {routesOf(view.id).map((r) => <Badge key={r.id}><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ backgroundColor: routeColor(r.id, r) }} />{r.id} · {r.name}</Badge>)}
                {routesOf(view.id).length === 0 && <span className="text-sm text-slate-500">None</span>}
              </div>
            </div>
            <MapView stops={[view]} className="h-56" scrollWheelZoom={false} />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirm} title="Delete bus stop?" confirmLabel="Delete"
        message={confirm ? `${confirm.id} · ${confirm.name} will be permanently removed.` : ''}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          try {
            await deleteStop(confirm.id)
            notify(`${confirm.name} deleted.`)
            setConfirm(null)
          } catch (error) {
            notify(error.message || 'Could not delete the bus stop.', 'error')
          }
        }}
      />
    </>
  )
}
