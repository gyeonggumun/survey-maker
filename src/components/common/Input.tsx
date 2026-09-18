import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export default function Input({
  label,
  error,
  id,
  className = '',
  ...props
}: InputProps) {
  const inputId = id ?? props.name

  return (
    <label className="flex flex-col gap-1.5" htmlFor={inputId}>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        id={inputId}
        className={`min-h-11 rounded-lg border bg-white px-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 ${error ? 'border-rose-500' : 'border-slate-300'} ${className}`}
        {...props}
      />
      {error && <span className="text-sm text-rose-600">{error}</span>}
    </label>
  )
}
