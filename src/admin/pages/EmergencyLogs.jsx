import { useMemo, useState } from 'react'
import { Eye, Siren, TriangleAlert, CircleCheck, Activity } from 'lucide-react'
import { useAdminData } from '../context/AdminDataContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { StatCard, PageHeader } from '../components/Card.jsx'
import Button, { IconButton } from '../components/Button.jsx'
import Badge from '../components/Badge.jsx'
import DataTable from '../components/DataTable.jsx'
import SearchFilterBar, { DateRange } from '../components/SearchFilterBar.jsx'
import Modal from '../components/Modal.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import Field from '../components/FormField.jsx'
import DetailGrid from '../components/DetailGrid.jsx'
import { inputClass } from '../utils/ui.js'
import { fmtDateTime, inDateRange, includesText } from '../utils/format.js'
import { EMERGENCY_SEVERITIES, EMERGENCY_STATUSES, INCIDENT_TYPES } from '../data/constants.js'

const SEV_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 }
const unresolved = (e) => e.status !== 'Resolved'

export default function EmergencyLogs() {
  const { emergencies, updateEmergencyStatus } = useAdminData()
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
    if (e.severity === 'Critical') return 'bg-red-50/70 border-l-4 border-l-red-500'
    if (e.severity === 'High') return 'bg-amber-50/70 border-l-4 border-l-amber-500'
    return ''
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

  return (
    <>
      <PageHeader title="Emergency Logs" description="Incident monitoring. Critical and High unresolved incidents are highlighted and listed first." />
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
      <DataTable columns={columns} rows={rows} rowClassName={rowClass} emptyTitle="No incidents match" />

      <Modal open={!!view} onClose={() => setViewId(null)} title={view ? `Incident ${view.id}` : ''} footer={<Button variant="secondary" onClick={() => setViewId(null)}>Close</Button>}>
        {view && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2"><Badge>{view.severity}</Badge><Badge>{view.status}</Badge></div>
            <DetailGrid items={[
              ['Emergency ID', view.id], ['Date & time', fmtDateTime(view.datetime)], ['Bus', view.busId], ['Route', view.routeId],
              ['Incident type', view.type], ['Reported by', view.reportedBy], ['Location', view.location, true], ['Description', view.description, true],
            ]} />
            <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-end">
              <Field label="Update status" className="flex-1">
                <select className={inputClass(false)} value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>{EMERGENCY_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
              </Field>
              <Button onClick={requestUpdate} disabled={newStatus === view.status}>Update status</Button>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Status history</p>
              <ol className="space-y-1.5 border-l-2 border-slate-200 pl-4">
                {(view.history || []).map((h, i) => (
                  <li key={i} className="text-sm"><Badge>{h.status}</Badge> <span className="text-xs text-slate-500">{fmtDateTime(h.at)} · {h.by}</span></li>
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
        onConfirm={() => { updateEmergencyStatus(confirm.id, confirm.status); notify(`${confirm.id} updated to ${confirm.status}.`); setConfirm(null) }}
      />
    </>
  )
}
