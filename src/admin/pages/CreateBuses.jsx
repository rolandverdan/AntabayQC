import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Ban, Bus, CircleCheck, Download, Eye, Pencil } from 'lucide-react'
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
import OccupancyBar from '../components/OccupancyBar.jsx'
import { inputClass } from '../utils/ui.js'
import { includesText, nextId } from '../utils/format.js'
import { downloadCsv, todayStamp } from '../utils/csv.js'
import { exportCategory } from '../utils/exportConfig.js'
import { BUS_STATUSES } from '../data/constants.js'

export default function CreateBuses() {
  const { buses, routes, accounts, accountsById, routesById, saveBus, setBusStatus } = useAdminData()
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

  const blank = () => ({ id: nextId('BUS', buses), plate: '', model: '', capacity: 50, routeId: '', driverId: '', conductorId: '', status: 'Active' })
  const openCreate = () => { setErrors({}); setIsEdit(false); setForm(blank()) }
  const openEdit = (b) => { setErrors({}); setIsEdit(true); setForm({ ...b }) }

  useEffect(() => {
    if (params.get('new')) { openCreate(); setParams({}, { replace: true }) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const name = (id) => accountsById[id]?.fullName || ''
  const rows = useMemo(
    () => buses.filter((b) =>
      (!status || b.status === status) && (!routeF || b.routeId === routeF) &&
      (!q || includesText([b.id, b.plate, b.model, name(b.driverId), name(b.conductorId)], q)))
      // Newest first, so a bus that was just added is on page 1. Seed buses (no createdAt) fall back to bus number.
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '') || (parseInt(b.id.replace(/\D/g, ''), 10) || 0) - (parseInt(a.id.replace(/\D/g, ''), 10) || 0)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [buses, accountsById, q, status, routeF],
  )

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (ev) => {
    ev.preventDefault()
    const e = {}
    const id = form.id.trim().toUpperCase()
    const plate = form.plate.trim().toUpperCase()
    if (!id) e.id = 'Bus ID is required.'
    else if (!isEdit && buses.some((b) => b.id === id)) e.id = 'Bus ID already exists.'
    if (!/^[A-Z0-9][A-Z0-9 -]{4,9}$/.test(plate)) e.plate = 'Enter a valid plate number, e.g. NCB 1234.'
    else if (buses.some((b) => b.id !== id && b.plate.toUpperCase() === plate)) e.plate = 'Plate number already registered.'
    if (!form.model.trim()) e.model = 'Model / description is required.'
    const cap = Number(form.capacity)
    if (!Number.isInteger(cap) || cap < 10 || cap > 120) e.capacity = 'Capacity must be a whole number from 10 to 120.'
    setErrors(e)
    if (Object.keys(e).length) return
    saveBus({ ...form, id, plate, model: form.model.trim(), capacity: cap, passengers: Math.min(form.passengers || 0, cap) })
    notify(`Bus ${id} ${isEdit ? 'updated' : 'added'} successfully.`)
    setForm(null)
  }

  const staffOptions = (type, field) =>
    accounts.filter((a) => a.type === type && (a.status === 'Active' || a.id === form?.[field])).map((a) => {
      const other = buses.find((b) => b.id !== form.id && (b.driverId === a.id || b.conductorId === a.id))
      return <option key={a.id} value={a.id}>{a.fullName}{other ? ` (moves from ${other.id})` : ''}</option>
    })

  const view = buses.find((b) => b.id === viewId)

  // Exports exactly what the table shows: same search and filters.
  const exportCsv = () => {
    if (!rows.length) {
      notify('No buses match the current search and filters, so nothing was exported.', 'error')
      return
    }
    const cat = exportCategory('buses')
    downloadCsv(`antabay-${cat.file}-${todayStamp()}.csv`, rows, cat.columns({ accountsById }))
    notify(`Exported ${rows.length} record(s) to CSV.`, 'info')
  }

  const columns = [
    { key: 'id', header: 'Bus', render: (b) => (<div><p className="font-semibold text-navy">{b.id}</p><p className="max-w-48 truncate text-xs text-slate-500">{b.model}</p></div>) },
    { key: 'plate', header: 'Plate' },
    { key: 'capacity', header: 'Capacity' },
    { key: 'route', header: 'Route', render: (b) => (b.routeId ? `${b.routeId} · ${routesById[b.routeId]?.name || ''}` : <span className="text-slate-400">None</span>) },
    { key: 'driver', header: 'Driver', render: (b) => name(b.driverId) || <span className="text-slate-400">Unassigned</span> },
    { key: 'conductor', header: 'Conductor', render: (b) => name(b.conductorId) || <span className="text-slate-400">Unassigned</span> },
    { key: 'status', header: 'Status', render: (b) => <Badge>{b.status}</Badge> },
    {
      key: 'actions', header: 'Actions', render: (b) => (
        <div className="flex gap-0.5">
          <IconButton icon={Eye} title="View details" onClick={() => setViewId(b.id)} />
          <IconButton icon={Pencil} title="Edit" onClick={() => openEdit(b)} />
          {b.status === 'Inactive'
            ? <IconButton icon={CircleCheck} tone="success" title="Reactivate" onClick={() => { setBusStatus(b.id, 'Active'); notify(`${b.id} reactivated.`) }} />
            : <IconButton icon={Ban} tone="danger" title="Deactivate" onClick={() => setConfirm(b)} />}
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader hideTitle title="Buses" description="Add, edit, and manage the bus fleet." actions={<><Button icon={Download} variant="secondary" onClick={exportCsv} disabled={rows.length === 0}>Export CSV ({rows.length})</Button><Button icon={Bus} onClick={openCreate}>Add Bus</Button></>} />
      <SearchFilterBar
        search={q} onSearch={setQ} placeholder="Search bus ID, plate, model, driver…"
        filters={[
          { label: 'Status', value: status, onChange: setStatus, options: BUS_STATUSES.map((s) => ({ value: s, label: s })) },
          { label: 'Route', value: routeF, onChange: setRouteF, options: routes.map((r) => ({ value: r.id, label: `${r.id} ${r.name}` })) },
        ]}
        onClear={() => { setQ(''); setStatus(''); setRouteF('') }}
      />
      <DataTable columns={columns} rows={rows} emptyTitle="No buses match" />

      <Modal
        open={!!form} onClose={() => setForm(null)} title={isEdit ? `Edit ${form?.id}` : 'Add bus'}
        footer={<><Button variant="secondary" onClick={() => setForm(null)}>Cancel</Button><Button type="submit" form="bus-form">{isEdit ? 'Save changes' : 'Add bus'}</Button></>}
      >
        {form && (
          <form id="bus-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
            <Field label="Bus ID / number" required error={errors.id}><input className={inputClass(errors.id)} value={form.id} onChange={set('id')} disabled={isEdit} /></Field>
            <Field label="Plate number" required error={errors.plate}><input className={inputClass(errors.plate)} value={form.plate} onChange={set('plate')} placeholder="NCB 1234" /></Field>
            <Field label="Bus model / description" required error={errors.model} className="sm:col-span-2"><input className={inputClass(errors.model)} value={form.model} onChange={set('model')} placeholder="e.g. Higer KLQ6118 City Bus" /></Field>
            <Field label="Passenger capacity" required error={errors.capacity}><input type="number" min="10" max="120" className={inputClass(errors.capacity)} value={form.capacity} onChange={set('capacity')} /></Field>
            <Field label="Operational status"><select className={inputClass(false)} value={form.status} onChange={set('status')}>{BUS_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></Field>
            <Field label="Assigned route"><select className={inputClass(false)} value={form.routeId} onChange={set('routeId')}><option value="">None</option>{routes.filter((r) => r.status === 'Active' || r.id === form.routeId).map((r) => <option key={r.id} value={r.id}>{r.id} · {r.name}</option>)}</select></Field>
            <div className="hidden sm:block" />
            <Field label="Assigned driver"><select className={inputClass(false)} value={form.driverId} onChange={set('driverId')}><option value="">Unassigned</option>{staffOptions('Driver', 'driverId')}</select></Field>
            <Field label="Assigned conductor"><select className={inputClass(false)} value={form.conductorId} onChange={set('conductorId')}><option value="">Unassigned</option>{staffOptions('Conductor', 'conductorId')}</select></Field>
          </form>
        )}
      </Modal>

      <Modal open={!!view} onClose={() => setViewId(null)} title={view ? `Bus ${view.id}` : ''} footer={<Button variant="secondary" onClick={() => setViewId(null)}>Close</Button>}>
        {view && (
          <div className="space-y-5">
            <DetailGrid items={[
              ['Plate number', <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-navy ring-1 ring-inset ring-slate-300">{view.plate}</span>], ['Status', <Badge>{view.status}</Badge>], ['Model', view.model, true], ['Capacity', `${view.capacity} passengers`],
              ['Route', view.routeId ? `${view.routeId} · ${routesById[view.routeId]?.name}` : ''], ['Driver', name(view.driverId)], ['Conductor', name(view.conductorId)],
            ]} />
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Passenger occupancy</p>
              <OccupancyBar passengers={view.passengers} capacity={view.capacity} />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirm} title="Deactivate bus?" confirmLabel="Deactivate"
        message={confirm ? `${confirm.id} (${confirm.plate}) will be set to Inactive and will stop moving on the live map. You can reactivate it later.` : ''}
        onCancel={() => setConfirm(null)}
        onConfirm={() => { setBusStatus(confirm.id, 'Inactive'); notify(`${confirm.id} deactivated.`); setConfirm(null) }}
      />
    </>
  )
}
