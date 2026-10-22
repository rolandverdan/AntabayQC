import { useMemo, useState } from 'react'
import { Download, Eye, FileText, Clock, CircleCheck, TriangleAlert } from 'lucide-react'
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
import { downloadCsv } from '../utils/csv.js'
import { fmtDateTime, inDateRange, includesText } from '../utils/format.js'
import { REPORT_STATUSES, REPORT_TYPES } from '../data/constants.js'

const needsAttention = (r) => (r.status === 'Pending' || r.status === 'Under Review') && r.priority === 'High'

export default function ReportLogs() {
  const { reports, routes, updateReportStatus } = useAdminData()
  const { notify } = useToast()
  const [q, setQ] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [routeF, setRouteF] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [viewId, setViewId] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [confirm, setConfirm] = useState(null)

  const rows = useMemo(
    () => reports
      .filter((r) => (!type || r.type === type) && (!status || r.status === status) && (!routeF || r.routeId === routeF) &&
        inDateRange(r.datetime, from, to) && (!q || includesText([r.id, r.type, r.busId, r.routeId, r.reportedBy, r.description], q)))
      .sort((a, b) => b.datetime.localeCompare(a.datetime)),
    [reports, q, type, status, routeF, from, to],
  )
  const view = reports.find((r) => r.id === viewId)

  const applyStatus = (id, s) => { updateReportStatus(id, s); notify(`Report ${id} marked ${s}.`) }
  const requestUpdate = () => {
    if (!view || !newStatus || newStatus === view.status) return
    if (newStatus === 'Resolved' || newStatus === 'Dismissed') setConfirm({ id: view.id, status: newStatus })
    else applyStatus(view.id, newStatus)
  }

  const exportCsv = () => {
    downloadCsv('antabay-report-logs.csv', rows, [
      { header: 'Report ID', value: (r) => r.id }, { header: 'Type', value: (r) => r.type }, { header: 'Date/Time', value: (r) => fmtDateTime(r.datetime) },
      { header: 'Bus', value: (r) => r.busId }, { header: 'Route', value: (r) => r.routeId }, { header: 'Reported by', value: (r) => r.reportedBy },
      { header: 'Priority', value: (r) => r.priority }, { header: 'Status', value: (r) => r.status }, { header: 'Description', value: (r) => r.description },
    ])
    notify(`Exported ${rows.length} record(s) to CSV.`, 'info')
  }

  const columns = [
    { key: 'id', header: 'Report ID', render: (r) => <span className="font-mono text-xs font-semibold text-navy">{r.id}</span> },
    { key: 'type', header: 'Type' },
    { key: 'datetime', header: 'Date & time', render: (r) => <span className="whitespace-nowrap">{fmtDateTime(r.datetime)}</span> },
    { key: 'ref', header: 'Bus / route', render: (r) => `${r.busId} · ${r.routeId}` },
    { key: 'by', header: 'Reported by', render: (r) => r.reportedBy },
    { key: 'desc', header: 'Description', render: (r) => <span className="line-clamp-2 max-w-64">{r.description}</span> },
    { key: 'priority', header: 'Priority', render: (r) => <Badge>{r.priority}</Badge> },
    { key: 'status', header: 'Status', render: (r) => (<div className="flex items-center gap-1"><Badge>{r.status}</Badge>{needsAttention(r) && <TriangleAlert size={15} className="text-amber-600" aria-label="Requires attention" />}</div>) },
    { key: 'actions', header: '', render: (r) => <IconButton icon={Eye} title="View report" onClick={() => { setViewId(r.id); setNewStatus(r.status) }} /> },
  ]

  return (
    <>
      <PageHeader
        title="Report Logs"
        description="Operational reports submitted about buses and routes (separate from system logs)."
        actions={<Button icon={Download} variant="secondary" onClick={exportCsv} disabled={rows.length === 0}>Export CSV ({rows.length})</Button>}
      />
      <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={FileText} label="Total reports" value={reports.length} />
        <StatCard icon={Clock} label="Pending" value={reports.filter((r) => r.status === 'Pending').length} tone="amber" />
        <StatCard icon={CircleCheck} label="Resolved" value={reports.filter((r) => r.status === 'Resolved').length} tone="green" />
        <StatCard icon={TriangleAlert} label="Requires attention" value={reports.filter(needsAttention).length} tone="red" sub="High priority, unresolved" />
      </div>
      <SearchFilterBar
        search={q} onSearch={setQ} placeholder="Search report ID, bus, route, description…"
        filters={[
          { label: 'Type', value: type, onChange: setType, options: REPORT_TYPES.map((t) => ({ value: t, label: t })) },
          { label: 'Status', value: status, onChange: setStatus, options: REPORT_STATUSES.map((s) => ({ value: s, label: s })) },
          { label: 'Route', value: routeF, onChange: setRouteF, options: routes.map((r) => ({ value: r.id, label: r.id })) },
        ]}
        onClear={() => { setQ(''); setType(''); setStatus(''); setRouteF(''); setFrom(''); setTo('') }}
      >
        <DateRange from={from} to={to} onFrom={setFrom} onTo={setTo} />
      </SearchFilterBar>
      <DataTable columns={columns} rows={rows} emptyTitle="No reports match" />

      <Modal open={!!view} onClose={() => setViewId(null)} title={view ? `Report ${view.id}` : ''} footer={<Button variant="secondary" onClick={() => setViewId(null)}>Close</Button>}>
        {view && (
          <div className="space-y-5">
            <DetailGrid items={[
              ['Report ID', view.id], ['Type', view.type], ['Date & time', fmtDateTime(view.datetime)], ['Priority', view.priority],
              ['Bus', view.busId], ['Route', view.routeId], ['Reported by', view.reportedBy], ['Current status', view.status], ['Description', view.description, true],
            ]} />
            <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-end">
              <Field label="Update status" className="flex-1">
                <select className={inputClass(false)} value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>{REPORT_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
              </Field>
              <Button onClick={requestUpdate} disabled={newStatus === view.status}>Update status</Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirm} title={`Mark report as ${confirm?.status}?`} tone={confirm?.status === 'Resolved' ? 'success' : 'primary'} confirmLabel={`Mark ${confirm?.status}`}
        message={confirm ? `Report ${confirm.id} will be marked ${confirm.status}.` : ''}
        onCancel={() => setConfirm(null)}
        onConfirm={() => { applyStatus(confirm.id, confirm.status); setConfirm(null) }}
      />
    </>
  )
}
