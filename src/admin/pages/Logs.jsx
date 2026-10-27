import { useMemo, useState } from 'react'
import { Download, Eye } from 'lucide-react'
import { useAdminData } from '../context/AdminDataContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { PageHeader } from '../components/Card.jsx'
import Button, { IconButton } from '../components/Button.jsx'
import Badge from '../components/Badge.jsx'
import DataTable from '../components/DataTable.jsx'
import SearchFilterBar, { DateRange } from '../components/SearchFilterBar.jsx'
import Modal from '../components/Modal.jsx'
import DetailGrid from '../components/DetailGrid.jsx'
import { fmtDateTime, inDateRange, includesText } from '../utils/format.js'
import { MODULES, SEVERITIES } from '../data/constants.js'
import { downloadCsv, todayStamp } from '../utils/csv.js'
import { LOG_COLUMNS } from '../utils/exportConfig.js'

export default function Logs() {
  const { logs } = useAdminData()
  const { notify } = useToast()
  const [q, setQ] = useState('')
  const [moduleF, setModuleF] = useState('')
  const [sev, setSev] = useState('')
  const [userF, setUserF] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [viewId, setViewId] = useState(null)

  const users = [...new Set(logs.map((l) => l.user))]
  const rows = useMemo(
    () => logs.filter((l) =>
      (!moduleF || l.module === moduleF) && (!sev || l.severity === sev) && (!userF || l.user === userF) &&
      inDateRange(l.timestamp, from, to) && (!q || includesText([l.id, l.action, l.user, l.module, l.description], q))),
    [logs, q, moduleF, sev, userF, from, to],
  )
  const view = logs.find((l) => l.id === viewId)

  // Exports exactly what the table shows: same search query and filters.
  const exportCsv = () => {
    if (!rows.length) {
      notify('No log records match the current search and filters, so nothing was exported.', 'error')
      return
    }
    downloadCsv(`antabay-system-logs-${todayStamp()}.csv`, rows, LOG_COLUMNS)
    notify(`Exported ${rows.length} record(s) to CSV.`, 'info')
  }

  const columns = [
    { key: 'id', header: 'Log ID', render: (l) => <span className="font-mono text-xs font-semibold text-navy">{l.id}</span> },
    { key: 'timestamp', header: 'Timestamp', render: (l) => <span className="whitespace-nowrap">{fmtDateTime(l.timestamp)}</span> },
    { key: 'action', header: 'Action', render: (l) => <span className="font-semibold text-navy">{l.action}</span> },
    { key: 'user', header: 'User' },
    { key: 'module', header: 'Module' },
    { key: 'severity', header: 'Severity', render: (l) => <Badge>{l.severity}</Badge> },
    { key: 'actions', header: '', render: (l) => <IconButton icon={Eye} title="View details" onClick={() => setViewId(l.id)} /> },
  ]

  return (
    <>
      <PageHeader
        title="System Logs"
        description="Administrative and system activity. New entries appear here when you perform actions in this session."
        actions={<Button icon={Download} variant="secondary" onClick={exportCsv} disabled={rows.length === 0}>Export CSV ({rows.length})</Button>}
      />
      <SearchFilterBar
        search={q} onSearch={setQ} placeholder="Search keyword in logs…"
        filters={[
          { label: 'Module', value: moduleF, onChange: setModuleF, options: MODULES.map((m) => ({ value: m, label: m })) },
          { label: 'Severity', value: sev, onChange: setSev, options: SEVERITIES.map((s) => ({ value: s, label: s })) },
          { label: 'User', value: userF, onChange: setUserF, options: users.map((u) => ({ value: u, label: u })) },
        ]}
        onClear={() => { setQ(''); setModuleF(''); setSev(''); setUserF(''); setFrom(''); setTo('') }}
      >
        <DateRange from={from} to={to} onFrom={setFrom} onTo={setTo} />
      </SearchFilterBar>
      <DataTable columns={columns} rows={rows} pageSize={10} emptyTitle="No log entries match" />

      <Modal open={!!view} onClose={() => setViewId(null)} title={view ? `Log ${view.id}` : ''} footer={<Button variant="secondary" onClick={() => setViewId(null)}>Close</Button>}>
        {view && (
          <DetailGrid items={[
            ['Log ID', view.id], ['Timestamp', fmtDateTime(view.timestamp)], ['Action', view.action], ['User / account', view.user],
            ['Module', view.module], ['Severity', view.severity], ['Description', view.description, true],
          ]} />
        )}
      </Modal>
    </>
  )
}
