export type QuestionType = 'single_choice' | 'multiple_choice' | 'text'
export type SurveyStatus = 'draft' | 'published'

export interface Question {
  id: string
  survey_id: string
  type: QuestionType
  title: string
  options: string[]
  required: boolean
  max_length: number | null
  question_order: number
  created_at: string
}

export interface Survey {
  id: string
  user_id: string
  title: string
  description: string
  status: SurveyStatus
  created_at: string
  updated_at: string
  questions?: Question[]
}

export interface SurveyListItem extends Survey {
  questionCount: number
  responseCount: number
}

export interface EditorOption {
  value: string
}

export interface EditorQuestion {
  type: QuestionType
  title: string
  options: EditorOption[]
  required: boolean
  maxLength?: number
}

export interface SurveyEditorValues {
  title: string
  description: string
  questions: EditorQuestion[]
}

export interface SurveyAnswer {
  question_id: string
  answer: string | string[]
}

export interface ResponseRecord {
  id: string
  survey_id: string
  submitted_at: string
}

export interface AnswerRecord {
  id: string
  survey_id: string
  response_id: string
  question_id: string
  answer: string | string[]
}

export function createEmptyQuestion(type: QuestionType = 'single_choice'): EditorQuestion {
  return {
    type,
    title: '',
    options: type === 'text' ? [] : [{ value: '' }, { value: '' }],
    required: false,
  }
}

export function toEditorValues(survey: Survey): SurveyEditorValues {
  return {
    title: survey.title,
    description: survey.description,
    questions: (survey.questions ?? [])
      .sort((a, b) => a.question_order - b.question_order)
      .map((question) => ({
        type: question.type,
        title: question.title,
        options: question.options.map((value) => ({ value })),
        required: question.required,
        maxLength: question.max_length ?? undefined,
      })),
  }
}
