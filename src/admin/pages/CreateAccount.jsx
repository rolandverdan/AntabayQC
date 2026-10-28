import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Eye, KeyRound, Lock, Pencil, UserCheck, UserPlus, UserX } from 'lucide-react'
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
import PasswordInput from '../components/PasswordInput.jsx'
import Avatar from '../components/Avatar.jsx'
import AvatarPicker from '../components/AvatarPicker.jsx'
import { inputClass } from '../utils/ui.js'
import { fmtDate, includesText } from '../utils/format.js'
import { ACCOUNT_STATUSES, ROLES } from '../data/constants.js'

// Surname particles that belong with the last name when an existing full name is split.
const PARTICLES = new Set(['de', 'del', 'dela', 'delos', 'la', 'san', 'santa', 'van', 'von'])
function splitName(full = '') {
  const w = full.trim().split(/\s+/).filter(Boolean)
  if (w.length < 2) return { firstName: w[0] || '', lastName: '' }
  let i = w.length - 1
  while (i > 1 && PARTICLES.has(w[i - 1].toLowerCase())) i -= 1
  return { firstName: w.slice(0, i).join(' '), lastName: w.slice(i).join(' ') }
}
// EMP-D-001 style IDs, numbered per role. Always generated, never typed.
function nextEmployeeId(accounts, type) {
  const prefix = type === 'Driver' ? 'EMP-D-' : 'EMP-C-'
  const max = accounts.reduce((m, a) => (a.employeeId?.startsWith(prefix) ? Math.max(m, parseInt(a.employeeId.slice(prefix.length), 10) || 0) : m), 0)
  return `${prefix}${String(max + 1).padStart(3, '0')}`
}

const EMPTY = { id: '', type: 'Driver', firstName: '', lastName: '', avatar: '', employeeId: '', username: '', contact: '', busId: '', status: 'Active', password: '', confirm: '' }

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
  const openCreate = (type) => { setErrors({}); setForm({ ...EMPTY, type, employeeId: nextEmployeeId(accounts, type) }) }

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
    if (!form.firstName.trim()) e.firstName = 'First name is required.'
    if (!form.lastName.trim()) e.lastName = 'Last name is required.'
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
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        fullName: `${form.firstName.trim()} ${form.lastName.trim()}`,
        avatar: form.avatar || '',
        employeeId: form.employeeId,
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

  const openEdit = (a, focusPw = false) => {
    setErrors({})
    setForm({ ...EMPTY, ...splitName(a.fullName), ...a, busId: busOf(a.id)?.id || '', password: '', confirm: '', focusPw })
  }
  const view = accounts.find((a) => a.id === viewId)

  const staffField = form?.type === 'Driver' ? 'driverId' : 'conductorId'
  const nameOf = (id) => accounts.find((a) => a.id === id)?.fullName

  const columns = [
    { key: 'fullName', header: 'Name', render: (a) => (<div className="flex items-center gap-3"><Avatar src={a.avatar} size="sm" /><div><p className="font-semibold text-navy">{a.fullName}</p><p className="text-xs text-slate-500">{a.employeeId}</p></div></div>) },
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
      <PageHeader hideTitle
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
            <div className="sm:col-span-2"><AvatarPicker value={form.avatar} onChange={(avatar) => setForm((f) => ({ ...f, avatar }))} /></div>
            <Field label="First name" required error={errors.firstName}><input className={inputClass(errors.firstName)} value={form.firstName} onChange={set('firstName')} autoComplete="given-name" /></Field>
            <Field label="Last name" required error={errors.lastName}><input className={inputClass(errors.lastName)} value={form.lastName} onChange={set('lastName')} autoComplete="family-name" /></Field>
            <Field label="Employee ID" hint="Generated automatically so IDs never repeat.">
              <div className="relative">
                <input className={`${inputClass(false)} cursor-not-allowed bg-slate-100! pr-9 font-mono text-slate-600`} value={form.employeeId} readOnly aria-readonly="true" tabIndex={-1} />
                <Lock size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              </div>
            </Field>
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
            <Field label={isEdit ? 'New password (optional)' : 'Password'} required={!isEdit} error={errors.password}><PasswordInput autoComplete="new-password" autoFocus={!!form.focusPw} className={inputClass(errors.password)} value={form.password} onChange={set('password')} /></Field>
            <Field label="Confirm password" required={!isEdit} error={errors.confirm}><PasswordInput autoComplete="new-password" className={inputClass(errors.confirm)} value={form.confirm} onChange={set('confirm')} /></Field>
          </form>
        )}
      </Modal>

      <Modal
        open={!!view} onClose={() => setViewId(null)} title="Account details"
        footer={view && (
          <>
            <Button variant="secondary" onClick={() => setViewId(null)}>Close</Button>
            <Button variant="secondary" icon={KeyRound} onClick={() => { const a = view; setViewId(null); openEdit(a, true) }}>Reset password</Button>
            <Button icon={Pencil} onClick={() => { const a = view; setViewId(null); openEdit(a) }}>Edit</Button>
          </>
        )}
      >
        {view && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
              <Avatar src={view.avatar} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-navy">{view.fullName}</p>
                <p className="font-mono text-xs text-slate-500">{view.employeeId}</p>
                <div className="mt-2 flex flex-wrap gap-1.5"><Badge>{view.type}</Badge><Badge>{view.status}</Badge></div>
              </div>
            </div>
            <DetailGrid items={[
              ['Account ID', view.id], ['Email / username', view.username], ['Contact', view.contact],
              ['Assigned bus', busOf(view.id)?.id || 'Unassigned'], ['Created', fmtDate(view.createdAt)],
            ]} />
          </div>
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
