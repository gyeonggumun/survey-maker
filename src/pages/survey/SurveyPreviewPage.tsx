import { useEffect, useState } from 'react'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import EmptyState from '../../components/common/EmptyState'
import Loading from '../../components/common/Loading'
import SurveyForm from '../../components/survey/SurveyForm'
import { getErrorMessage } from '../../lib/errors'
import { useAuthStore } from '../../stores/authStore'
import { getOwnedSurvey } from '../../services/surveyService'
import type { Survey } from '../../types/survey'

export default function SurveyPreviewPage() {
  const { id } = useParams()
  const user = useAuthStore((state) => state.user)
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!id || !user) return

    let active = true
    const load = async () => {
      setIsLoading(true)
      try {
        const data = await getOwnedSurvey(id, user.id)
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
  }, [id, user])

  if (!id || !user) return null
  if (isLoading) return <Loading label="미리보기를 불러오는 중입니다…" />

  if (!survey) {
    return (
      <EmptyState
        title="설문을 찾을 수 없습니다."
        description={error || '삭제되었거나 접근 권한이 없습니다.'}
        action={<Link className="font-semibold text-indigo-700" to="/surveys">내 설문으로 돌아가기</Link>}
      />
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-indigo-700" to={`/surveys/${survey.id}/edit`}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          편집으로 돌아가기
        </Link>
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">미리보기</span>
      </div>

      <header className="rounded-2xl bg-indigo-600 p-6 text-white shadow-sm sm:p-8">
        <p className="text-sm font-semibold text-indigo-100">응답자 화면</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{survey.title}</h1>
        {survey.description && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-indigo-50">{survey.description}</p>}
        <p className="mt-5 text-xs text-indigo-100"><span className="text-rose-200">*</span> 필수 응답 항목</p>
      </header>

      {submitted && (
        <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700" role="status">
          <CheckCircle2 className="size-4" aria-hidden="true" />
          검증을 통과했습니다. 미리보기의 답변은 저장되지 않습니다.
        </p>
      )}

      <SurveyForm survey={survey} submitLabel="제출 동작 확인" onSubmit={async () => setSubmitted(true)} />
    </div>
  )
}
