import { useEffect, useState } from 'react'
import { BarChart3, Clipboard, ExternalLink, FilePlus2, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import Loading from '../../components/common/Loading'
import { getErrorMessage } from '../../lib/errors'
import { useAuthStore } from '../../stores/authStore'
import { deleteSurvey, getMySurveys } from '../../services/surveyService'
import type { SurveyListItem } from '../../types/survey'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

export default function SurveyListPage() {
  const user = useAuthStore((state) => state.user)
  const [surveys, setSurveys] = useState<SurveyListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingId, setPendingId] = useState('')
  const [copiedId, setCopiedId] = useState('')

  useEffect(() => {
    if (!user) return

    let active = true
    const load = async () => {
      setIsLoading(true)
      setError('')
      try {
        const data = await getMySurveys(user.id)
        if (active) setSurveys(data)
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
  }, [user])

  if (!user) return null

  const handleDelete = async (survey: SurveyListItem) => {
    if (!window.confirm(`'${survey.title}' 설문을 삭제할까요? 응답도 함께 삭제됩니다.`)) return

    setPendingId(survey.id)
    setError('')
    try {
      await deleteSurvey(survey.id, user.id)
      setSurveys((current) => current.filter((item) => item.id !== survey.id))
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setPendingId('')
    }
  }

  const handleCopy = async (surveyId: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/s/${surveyId}`)
      setCopiedId(surveyId)
      window.setTimeout(() => setCopiedId(''), 2000)
    } catch {
      setError('링크를 복사하지 못했습니다. 브라우저 권한을 확인해주세요.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-indigo-600">내 작업 공간</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">내 설문</h1>
          <p className="mt-2 text-sm text-slate-500">설문을 만들고, 발행하고, 결과를 확인하세요.</p>
        </div>
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          to="/surveys/new"
        >
          <FilePlus2 className="mr-1.5 size-4" aria-hidden="true" />
          새 설문 만들기
        </Link>
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
          {error}
        </p>
      )}

      {isLoading ? (
        <Loading label="내 설문을 불러오는 중입니다…" />
      ) : surveys.length === 0 ? (
        <EmptyState
          title="아직 만든 설문이 없습니다."
          description="첫 설문을 만들고 링크로 응답을 받아보세요."
          action={<Link className="font-semibold text-indigo-700" to="/surveys/new">새 설문 만들기</Link>}
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {surveys.map((survey) => (
            <li className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={survey.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold text-slate-900">{survey.title}</h2>
                  <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
                    {survey.description || '설명 없음'}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${survey.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                >
                  {survey.status === 'published' ? '발행됨' : '임시 저장'}
                </span>
              </div>

              <dl className="mt-5 grid grid-cols-3 gap-2 border-y border-slate-100 py-4 text-center text-sm">
                <div>
                  <dt className="text-slate-400">질문</dt>
                  <dd className="mt-1 font-bold text-slate-800">{survey.questionCount}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">응답</dt>
                  <dd className="mt-1 font-bold text-slate-800">{survey.responseCount}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">생성일</dt>
                  <dd className="mt-1 text-xs font-semibold text-slate-700">{formatDate(survey.created_at)}</dd>
                </div>
              </dl>

              <div className="mt-4 flex flex-wrap gap-2">
                {survey.status === 'draft' ? (
                  <Link
                    className="inline-flex min-h-9 items-center rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    to={`/surveys/${survey.id}/edit`}
                  >
                    <Pencil className="mr-1 size-4" aria-hidden="true" />
                    편집
                  </Link>
                ) : (
                  <>
                    <Link
                      className="inline-flex min-h-9 items-center rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      to={`/surveys/${survey.id}/results`}
                    >
                      <BarChart3 className="mr-1 size-4" aria-hidden="true" />
                      결과
                    </Link>
                    <Button variant="secondary" onClick={() => void handleCopy(survey.id)}>
                      <Clipboard className="mr-1 size-4" aria-hidden="true" />
                      {copiedId === survey.id ? '복사됨' : '링크 복사'}
                    </Button>
                    <Link
                      aria-label="공개 설문 열기"
                      className="inline-flex min-h-9 items-center rounded-lg border border-slate-300 px-3 text-slate-700 hover:bg-slate-50"
                      to={`/s/${survey.id}`}
                      target="_blank"
                    >
                      <ExternalLink className="size-4" aria-hidden="true" />
                    </Link>
                  </>
                )}
                <Button
                  aria-label={`${survey.title} 삭제`}
                  variant="ghost"
                  disabled={pendingId === survey.id}
                  onClick={() => void handleDelete(survey)}
                >
                  <Trash2 className="size-4 text-rose-600" aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
