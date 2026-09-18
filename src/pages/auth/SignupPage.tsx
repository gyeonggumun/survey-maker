import { Link } from 'react-router-dom'

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-indigo-600">설문 제작소</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">회원가입</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">인증 기능을 준비하고 있습니다.</p>
        <p className="mt-6 text-sm text-slate-600">
          이미 계정이 있나요?{' '}
          <Link className="font-semibold text-indigo-700" to="/login">
            로그인
          </Link>
        </p>
      </section>
    </main>
  )
}
