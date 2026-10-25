export const inputClass = (error) =>
  `w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:ring-2 [@media(pointer:coarse)]:min-h-[44px] ${
    error ? 'border-red-400 focus:ring-red-200' : 'border-slate-300 focus:border-brand focus:ring-brand/20'
  } disabled:bg-slate-100 disabled:text-slate-500`
