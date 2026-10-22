const TONES = {
  green: 'bg-green-100 text-green-700 ring-green-600/20',
  amber: 'bg-amber-100 text-amber-800 ring-amber-600/20',
  red: 'bg-red-100 text-red-700 ring-red-600/20',
  blue: 'bg-blue-100 text-blue-700 ring-blue-600/20',
  gray: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  cyan: 'bg-cyan-100 text-cyan-800 ring-cyan-600/20',
  orange: 'bg-orange-100 text-orange-800 ring-orange-600/20',
}

const AUTO = {
  Active: 'green', Inactive: 'gray', Maintenance: 'amber', Emergency: 'red',
  Critical: 'red', High: 'orange', Medium: 'amber', Low: 'blue',
  New: 'red', Acknowledged: 'amber', 'In Progress': 'blue', Resolved: 'green',
  Pending: 'amber', 'Under Review': 'blue', Dismissed: 'gray',
  Info: 'blue', Success: 'green', Warning: 'amber', Error: 'red',
  Driver: 'blue', Conductor: 'cyan', 
}

export default function Badge({ children, tone }) {
  const t = tone || AUTO[children] || 'gray'
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${TONES[t]}`}>
      {children}
    </span>
  )
}
