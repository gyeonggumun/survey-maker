import type { ReactNode } from 'react'
import { BarChart3, ClipboardList, ShieldCheck, Sparkles } from 'lucide-react'

const highlights = [
  { icon: Sparkles, label: '빠른 설문 제작', description: '질문을 추가하고 바로 발행하세요.' },
  { icon: BarChart3, label: '한눈에 보는 결과', description: '응답 흐름을 차트로 확인하세요.' },
  { icon: ShieldCheck, label: '안전한 데이터', description: '사용자별 권한으로 데이터를 보호합니다.' },
]

interface AuthLayoutProps {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}

export default function AuthLayout({
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <main className="relative isolate flex min-h-screen overflow-hidden bg-slate-950 px-4 py-6 sm:px-6 lg:items-center lg:py-10">
      <div className="pointer-events-none absolute -left-24 top-8 size-72 rounded-full bg-indigo-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 size-80 rounded-full bg-cyan-400/20 blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_.9fr] lg:items-stretch">
        <section className="hidden overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 p-10 text-white shadow-2xl lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                <ClipboardList className="size-6" aria-hidden="true" />
              </span>
              <span className="text-lg font-bold tracking-tight">설문 제작소</span>
            </div>
            <p className="mt-16 max-w-md text-sm font-semibold uppercase tracking-[0.2em] text-indigo-200">
              Make every response count
            </p>
            <h2 className="mt-4 max-w-lg text-4xl font-bold leading-tight xl:text-5xl">
              질문은 간단하게,
              <br />
              인사이트는 선명하게.
            </h2>
            <p className="mt-6 max-w-md text-base leading-7 text-indigo-100">
              설문을 만들고 공유하는 순간부터 응답을 이해하는 순간까지 한 곳에서 관리하세요.
            </p>
          </div>

          <ul className="mt-12 grid gap-3">
            {highlights.map(({ icon: Icon, label, description: itemDescription }) => (
              <li className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10" key={label}>
                <Icon className="size-5 shrink-0 text-indigo-200" aria-hidden="true" />
                <span>
                  <strong className="block text-sm">{label}</strong>
                  <span className="text-xs text-indigo-100">{itemDescription}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex items-center rounded-3xl border border-white/10 bg-white p-6 shadow-2xl sm:p-10">
          <div className="w-full">
            <div className="mb-8 flex items-center gap-2 lg:hidden">
              <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <ClipboardList className="size-5" aria-hidden="true" />
              </span>
              <span className="font-bold text-slate-900">설문 제작소</span>
            </div>
            <p className="text-sm font-semibold text-indigo-600">{eyebrow}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
            <div className="mt-8">{children}</div>
            <div className="mt-6 border-t border-slate-100 pt-5">{footer}</div>
          </div>
        </section>
      </div>
    </main>
  )
}
