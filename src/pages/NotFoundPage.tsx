import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="text-center">
        <p className="text-5xl font-bold text-indigo-600">404</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">페이지를 찾을 수 없습니다.</h1>
        <Link className="mt-6 inline-block font-semibold text-indigo-700" to="/surveys">
          내 설문으로 돌아가기
        </Link>
      </section>
    </main>
  )
}
