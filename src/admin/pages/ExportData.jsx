import { useState } from 'react'
import { Download, FileSpreadsheet } from 'lucide-react'
import { useAdminData } from '../context/AdminDataContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import Card, { PageHeader } from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import Field from '../components/FormField.jsx'
import { inputClass } from '../utils/ui.js'
import { downloadCsv, todayStamp } from '../utils/csv.js'
import { EXPORT_CATEGORIES } from '../utils/exportConfig.js'

export default function ExportData() {
  const data = useAdminData()
  const { notify } = useToast()
  const [key, setKey] = useState(EXPORT_CATEGORIES[0].key)

  const cat = EXPORT_CATEGORIES.find((c) => c.key === key)
  const rows = cat.rows(data)
  const columns = cat.columns(data)

  const exportCsv = () => {
    if (!rows.length) {
      notify(`There are no ${cat.label} records to export.`, 'error')
      return
    }
    downloadCsv(`antabay-${cat.file}-${todayStamp()}.csv`, rows, columns)
    notify(`${cat.label}: ${rows.length} record(s) exported to CSV.`, 'success')
  }

  return (
    <>
      <PageHeader hideTitle title="Export Data" description="Download records currently stored in this admin console as a CSV file." />
      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Export settings" className="lg:col-span-1" bodyClass="space-y-4 p-4">
          <Field label="Data category">
            <select value={key} onChange={(e) => setKey(e.target.value)} className={inputClass(false)} aria-label="Data category">
              {EXPORT_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </Field>
          <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            <p><b className="text-navy">{rows.length}</b> record{rows.length === 1 ? '' : 's'} available</p>
            <p className="mt-0.5 text-xs text-slate-500">File name: antabay-{cat.file}-{todayStamp()}.csv</p>
          </div>
          <Button icon={Download} onClick={exportCsv} className="w-full">Export CSV</Button>
        </Card>

        <Card title={`Columns included · ${cat.label}`} className="lg:col-span-2" bodyClass="p-4">
          <ul className="grid gap-2 sm:grid-cols-2">
            {columns.map((c) => (
              <li key={c.header} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-navy">
                <FileSpreadsheet size={15} className="shrink-0 text-brand" />{c.header}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  )
}
