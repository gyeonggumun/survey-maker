import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { useFieldArray, useWatch, type Control, type UseFormRegister, type UseFormSetValue } from 'react-hook-form'
import { QUESTION_TYPE_LABELS } from '../../constants/questionTypes'
import type { QuestionType, SurveyEditorValues } from '../../types/survey'
import Button from '../common/Button'
import Input from '../common/Input'

interface QuestionEditorProps {
  control: Control<SurveyEditorValues>
  register: UseFormRegister<SurveyEditorValues>
  setValue: UseFormSetValue<SurveyEditorValues>
  index: number
  count: number
  onRemove: () => void
  onMove: (from: number, to: number) => void
}

const questionTypes = Object.entries(QUESTION_TYPE_LABELS) as [QuestionType, string][]

export default function QuestionEditor({
  control,
  register,
  setValue,
  index,
  count,
  onRemove,
  onMove,
}: QuestionEditorProps) {
  const type = useWatch({ control, name: `questions.${index}.type` })
  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({
    control,
    name: `questions.${index}.options` as const,
  })
  const typeRegister = register(`questions.${index}.type`)

  const handleTypeChange = (nextType: QuestionType) => {
    setValue(`questions.${index}.type`, nextType, { shouldDirty: true })
    setValue(
      `questions.${index}.options`,
      nextType === 'text' ? [] : [{ value: '' }, { value: '' }],
      { shouldDirty: true },
    )
    if (nextType !== 'text') {
      setValue(`questions.${index}.maxLength`, undefined, { shouldDirty: true })
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="pt-2 text-sm font-bold text-indigo-700">질문 {index + 1}</p>
        <div className="flex gap-1">
          <Button
            aria-label="질문을 위로 이동"
            variant="ghost"
            type="button"
            disabled={index === 0}
            onClick={() => onMove(index, index - 1)}
          >
            <ChevronUp className="size-4" aria-hidden="true" />
          </Button>
          <Button
            aria-label="질문을 아래로 이동"
            variant="ghost"
            type="button"
            disabled={index === count - 1}
            onClick={() => onMove(index, index + 1)}
          >
            <ChevronDown className="size-4" aria-hidden="true" />
          </Button>
          <Button aria-label="질문 삭제" variant="ghost" type="button" onClick={onRemove}>
            <Trash2 className="size-4 text-rose-600" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        <Input
          label="질문 내용"
          placeholder="응답자에게 보여줄 질문을 입력하세요"
          {...register(`questions.${index}.title`, {
            required: '질문 내용을 입력하세요.',
            validate: (value) => value.trim().length > 0 || '질문 내용을 입력하세요.',
          })}
        />

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-slate-700">질문 유형</span>
          <select
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            {...typeRegister}
            onChange={(event) => {
              typeRegister.onChange(event)
              handleTypeChange(event.target.value as QuestionType)
            }}
          >
            {questionTypes.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        {type !== 'text' && (
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-700">선택지</p>
              <Button
                variant="secondary"
                type="button"
                onClick={() => appendOption({ value: '' })}
              >
                <Plus className="mr-1 size-4" aria-hidden="true" />
                선택지 추가
              </Button>
            </div>
            <div className="mt-3 space-y-2">
              {optionFields.map((field, optionIndex) => (
                <div className="flex items-center gap-2" key={field.id}>
                  <input
                    className="min-h-10 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    aria-label={`선택지 ${optionIndex + 1}`}
                    placeholder={`선택지 ${optionIndex + 1}`}
                    {...register(`questions.${index}.options.${optionIndex}.value`, {
                      required: '선택지를 입력하세요.',
                      validate: (value) => value.trim().length > 0 || '선택지를 입력하세요.',
                    })}
                  />
                  <Button
                    aria-label={`선택지 ${optionIndex + 1} 삭제`}
                    variant="ghost"
                    type="button"
                    disabled={optionFields.length <= 2}
                    onClick={() => removeOption(optionIndex)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {type === 'text' && (
          <Input
            label="최대 글자 수 (선택)"
            type="number"
            min="1"
            max="10000"
            placeholder="제한 없음"
            {...register(`questions.${index}.maxLength`, {
              setValueAs: (value) => (value === '' ? undefined : Number(value)),
              min: { value: 1, message: '최소 1자 이상이어야 합니다.' },
              max: { value: 10000, message: '최대 10,000자까지 설정할 수 있습니다.' },
            })}
          />
        )}

        <label className="flex w-fit cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
          <input
            className="size-4 accent-indigo-600"
            type="checkbox"
            {...register(`questions.${index}.required`)}
          />
          필수 응답
        </label>
      </div>
    </section>
  )
}
