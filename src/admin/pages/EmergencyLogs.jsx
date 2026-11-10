import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlignLeft, ArrowLeft, Bus, Clock, Download, Eye, Hash, MapPin, ShieldAlert, Siren, TriangleAlert, CircleCheck, Activity, User, Plus } from 'lucide-react'
import { useAdminData } from '../context/AdminDataContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { StatCard, PageHeader } from '../components/Card.jsx'
import Button, { IconButton } from '../components/Button.jsx'
import Badge from '../components/Badge.jsx'
import DataTable from '../components/DataTable.jsx'
import useHighlight from '../hooks/useHighlight.js'
import SearchFilterBar, { DateRange } from '../components/SearchFilterBar.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import Modal from '../components/Modal.jsx'
import Field from '../components/FormField.jsx'
import { DetailHeader, InfoTile, SmallLabel, toneOf } from '../components/FormParts.jsx'
import { fmtDateTime, inDateRange, includesText } from '../utils/format.js'
import { inputClass } from '../utils/ui.js'
import { EMERGENCY_SEVERITIES, EMERGENCY_STATUSES, INCIDENT_TYPES } from '../data/constants.js'
import { downloadCsv, todayStamp } from '../utils/csv.js'
import { exportCategory } from '../utils/exportConfig.js'
import Select from '../../shared/components/Select.jsx'

const SEV_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 }
const unresolved = (e) => e.status !== 'Resolved'

export default function EmergencyLogs() {
  const { emergencies, buses, routes, createEmergency, updateEmergencyStatus } = useAdminData()
  const { notify } = useToast()
  const [q, setQ] = useState('')
  const [sev, setSev] = useState('')
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [viewId, setViewId] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [confirm, setConfirm] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({ type: '', busId: '', routeId: '', location: '', description: '', severity: 'Medium', reportedBy: 'Administrator', status: 'New' })
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()
  const highlight = useHighlight()
  // Arriving from a notification: clear filters so the picked incidents are definitely visible.
  useEffect(() => {
    if (highlight.size) { setQ(''); setSev(''); setStatus(''); setType(''); setFrom(''); setTo('') }
  }, [highlight])

  const rows = useMemo(
    () => emergencies
      .filter((e) => (!sev || e.severity === sev) && (!status || e.status === status) && (!type || e.type === type) &&
        inDateRange(e.datetime, from, to) && (!q || includesText([e.id, e.busId, e.routeId, e.type, e.reportedBy, e.location, e.description], q)))
      .sort((a, b) => (Number(!unresolved(a)) - Number(!unresolved(b))) || (SEV_ORDER[a.severity] - SEV_ORDER[b.severity]) || b.datetime.localeCompare(a.datetime)),
    [emergencies, q, sev, status, type, from, to],
  )
  const view = emergencies.find((e) => e.id === viewId)

  const rowClass = (e) => {
    if (!unresolved(e)) return ''
    if (e.severity === 'Critical') return 'bg-red-50/70 border-l-4 border-l-red-500 row-alert'
    if (e.severity === 'High') return 'bg-amber-50/70 border-l-4 border-l-amber-500 row-alert-soft'
    return ''
  }

  // Exports exactly what the table shows: same search and filters.
  const exportCsv = () => {
    if (!rows.length) {
      notify('No emergency records match the current search and filters, so nothing was exported.', 'error')
      return
    }
    const cat = exportCategory('emergencies')
    downloadCsv(`antabay-${cat.file}-${todayStamp()}.csv`, rows, cat.columns())
    notify(`Exported ${rows.length} record(s) to CSV.`, 'info')
  }

  const columns = [
    { key: 'id', header: 'Emergency ID', render: (e) => <span className="font-mono text-xs font-semibold text-navy">{e.id}</span> },
    { key: 'datetime', header: 'Date & time', render: (e) => <span className="whitespace-nowrap">{fmtDateTime(e.datetime)}</span> },
    { key: 'bus', header: 'Bus / route', render: (e) => `${e.busId} · ${e.routeId}` },
    { key: 'type', header: 'Incident', render: (e) => <span className="font-semibold text-navy">{e.type}</span> },
    { key: 'location', header: 'Location', render: (e) => <span className="line-clamp-2 max-w-48">{e.location}</span> },
    { key: 'severity', header: 'Severity', render: (e) => <Badge>{e.severity}</Badge> },
    { key: 'status', header: 'Status', render: (e) => <Badge>{e.status}</Badge> },
    { key: 'actions', header: '', render: (e) => <IconButton icon={Eye} title="View details" onClick={() => { setViewId(e.id); setNewStatus(e.status) }} /> },
  ]

  const requestUpdate = () => {
    if (view && newStatus && newStatus !== view.status) setConfirm({ id: view.id, from: view.status, status: newStatus })
  }

  const submitIncident = async (event) => {
    event.preventDefault()
    if (!form.type || !form.location.trim() || !form.description.trim()) {
      setFormError('Choose an incident type and enter its location and description.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      await createEmergency({
        ...form,
        busId: form.busId,
        routeId: form.routeId || buses.find((bus) => bus.id === form.busId)?.routeId || '',
        location: form.location.trim(),
        description: form.description.trim(),
      })
      notify('Incident recorded.')
      setForm({ type: '', busId: '', routeId: '', location: '', description: '', severity: 'Medium', reportedBy: 'Administrator', status: 'New' })
      setFormOpen(false)
    } catch (error) {
      setFormError(error.message || 'Could not record the incident.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader title="Emergency Logs" description="Manually recorded incidents. No emergency dispatch service is connected." actions={<><Button icon={ArrowLeft} variant="secondary" onClick={() => navigate('/admin/dashboard')}>Back to Dashboard</Button><Button icon={Download} variant="secondary" onClick={exportCsv} disabled={rows.length === 0}>Export CSV ({rows.length})</Button><Button icon={Plus} onClick={() => setFormOpen(true)}>Record incident</Button></>} />
      <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={Siren} label="Total emergencies" value={emergencies.length} />
        <StatCard icon={Activity} label="Active incidents" value={emergencies.filter(unresolved).length} tone="amber" sub="Not yet resolved" />
        <StatCard icon={TriangleAlert} label="Critical (unresolved)" value={emergencies.filter((e) => unresolved(e) && e.severity === 'Critical').length} tone="red" />
        <StatCard icon={CircleCheck} label="Resolved" value={emergencies.filter((e) => !unresolved(e)).length} tone="green" />
      </div>
      <SearchFilterBar
        search={q} onSearch={setQ} placeholder="Search ID, bus, location, description…"
        filters={[
          { label: 'Severity', value: sev, onChange: setSev, options: EMERGENCY_SEVERITIES.map((s) => ({ value: s, label: s })) },
          { label: 'Status', value: status, onChange: setStatus, options: EMERGENCY_STATUSES.map((s) => ({ value: s, label: s })) },
          { label: 'Incident', value: type, onChange: setType, options: INCIDENT_TYPES.map((s) => ({ value: s, label: s })) },
        ]}
        onClear={() => { setQ(''); setSev(''); setStatus(''); setType(''); setFrom(''); setTo('') }}
      >
        <DateRange from={from} to={to} onFrom={setFrom} onTo={setTo} />
      </SearchFilterBar>
      <DataTable columns={columns} rows={rows} rowClassName={rowClass} highlightKeys={highlight} emptyTitle="No incidents match" emptyHint="Record an incident here or connect an incident feed." />

      <Modal
        open={formOpen}
        onClose={() => { if (!saving) setFormOpen(false) }}
        title="Record incident"
        footer={<><Button variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>Cancel</Button><Button type="submit" form="incident-form" disabled={saving}>{saving ? 'Saving…' : 'Record incident'}</Button></>}
      >
        <form id="incident-form" onSubmit={submitIncident} noValidate className="space-y-4">
          {formError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Incident type" required>
              <Select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}>
                <option value="">Select type</option>
                {INCIDENT_TYPES.map((item) => <option key={item}>{item}</option>)}
              </Select>
            </Field>
            <Field label="Severity" required>
              <Select value={form.severity} onChange={(event) => setForm((current) => ({ ...current, severity: event.target.value }))}>
                {EMERGENCY_SEVERITIES.map((item) => <option key={item}>{item}</option>)}
              </Select>
            </Field>
            <Field label="Bus">
              <Select value={form.busId} onChange={(event) => setForm((current) => ({ ...current, busId: event.target.value, routeId: '' }))}>
                <option value="">No bus specified</option>
                {buses.map((bus) => <option key={bus.id} value={bus.id}>{bus.id} · {bus.plate}</option>)}
              </Select>
            </Field>
            <Field label="Route">
              <Select value={form.routeId} onChange={(event) => setForm((current) => ({ ...current, routeId: event.target.value }))}>
                <option value="">Use bus route / none</option>
                {routes.map((route) => <option key={route.id} value={route.id}>{route.id} · {route.name}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Location" required>
            <input className={inputClass(false)} value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} />
          </Field>
          <Field label="Description" required>
            <textarea className={`${inputClass(false)} min-h-24`} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          </Field>
        </form>
      </Modal>

      <Modal open={!!view} onClose={() => setViewId(null)} title={view ? `Incident ${view.id}` : ''} bodyClass="bg-slate-100/70" footer={<Button variant="secondary" onClick={() => setViewId(null)}>Close</Button>}>
        {view && (
          <div className="space-y-3">
            <DetailHeader icon={ShieldAlert} tone={toneOf(view.severity)} title={view.type}>
              <Badge dot>{view.severity}</Badge>
              <Badge dot>{view.status}</Badge>
            </DetailHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoTile icon={Hash} label="Emergency ID" value={view.id} mono />
              <InfoTile icon={Clock} label="Date & time" value={fmtDateTime(view.datetime)} />
              <InfoTile icon={Bus} label="Bus / route" value={[view.busId, view.routeId].filter(Boolean).join(' · ')} />
              <InfoTile icon={User} label="Reported by" value={view.reportedBy} />
              <InfoTile icon={MapPin} label="Location" value={view.location} className="sm:col-span-2" />
              <InfoTile icon={AlignLeft} label="Description" value={view.description} className="sm:col-span-2" />
            </div>
            <div className="pt-2">
              <SmallLabel className="mb-1.5">Update status</SmallLabel>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Select wrapperClassName="flex-1" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>{EMERGENCY_STATUSES.map((s) => <option key={s}>{s}</option>)}</Select>
                <Button onClick={requestUpdate} disabled={newStatus === view.status}>Update status</Button>
              </div>
            </div>
            <div className="pt-2">
              <SmallLabel className="mb-2">Status history</SmallLabel>
              <ol className="space-y-2.5">
                {(view.history || []).map((h, i, arr) => (
                  <li key={i} className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${i === arr.length - 1 ? 'bg-red-500 ring-2 ring-red-200' : 'bg-slate-300'}`} aria-hidden="true" />
                    <Badge>{h.status}</Badge>
                    <span>{fmtDateTime(h.at)} · {h.by}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.status === 'Resolved' ? 'Mark incident as resolved?' : 'Change incident status?'}
        tone={confirm?.status === 'Resolved' ? 'success' : 'primary'}
        confirmLabel={confirm?.status === 'Resolved' ? 'Mark resolved' : 'Update status'}
        message={confirm ? `${confirm.id} will change from “${confirm.from}” to “${confirm.status}”. This is recorded in the system logs.` : ''}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          try {
            await updateEmergencyStatus(confirm.id, confirm.status)
            notify(`${confirm.id} updated to ${confirm.status}.`)
            setConfirm(null)
          } catch (error) {
            notify(error.message || 'Could not update the incident.', 'error')
          }
        }}
      />
    </>
  )
}
