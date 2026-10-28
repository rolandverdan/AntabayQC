import { useRef, useState } from 'react'
import { Camera, Trash2 } from 'lucide-react'
import Avatar from './Avatar.jsx'
import Button from './Button.jsx'
import { fileToAvatar } from '../utils/avatar.js'

// "Add avatar" control for the account form: preview, choose / change photo, remove.
export default function AvatarPicker({ value, onChange }) {
  const inputRef = useRef(null)
  const [error, setError] = useState('')

  const pick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // lets the same file be chosen again later
    if (!file) return
    try {
      setError('')
      onChange(await fileToAvatar(file))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <Avatar src={value} size="xl" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-navy">Profile photo <span className="font-normal text-slate-400">(optional)</span></p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="secondary" icon={Camera} onClick={() => inputRef.current?.click()}>{value ? 'Change photo' : 'Add avatar'}</Button>
            {value && <Button type="button" size="sm" variant="secondary" icon={Trash2} onClick={() => { setError(''); onChange('') }}>Remove</Button>}
          </div>
          <p className="mt-1.5 text-xs text-slate-500">JPG, PNG, WebP or GIF up to 5 MB. It is cropped to a square.</p>
        </div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={pick} className="sr-only" tabIndex={-1} aria-label="Choose profile photo" />
      </div>
      {error && <p role="alert" className="mt-2 text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
}
