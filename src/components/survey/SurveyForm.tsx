import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { Survey, SurveyAnswer } from '../../types/survey'
import Button from '../common/Button'

type ResponseValues = Record<string, string | string[] | undefined>

interface SurveyFormProps {
  survey: Survey
  submitLabel?: string
  onSubmit: (answers: SurveyAnswer[]) => Promise<void>
}

function toAnswers(values: ResponseValues): SurveyAnswer[] {
  const answers: SurveyAnswer[] = []

  for (const [questionId, answer] of Object.entries(values)) {
    if (typeof answer === 'string') {
      const trimmed = answer.trim()
      if (trimmed) answers.push({ question_id: questionId, answer: trimmed })
      continue
    }

    if (Array.isArray(answer) && answer.length > 0) {
      answers.push({ question_id: questionId, answer })
    }
  }

  return answers
}

export default function SurveyForm({ survey, submitLabel = '응답 제출', onSubmit }: SurveyFormProps) {
  const [submitError, setSubmitError] = useState('')
  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResponseValues>()

  const handleValidSubmit = async (values: ResponseValues) => {
    setSubmitError('')
    try {
      await onSubmit(toAnswers(values))
    } catch {
      setSubmitError('응답을 제출하지 못했습니다. 잠시 후 다시 시도해주세요.')
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(handleValidSubmit)}>
      {(survey.questions ?? []).map((question, index) => {
        const error = errors[question.id]?.message
        const selectedValues = (watch(question.id) as string[] | undefined) ?? []

        return (
          <fieldset className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={question.id}>
            <legend className="w-full text-base font-bold leading-6 text-slate-900">
              <span className="mr-2 text-indigo-600">{index + 1}.</span>
              {question.title}
              {question.required && <span className="ml-1 text-rose-600" aria-label="필수 응답">*</span>}
            </legend>

            <div className="mt-4">
              {question.type === 'text' && (
                <textarea
                  className="min-h-28 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  maxLength={question.max_length ?? undefined}
                  placeholder="답변을 입력하세요"
                  {...register(question.id, {
                    validate: (value) =>
                      !question.required ||
                      (typeof value === 'string' && value.trim().length > 0) ||
                      '필수 질문입니다.',
                  })}
                />
              )}

              {question.type === 'single_choice' && (
                <div className="space-y-2">
                  {question.options.map((option) => (
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50" key={option}>
                      <input
                        className="size-4 accent-indigo-600"
                        type="radio"
                        value={option}
                        {...register(question.id, {
                          required: question.required ? '필수 질문입니다.' : false,
                        })}
                      />
                      <span className="text-sm text-slate-700">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === 'multiple_choice' && (
                <div className="space-y-2">
                  {question.options.map((option) => (
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50" key={option}>
                      <input
                        className="size-4 rounded accent-indigo-600"
                        type="checkbox"
                        checked={selectedValues.includes(option)}
                        onChange={(event) => {
                          const nextValues = event.target.checked
                            ? [...selectedValues, option]
                            : selectedValues.filter((value) => value !== option)
                          setValue(question.id, nextValues, { shouldValidate: true })
                        }}
                      />
                      <span className="text-sm text-slate-700">{option}</span>
                    </label>
                  ))}
                  <input
                    type="hidden"
                    {...register(question.id, {
                      validate: (value) =>
                        !question.required ||
                        (Array.isArray(value) && value.length > 0) ||
                        '필수 질문입니다.',
                    })}
                  />
                </div>
              )}
            </div>
            {error && <p className="mt-3 text-sm text-rose-600" role="alert">{String(error)}</p>}
          </fieldset>
        )
      })}

      {submitError && (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
          {submitError}
        </p>
      )}

      <Button className="w-full sm:w-auto" type="submit" disabled={isSubmitting}>
        {isSubmitting ? '제출 중…' : submitLabel}
      </Button>
    </form>
  )
}
