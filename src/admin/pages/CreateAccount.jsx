import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Eye, KeyRound, Pencil, UserCheck, UserPlus, UserX } from 'lucide-react'
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
import { Section, LockedChip, PasswordChecklist, passwordMeetsRules } from '../components/FormParts.jsx'
import { inputClass } from '../utils/ui.js'
import { fmtDate, includesText } from '../utils/format.js'
import { ACCOUNT_STATUSES, ROLES } from '../data/constants.js'
import Select from '../../shared/components/Select.jsx'

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
  const { accounts, buses, saveAccount, setAccountStatus, addLog } = useAdminData()
  const { notify } = useToast()
  const [params, setParams] = useSearchParams()

  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [form, setForm] = useState(null)
  const [errors, setErrors] = useState({})
  const [viewId, setViewId] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [reset, setReset] = useState(null) // { account, password, confirm }
  const [resetErrors, setResetErrors] = useState({})

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
    if (!isEdit) {
      if (!passwordMeetsRules(form.password)) e.password = 'Password does not meet all the requirements.'
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

  const openEdit = (a) => {
    setErrors({})
    setForm({ ...EMPTY, ...splitName(a.fullName), ...a, busId: busOf(a.id)?.id || '', password: '', confirm: '' })
  }
  const openReset = (a) => { setResetErrors({}); setReset({ account: a, password: '', confirm: '' }) }
  const submitReset = (ev) => {
    ev.preventDefault()
    const e = {}
    if (!passwordMeetsRules(reset.password)) e.password = 'Password does not meet all the requirements.'
    if (reset.confirm !== reset.password) e.confirm = 'Passwords do not match.'
    setResetErrors(e)
    if (Object.keys(e).length) return
    // The password is validated here but intentionally never stored (frontend demo).
    addLog({ action: 'Password reset', module: 'Accounts', description: `Password reset for ${reset.account.fullName} (${reset.account.employeeId}).` })
    notify(`Password reset for ${reset.account.fullName}.`)
    setReset(null)
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
          <IconButton icon={KeyRound} title="Reset password" onClick={() => openReset(a)} />
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
          <form id="account-form" onSubmit={submit} noValidate className="space-y-7">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
              <div className="min-w-0 flex-1 basis-72"><AvatarPicker value={form.avatar} onChange={(avatar) => setForm((f) => ({ ...f, avatar }))} /></div>
              <LockedChip label="Employee ID" value={form.employeeId} />
            </div>

            <Section title="Personal information">
              <div className="grid items-start gap-x-4 gap-y-5 sm:grid-cols-2">
                <Field label="First name" required error={errors.firstName}><input className={inputClass(errors.firstName)} value={form.firstName} onChange={set('firstName')} autoComplete="given-name" /></Field>
                <Field label="Last name" required error={errors.lastName}><input className={inputClass(errors.lastName)} value={form.lastName} onChange={set('lastName')} autoComplete="family-name" /></Field>
                <Field label="Contact number" required error={errors.contact}><input className={inputClass(errors.contact)} value={form.contact} onChange={set('contact')} placeholder="09171234567" inputMode="tel" /></Field>
                <Field label="Email or username" required error={errors.username}><input className={inputClass(errors.username)} value={form.username} onChange={set('username')} /></Field>
              </div>
            </Section>

            <Section title="Account details">
              <div className="grid items-start gap-x-4 gap-y-5 sm:grid-cols-2">
                <Field label="Account status"><Select value={form.status} onChange={set('status')}>{ACCOUNT_STATUSES.map((s) => <option key={s}>{s}</option>)}</Select></Field>
                <Field label="Assigned bus" hint="Assigning replaces the bus's current driver/conductor.">
                  <Select value={form.busId} onChange={set('busId')} disabled={form.status === 'Inactive'}>
                    <option value="">Unassigned</option>
                    {buses.filter((b) => b.status !== 'Inactive').map((b) => {
                      const cur = b[staffField]
                      return <option key={b.id} value={b.id} data-desc={cur && cur !== form.id ? `Replaces ${nameOf(cur)}` : undefined}>{b.id}</option>
                    })}
                  </Select>
                </Field>
              </div>
            </Section>

            {!isEdit && (
              <Section title="Security">
                <div className="grid items-start gap-x-4 gap-y-5 sm:grid-cols-2">
                  <div className="space-y-5">
                    <Field label="Password" required error={errors.password}><PasswordInput autoComplete="new-password" className={inputClass(errors.password)} value={form.password} onChange={set('password')} /></Field>
                    <Field label="Confirm password" required error={errors.confirm}><PasswordInput autoComplete="new-password" className={inputClass(errors.confirm)} value={form.confirm} onChange={set('confirm')} /></Field>
                  </div>
                  <PasswordChecklist password={form.password} />
                </div>
              </Section>
            )}
          </form>
        )}
      </Modal>

      <Modal
        open={!!view} onClose={() => setViewId(null)} title="Account details"
        footer={view && (
          <>
            <span className="mr-auto self-center text-xs text-slate-500">Created {fmtDate(view.createdAt)}</span>
            <Button variant="secondary" onClick={() => setViewId(null)}>Close</Button>
            <Button variant="secondary" icon={KeyRound} className="gap-1.5" onClick={() => { const a = view; setViewId(null); openReset(a) }}>Reset password</Button>
            <Button icon={Pencil} className="gap-1.5" onClick={() => { const a = view; setViewId(null); openEdit(a) }}>Edit</Button>
          </>
        )}
      >
        {view && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4 rounded-xl bg-slate-50 p-4">
              <Avatar src={view.avatar} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-bold text-navy">{view.fullName}</p>
                <div className="mt-2 flex flex-wrap gap-1.5"><Badge>{view.type}</Badge><Badge>{view.status}</Badge></div>
              </div>
              <LockedChip label="Employee ID" value={view.employeeId} />
            </div>
            <DetailGrid items={[
              ['Account ID', view.id], ['Email / username', view.username], ['Contact', view.contact],
              ['Assigned bus', busOf(view.id)?.id || 'Unassigned'],
            ]} />
          </div>
        )}
      </Modal>

      <Modal
        open={!!reset} onClose={() => setReset(null)} title="Reset password" size="sm"
        footer={<><Button variant="secondary" onClick={() => setReset(null)}>Cancel</Button><Button type="submit" form="reset-form">Reset password</Button></>}
      >
        {reset && (
          <form id="reset-form" onSubmit={submitReset} noValidate className="space-y-6">
            <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-3.5">
              <Avatar src={reset.account.avatar} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-navy">{reset.account.fullName}</p>
                <p className="text-xs text-slate-500">{reset.account.type}</p>
              </div>
              <LockedChip label="Employee ID" value={reset.account.employeeId} />
            </div>
            <div className="space-y-5">
              <Field label="New password" required error={resetErrors.password}><PasswordInput autoFocus autoComplete="new-password" className={inputClass(resetErrors.password)} value={reset.password} onChange={(e) => setReset((r) => ({ ...r, password: e.target.value }))} /></Field>
              <Field label="Confirm password" required error={resetErrors.confirm}><PasswordInput autoComplete="new-password" className={inputClass(resetErrors.confirm)} value={reset.confirm} onChange={(e) => setReset((r) => ({ ...r, confirm: e.target.value }))} /></Field>
              <PasswordChecklist password={reset.password} />
            </div>
          </form>
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
