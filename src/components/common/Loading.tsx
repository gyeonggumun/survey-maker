interface LoadingProps {
  label?: string
}

export default function Loading({ label = '불러오는 중입니다…' }: LoadingProps) {
  return (
    <div className="flex min-h-48 items-center justify-center gap-3 text-slate-500" role="status">
      <span className="size-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
      <span>{label}</span>
    </div>
  )
}
