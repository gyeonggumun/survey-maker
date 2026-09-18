import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SurveyEditorForm from '../../components/survey/SurveyEditorForm'
import { getErrorMessage } from '../../lib/errors'
import { useAuthStore } from '../../stores/authStore'
import { createSurvey } from '../../services/surveyService'
import type { SurveyEditorValues } from '../../types/survey'

export default function SurveyCreatePage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [error, setError] = useState('')

  if (!user) return null

  const handleSubmit = async (values: SurveyEditorValues) => {
    setError('')

    try {
      const survey = await createSurvey(user.id, values)
      navigate(`/surveys/${survey.id}/edit`, { replace: true })
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
      throw caughtError
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-indigo-600">새 설문</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">설문 만들기</h1>
        <p className="mt-2 text-sm text-slate-500">질문을 작성한 뒤 저장하고 발행하세요.</p>
      </div>
      {error && (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
          {error}
        </p>
      )}
      <SurveyEditorForm submitLabel="임시 저장" onSubmit={handleSubmit} />
    </div>
  )
}
