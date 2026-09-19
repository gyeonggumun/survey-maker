import { useEffect, useState } from 'react'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import EmptyState from '../../components/common/EmptyState'
import Loading from '../../components/common/Loading'
import SurveyForm from '../../components/survey/SurveyForm'
import { getErrorMessage } from '../../lib/errors'
import { submitSurvey } from '../../services/responseService'
import { getPublishedSurvey } from '../../services/surveyService'
import type { Survey, SurveyAnswer } from '../../types/survey'

export default function SurveyResponsePage() {
  const { id } = useParams()
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (!id) return

    let active = true
    const load = async () => {
      setIsLoading(true)
      setError('')
      try {
        const data = await getPublishedSurvey(id)
        if (active) setSurvey(data)
      } catch (caughtError) {
        if (active) setError(getErrorMessage(caughtError))
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [id])

  if (!id) return null
  if (isLoading) return <Loading label="설문을 불러오는 중입니다…" />

  if (!survey) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl items-center px-4">
        <EmptyState
          title="응답할 수 없는 설문입니다."
          description={error || '설문이 삭제되었거나 아직 발행되지 않았습니다.'}
        />
      </main>
    )
  }

  if (isComplete) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl items-center px-4">
        <section className="w-full rounded-2xl border border-emerald-100 bg-white p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto size-12 text-emerald-600" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">응답을 제출했습니다.</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{survey.title}에 참여해주셔서 감사합니다.</p>
          <Link
            className="mt-6 inline-flex min-h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
            to="/login"
          >
            <ArrowLeft className="mr-1.5 size-4" aria-hidden="true" />
            설문 제작소로 이동
          </Link>
        </section>
      </main>
    )
  }

  const handleSubmit = async (answers: SurveyAnswer[]) => {
    await submitSurvey(survey.id, answers)
    setIsComplete(true)
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <header className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-5 text-white shadow-xl shadow-indigo-200/50 sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-16 size-48 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
          <p className="text-sm font-semibold text-indigo-100">설문조사</p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{survey.title}</h1>
          {survey.description && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-indigo-50">{survey.description}</p>}
          <p className="mt-5 text-xs text-indigo-100"><span className="text-rose-200">*</span> 필수 응답 항목</p>
          </div>
        </header>
        <SurveyForm survey={survey} onSubmit={handleSubmit} />
      </div>
    </main>
  )
}
