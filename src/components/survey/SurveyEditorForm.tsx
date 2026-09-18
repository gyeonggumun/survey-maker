import { Plus, Save } from 'lucide-react'
import { useFieldArray, useForm } from 'react-hook-form'
import { createEmptyQuestion, type SurveyEditorValues } from '../../types/survey'
import Button from '../common/Button'
import Input from '../common/Input'
import QuestionEditor from './QuestionEditor'

interface SurveyEditorFormProps {
  defaultValues?: SurveyEditorValues
  submitLabel: string
  onSubmit: (values: SurveyEditorValues) => Promise<void>
}

const initialValues: SurveyEditorValues = {
  title: '',
  description: '',
  questions: [createEmptyQuestion()],
}

export default function SurveyEditorForm({
  defaultValues = initialValues,
  submitLabel,
  onSubmit,
}: SurveyEditorFormProps) {
  const {
    control,
    register,
    setValue,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SurveyEditorValues>({ defaultValues })
  const { fields, append, remove, move } = useFieldArray({ control, name: 'questions' })

  const handleValidSubmit = async (values: SurveyEditorValues) => {
    if (values.questions.length === 0) {
      setError('root', { message: '설문에는 질문이 하나 이상 필요합니다.' })
      return
    }

    const invalidChoice = values.questions.some(
      (question) => question.type !== 'text' && question.options.filter((option) => option.value.trim()).length < 2,
    )

    if (invalidChoice) {
      setError('root', { message: '객관식과 복수 선택 질문에는 선택지가 2개 이상 필요합니다.' })
      return
    }

    await onSubmit(values)
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(handleValidSubmit)}>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-5">
          <Input
            label="설문 제목"
            placeholder="예: 2026 동아리 활동 만족도 조사"
            error={errors.title?.message}
            {...register('title', {
              required: '설문 제목을 입력하세요.',
              validate: (value) => value.trim().length > 0 || '설문 제목을 입력하세요.',
              maxLength: { value: 160, message: '제목은 160자 이하여야 합니다.' },
            })}
          />

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-slate-700">설문 설명</span>
            <textarea
              className="min-h-28 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder="응답자에게 설문의 목적이나 안내사항을 알려주세요."
              {...register('description', {
                maxLength: { value: 5000, message: '설명은 5,000자 이하여야 합니다.' },
              })}
            />
            {errors.description?.message && (
              <span className="text-sm text-rose-600">{errors.description.message}</span>
            )}
          </label>
        </div>
      </section>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <QuestionEditor
            key={field.id}
            control={control}
            register={register}
            setValue={setValue}
            index={index}
            count={fields.length}
            onRemove={() => remove(index)}
            onMove={move}
          />
        ))}
      </div>

      <Button
        className="w-full border-2 border-dashed border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
        variant="ghost"
        type="button"
        onClick={() => append(createEmptyQuestion())}
      >
        <Plus className="mr-1.5 size-4" aria-hidden="true" />
        질문 추가
      </Button>

      {errors.root?.message && (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
          {errors.root.message}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          <Save className="mr-1.5 size-4" aria-hidden="true" />
          {isSubmitting ? '저장 중…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
