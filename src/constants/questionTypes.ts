import type { QuestionType } from '../types/survey'

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  single_choice: '객관식',
  multiple_choice: '복수 선택',
  text: '주관식',
}
