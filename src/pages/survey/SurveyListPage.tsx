import { useEffect, useState } from 'react'
import {
  BarChart3,
  Clipboard,
  ClipboardList,
  ExternalLink,
  FilePlus2,
  MessageSquareText,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
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

interface DashboardStatProps {
  icon: typeof ClipboardList
  label: string
  value: number
}

function DashboardStat({ icon: Icon, label, value }: DashboardStatProps) {
  return (
    <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-indigo-100">{label}</span>
        <Icon className="size-4 text-indigo-200" aria-hidden="true" />
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  )
}

export default function SurveyListPage() {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const [surveys, setSurveys] = useState<SurveyListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingId, setPendingId] = useState('')
  const [copiedId, setCopiedId] = useState('')
  const [notice, setNotice] = useState(
    () => (location.state as { notice?: string } | null)?.notice ?? '',
  )

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

  const publishedCount = surveys.filter((survey) => survey.status === 'published').length
  const responseCount = surveys.reduce((total, survey) => total + survey.responseCount, 0)

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
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 p-5 text-white shadow-xl shadow-indigo-200/50 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-200">내 작업 공간</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">내 설문</h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-indigo-100">
              설문을 만들고, 발행하고, 응답의 흐름을 한눈에 확인하세요.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-bold text-indigo-700 shadow-lg shadow-indigo-950/20 transition hover:bg-indigo-50"
            to="/surveys/new"
          >
            <FilePlus2 className="mr-1.5 size-4" aria-hidden="true" />
            새 설문 만들기
          </Link>
        </div>
        <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <DashboardStat icon={ClipboardList} label="전체 설문" value={surveys.length} />
          <DashboardStat icon={BarChart3} label="발행된 설문" value={publishedCount} />
          <DashboardStat icon={MessageSquareText} label="전체 응답" value={responseCount} />
        </div>
      </section>

      {error && (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <button
          className="block w-full rounded-lg bg-emerald-50 px-4 py-3 text-left text-sm text-emerald-700"
          type="button"
          onClick={() => setNotice('')}
        >
          {notice}
        </button>
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
            <li className="group rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/60 sm:p-6" key={survey.id}>
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

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
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
