import { requireSupabase } from '../lib/supabase'
import type {
  AnswerRecord,
  EditorQuestion,
  ResponseRecord,
  Survey,
  SurveyEditorValues,
  SurveyListItem,
} from '../types/survey'

function normalizeQuestion(question: EditorQuestion, order: number) {
  const isText = question.type === 'text'

  return {
    type: question.type,
    title: question.title.trim(),
    options: isText
      ? []
      : question.options.map((option) => option.value.trim()).filter(Boolean),
    required: question.required,
    max_length: isText ? question.maxLength ?? null : null,
    question_order: order,
  }
}

function sortQuestions(survey: Survey): Survey {
  return {
    ...survey,
    questions: [...(survey.questions ?? [])].sort(
      (a, b) => a.question_order - b.question_order,
    ),
  }
}

export async function getMySurveys(userId: string): Promise<SurveyListItem[]> {
  const { data, error } = await requireSupabase()
    .from('surveys')
    .select('*, questions(count), responses(count)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((survey) => ({
    ...(survey as Survey),
    questionCount: survey.questions?.[0]?.count ?? 0,
    responseCount: survey.responses?.[0]?.count ?? 0,
  }))
}

export async function getOwnedSurvey(surveyId: string, userId: string): Promise<Survey> {
  const { data, error } = await requireSupabase()
    .from('surveys')
    .select('*, questions(*)')
    .eq('id', surveyId)
    .eq('user_id', userId)
    .single()

  if (error) throw error
  return sortQuestions(data as Survey)
}

export async function getPublishedSurvey(surveyId: string): Promise<Survey> {
  const { data, error } = await requireSupabase()
    .from('surveys')
    .select('*, questions(*)')
    .eq('id', surveyId)
    .eq('status', 'published')
    .single()

  if (error) throw error
  return sortQuestions(data as Survey)
}

export async function saveSurvey(
  surveyId: string | null,
  values: SurveyEditorValues,
  publish = false,
): Promise<Survey> {
  const { data, error } = await requireSupabase().rpc('save_survey', {
    p_survey_id: surveyId,
    p_title: values.title.trim(),
    p_description: values.description.trim(),
    p_questions: values.questions.map(normalizeQuestion),
    p_publish: publish,
  })

  if (error) throw error
  return data as Survey
}

export async function deleteSurvey(surveyId: string, userId: string) {
  const { error } = await requireSupabase()
    .from('surveys')
    .delete()
    .eq('id', surveyId)
    .eq('user_id', userId)

  if (error) throw error
}

const PAGE_SIZE = 1_000

async function getAllResponses(surveyId: string): Promise<ResponseRecord[]> {
  const responses: ResponseRecord[] = []

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await requireSupabase()
      .from('responses')
      .select('*')
      .eq('survey_id', surveyId)
      .order('submitted_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw error
    const page = (data ?? []) as ResponseRecord[]
    responses.push(...page)
    if (page.length < PAGE_SIZE) return responses
  }
}

async function getAllAnswers(surveyId: string): Promise<AnswerRecord[]> {
  const answers: AnswerRecord[] = []

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await requireSupabase()
      .from('answers')
      .select('*')
      .eq('survey_id', surveyId)
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw error
    const page = (data ?? []) as AnswerRecord[]
    answers.push(...page)
    if (page.length < PAGE_SIZE) return answers
  }
}

export async function getSurveyResults(surveyId: string, userId: string) {
  const [survey, responses, answers] = await Promise.all([
    getOwnedSurvey(surveyId, userId),
    getAllResponses(surveyId),
    getAllAnswers(surveyId),
  ])

  return {
    survey,
    responses,
    answers,
  }
}
