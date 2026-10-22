import { TriangleAlert, CircleCheck } from 'lucide-react'
import Modal from './Modal.jsx'
import Button from './Button.jsx'

/** tone: 'danger' | 'success' | 'primary' */
export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', tone = 'danger', onConfirm, onCancel }) {
  const Icon = tone === 'success' ? CircleCheck : TriangleAlert
  const iconCls = tone === 'danger' ? 'bg-red-100 text-red-600' : tone === 'success' ? 'bg-green-100 text-green-600' : 'bg-brand/10 text-brand'
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant={tone} onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }
    >
      <div className="flex gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconCls}`}>
          <Icon size={20} />
        </div>
        <p className="pt-1 text-sm text-slate-600">{message}</p>
      </div>
    </Modal>
  )
}
