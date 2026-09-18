import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import EmptyState from '../../components/common/EmptyState'
import Loading from '../../components/common/Loading'
import SurveyEditorForm from '../../components/survey/SurveyEditorForm'
import { getErrorMessage } from '../../lib/errors'
import { useAuthStore } from '../../stores/authStore'
import { getOwnedSurvey, saveSurvey } from '../../services/surveyService'
import { toEditorValues, type Survey, type SurveyEditorValues } from '../../types/survey'

export default function SurveyEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id || !user) return

    let active = true
    const load = async () => {
      setIsLoading(true)
      setError('')
      try {
        const nextSurvey = await getOwnedSurvey(id, user.id)
        if (active) setSurvey(nextSurvey)
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
  if (isLoading) return <Loading label="설문을 불러오는 중입니다…" />

  if (!survey) {
    return (
      <EmptyState
        title="설문을 찾을 수 없습니다."
        description={error || '삭제되었거나 접근 권한이 없습니다.'}
        action={<Link className="font-semibold text-indigo-700" to="/surveys">내 설문으로 돌아가기</Link>}
      />
    )
  }

  if (survey.status === 'published') {
    return (
      <EmptyState
        title="발행된 설문은 수정할 수 없습니다."
        description="응답 결과의 의미를 보존하기 위해 발행 후 질문을 고정합니다."
        action={
          <Link className="font-semibold text-indigo-700" to={`/surveys/${survey.id}/results`}>
            결과 보기
          </Link>
        }
      />
    )
  }

  const handleSave = async (values: SurveyEditorValues) => {
    setError('')
    try {
      await saveSurvey(survey.id, values)
      navigate('/surveys', { replace: true })
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
      throw caughtError
    }
  }

  const handlePublish = async (values: SurveyEditorValues) => {
    if (!window.confirm('설문을 발행하면 질문을 수정할 수 없습니다. 계속할까요?')) return

    setError('')
    try {
      await saveSurvey(survey.id, values, true)
      navigate(`/surveys/${survey.id}/results`, { replace: true })
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
      throw caughtError
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-indigo-600">임시 저장 설문</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">설문 편집</h1>
          <p className="mt-2 text-sm text-slate-500">저장한 뒤 발행하면 공유 링크가 활성화됩니다.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            to={`/surveys/${survey.id}/preview`}
            target="_blank"
          >
            <ExternalLink className="mr-1.5 size-4" aria-hidden="true" />
            미리보기
          </Link>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
          {error}
        </p>
      )}
      <SurveyEditorForm
        key={survey.id}
        defaultValues={toEditorValues(survey)}
        submitLabel="변경 사항 저장"
        onSave={handleSave}
        onPublish={handlePublish}
      />
    </div>
  )
}
