import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Eye, Pencil, UserCheck, UserPlus, UserX } from 'lucide-react'
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
import { inputClass } from '../utils/ui.js'
import { fmtDate, includesText } from '../utils/format.js'
import { ACCOUNT_STATUSES, ROLES } from '../data/constants.js'

const EMPTY = { id: '', type: 'Driver', fullName: '', employeeId: '', username: '', contact: '', busId: '', status: 'Active', password: '', confirm: '' }

export default function CreateAccount() {
  const { accounts, buses, saveAccount, setAccountStatus } = useAdminData()
  const { notify } = useToast()
  const [params, setParams] = useSearchParams()

  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [form, setForm] = useState(null)
  const [errors, setErrors] = useState({})
  const [viewId, setViewId] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const busOf = (id) => buses.find((b) => b.driverId === id || b.conductorId === id)
  const openCreate = (type) => { setErrors({}); setForm({ ...EMPTY, type }) }

  useEffect(() => {
    const n = params.get('new')
    if (n === 'driver' || n === 'conductor') {
      openCreate(n === 'driver' ? 'Driver' : 'Conductor')
      setParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const rows = useMemo(
    () =>
      accounts.filter(
        (a) =>
          (!role || a.type === role) &&
          (!status || a.status === status) &&
          (!q || includesText([a.fullName, a.employeeId, a.username, a.contact, busOf(a.id)?.id || ''], q)),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accounts, buses, q, role, status],
  )

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const isEdit = !!form?.id

  const validate = () => {
    const e = {}
    if (!form.fullName.trim()) e.fullName = 'Full name is required.'
    if (!form.employeeId.trim()) e.employeeId = 'Employee ID is required.'
    else if (accounts.some((a) => a.id !== form.id && a.employeeId.toLowerCase() === form.employeeId.trim().toLowerCase())) e.employeeId = 'Employee ID already exists.'
    if (!form.username.trim()) e.username = 'Email or username is required.'
    else if (form.username.trim().length < 4) e.username = 'Must be at least 4 characters.'
    else if (accounts.some((a) => a.id !== form.id && a.username.toLowerCase() === form.username.trim().toLowerCase())) e.username = 'Already in use.'
    if (!/^(\+63|0)9\d{9}$/.test(form.contact.replace(/[\s-]/g, ''))) e.contact = 'Use a PH mobile number, e.g. 09171234567.'
    if (!isEdit || form.password) {
      if (form.password.length < 8) e.password = 'Password must be at least 8 characters.'
      if (form.confirm !== form.password) e.confirm = 'Passwords do not match.'
    }
    return e
  }

  const submit = (ev) => {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) return
    const existing = accounts.find((a) => a.id === form.id)
    // The password is validated here but intentionally never stored.
    saveAccount(
      {
        id: form.id,
        type: form.type,
        fullName: form.fullName.trim(),
        employeeId: form.employeeId.trim(),
        username: form.username.trim(),
        contact: form.contact.replace(/[\s-]/g, ''),
        status: form.status,
        createdAt: existing?.createdAt,
      },
      form.busId,
    )
    notify(`${form.type} account ${isEdit ? 'updated' : 'created'} successfully.`)
    setForm(null)
  }

  const openEdit = (a) => { setErrors({}); setForm({ ...EMPTY, ...a, busId: busOf(a.id)?.id || '', password: '', confirm: '' }) }
  const view = accounts.find((a) => a.id === viewId)

  const staffField = form?.type === 'Driver' ? 'driverId' : 'conductorId'
  const nameOf = (id) => accounts.find((a) => a.id === id)?.fullName

  const columns = [
    { key: 'fullName', header: 'Name', render: (a) => (<div><p className="font-semibold text-navy">{a.fullName}</p><p className="text-xs text-slate-500">{a.employeeId}</p></div>) },
    { key: 'type', header: 'Role', render: (a) => <Badge>{a.type}</Badge> },
    { key: 'username', header: 'Email / username' },
    { key: 'contact', header: 'Contact' },
    { key: 'bus', header: 'Assigned bus', render: (a) => busOf(a.id)?.id || <span className="text-slate-400">Unassigned</span> },
    { key: 'status', header: 'Status', render: (a) => <Badge>{a.status}</Badge> },
    {
      key: 'actions', header: 'Actions', render: (a) => (
        <div className="flex gap-0.5">
          <IconButton icon={Eye} title="View details" onClick={() => setViewId(a.id)} />
          <IconButton icon={Pencil} title="Edit" onClick={() => openEdit(a)} />
          {a.status === 'Active'
            ? <IconButton icon={UserX} tone="danger" title="Deactivate" onClick={() => setConfirm(a)} />
            : <IconButton icon={UserCheck} tone="success" title="Reactivate" onClick={() => { setAccountStatus(a.id, 'Active'); notify(`${a.fullName} reactivated.`) }} />}
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Driver & Conductor Accounts"
        description="Create and manage accounts for bus drivers and conductors."
        actions={<><Button icon={UserPlus} onClick={() => openCreate('Driver')}>Add Driver</Button><Button icon={UserPlus} variant="secondary" onClick={() => openCreate('Conductor')}>Add Conductor</Button></>}
      />
      <SearchFilterBar
        search={q} onSearch={setQ} placeholder="Search name, employee ID, username, bus…"
        filters={[
          { label: 'Role', value: role, onChange: setRole, options: ROLES.map((r) => ({ value: r, label: r })) },
          { label: 'Status', value: status, onChange: setStatus, options: ACCOUNT_STATUSES.map((s) => ({ value: s, label: s })) },
        ]}
        onClear={() => { setQ(''); setRole(''); setStatus('') }}
      />
      <DataTable columns={columns} rows={rows} emptyTitle="No accounts match" />

      <Modal
        open={!!form} onClose={() => setForm(null)} title={form ? `${isEdit ? 'Edit' : 'Add'} ${form.type}` : ''}
        footer={<><Button variant="secondary" onClick={() => setForm(null)}>Cancel</Button><Button type="submit" form="account-form">{isEdit ? 'Save changes' : 'Create account'}</Button></>}
      >
        {form && (
          <form id="account-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" required error={errors.fullName}><input className={inputClass(errors.fullName)} value={form.fullName} onChange={set('fullName')} /></Field>
            <Field label="Employee ID" required error={errors.employeeId}><input className={inputClass(errors.employeeId)} value={form.employeeId} onChange={set('employeeId')} placeholder={form.type === 'Driver' ? 'EMP-D-007' : 'EMP-C-006'} /></Field>
            <Field label="Email or username" required error={errors.username}><input className={inputClass(errors.username)} value={form.username} onChange={set('username')} /></Field>
            <Field label="Contact number" required error={errors.contact}><input className={inputClass(errors.contact)} value={form.contact} onChange={set('contact')} placeholder="09171234567" inputMode="tel" /></Field>
            <Field label="Assigned bus" hint="Assigning replaces the bus's current driver/conductor.">
              <select className={inputClass(false)} value={form.busId} onChange={set('busId')} disabled={form.status === 'Inactive'}>
                <option value="">Unassigned</option>
                {buses.filter((b) => b.status !== 'Inactive').map((b) => {
                  const cur = b[staffField]
                  return <option key={b.id} value={b.id}>{b.id}{cur && cur !== form.id ? ` (replaces ${nameOf(cur)})` : ''}</option>
                })}
              </select>
            </Field>
            <Field label="Account status"><select className={inputClass(false)} value={form.status} onChange={set('status')}>{ACCOUNT_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></Field>
            <Field label={isEdit ? 'New password (optional)' : 'Password'} required={!isEdit} error={errors.password}><input type="password" autoComplete="new-password" className={inputClass(errors.password)} value={form.password} onChange={set('password')} /></Field>
            <Field label="Confirm password" required={!isEdit} error={errors.confirm}><input type="password" autoComplete="new-password" className={inputClass(errors.confirm)} value={form.confirm} onChange={set('confirm')} /></Field>
          </form>
        )}
      </Modal>

      <Modal open={!!view} onClose={() => setViewId(null)} title="Account details" footer={<Button variant="secondary" onClick={() => setViewId(null)}>Close</Button>}>
        {view && (
          <DetailGrid items={[
            ['Account ID', view.id], ['Role', view.type], ['Full name', view.fullName], ['Employee ID', view.employeeId],
            ['Email / username', view.username], ['Contact', view.contact], ['Assigned bus', busOf(view.id)?.id || 'Unassigned'], ['Status', view.status], ['Created', fmtDate(view.createdAt)],
          ]} />
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirm} title="Deactivate account?" confirmLabel="Deactivate"
        message={confirm ? `${confirm.fullName} (${confirm.employeeId}) will be set to Inactive and removed from any assigned bus. You can reactivate the account later.` : ''}
        onCancel={() => setConfirm(null)}
        onConfirm={() => { setAccountStatus(confirm.id, 'Inactive'); notify(`${confirm.fullName} deactivated.`); setConfirm(null) }}
      />
    </>
  )
}
