import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Clipboard, ExternalLink, Users } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import Loading from '../../components/common/Loading'
import { getErrorMessage } from '../../lib/errors'
import { useAuthStore } from '../../stores/authStore'
import { getSurveyResults } from '../../services/surveyService'
import type { AnswerRecord, ResponseRecord, Survey } from '../../types/survey'

const ResultChart = lazy(() => import('../../components/survey/ResultChart'))

interface ResultData {
  survey: Survey
  responses: ResponseRecord[]
  answers: AnswerRecord[]
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default function SurveyResultPage() {
  const { id } = useParams()
  const user = useAuthStore((state) => state.user)
  const [data, setData] = useState<ResultData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!id || !user) return

    let active = true
    const load = async () => {
      setIsLoading(true)
      setError('')
      try {
        const result = await getSurveyResults(id, user.id)
        if (active) setData(result)
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

  const responseById = useMemo(
    () => new Map(data?.responses.map((response) => [response.id, response]) ?? []),
    [data],
  )

  if (!id || !user) return null
  if (isLoading) return <Loading label="응답 결과를 불러오는 중입니다…" />

  if (!data) {
    return (
      <EmptyState
        title="결과를 찾을 수 없습니다."
        description={error || '삭제되었거나 접근 권한이 없습니다.'}
        action={<Link className="font-semibold text-indigo-700" to="/surveys">내 설문으로 돌아가기</Link>}
      />
    )
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/s/${data.survey.id}`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('링크를 복사하지 못했습니다. 브라우저 권한을 확인해주세요.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-indigo-600 p-6 text-white shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div>
          <p className="text-sm font-semibold text-indigo-100">응답 결과</p>
          <h1 className="mt-1 text-2xl font-bold">{data.survey.title}</h1>
          <p className="mt-3 flex items-center gap-1.5 text-sm text-indigo-100">
            <Users className="size-4" aria-hidden="true" />
            총 {data.responses.length}개의 응답
          </p>
        </div>
        {data.survey.status === 'published' && (
          <div className="flex flex-wrap gap-2">
            <Button className="bg-white text-indigo-700 hover:bg-indigo-50" onClick={() => void handleCopy()}>
              <Clipboard className="mr-1.5 size-4" aria-hidden="true" />
              {copied ? '복사됨' : '공유 링크 복사'}
            </Button>
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-indigo-300 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              to={`/s/${data.survey.id}`}
              target="_blank"
            >
              <ExternalLink className="mr-1.5 size-4" aria-hidden="true" />
              설문 열기
            </Link>
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
          {error}
        </p>
      )}

      <div className="space-y-5">
        {(data.survey.questions ?? []).map((question, index) => {
          const questionAnswers = data.answers.filter((answer) => answer.question_id === question.id)

          if (question.type === 'text') {
            return (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={question.id}>
                <p className="text-sm font-semibold text-indigo-600">질문 {index + 1} · 주관식</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">{question.title}</h2>
                {questionAnswers.length === 0 ? (
                  <p className="mt-5 text-sm text-slate-500">아직 제출된 답변이 없습니다.</p>
                ) : (
                  <ul className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-100">
                    {questionAnswers.map((answer) => (
                      <li className="px-4 py-3" key={answer.id}>
                        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{String(answer.answer)}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {responseById.get(answer.response_id)?.submitted_at
                            ? formatDateTime(responseById.get(answer.response_id)!.submitted_at)
                            : '제출 시간 없음'}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )
          }

          const counts = new Map<string, number>(question.options.map((option) => [option, 0]))
          for (const answer of questionAnswers) {
            const values = Array.isArray(answer.answer) ? answer.answer : [answer.answer]
            for (const value of values) {
              if (typeof value === 'string') counts.set(value, (counts.get(value) ?? 0) + 1)
            }
          }

          return (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={question.id}>
              <p className="text-sm font-semibold text-indigo-600">
                질문 {index + 1} · {question.type === 'single_choice' ? '객관식' : '복수 선택'}
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">{question.title}</h2>
              <p className="mt-2 text-sm text-slate-500">{questionAnswers.length}개의 답변</p>
              <div className="mt-4">
                <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-slate-100" />}>
                  <ResultChart data={[...counts].map(([label, count]) => ({ label, count }))} />
                </Suspense>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
