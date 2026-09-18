import { requireSupabase } from '../lib/supabase'
import type {
  EditorQuestion,
  Question,
  Survey,
  SurveyEditorValues,
  SurveyListItem,
} from '../types/survey'

function normalizeQuestion(question: EditorQuestion, surveyId: string, order: number) {
  const isText = question.type === 'text'

  return {
    survey_id: surveyId,
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

export async function createSurvey(userId: string, values: SurveyEditorValues): Promise<Survey> {
  const client = requireSupabase()
  const { data: survey, error: surveyError } = await client
    .from('surveys')
    .insert({
      user_id: userId,
      title: values.title.trim(),
      description: values.description.trim(),
      status: 'draft',
    })
    .select()
    .single()

  if (surveyError) throw surveyError

  const { error: questionError } = await client
    .from('questions')
    .insert(values.questions.map((question, index) => normalizeQuestion(question, survey.id, index)))

  if (questionError) {
    await client.from('surveys').delete().eq('id', survey.id)
    throw questionError
  }

  return survey as Survey
}

export async function updateSurvey(surveyId: string, values: SurveyEditorValues) {
  const client = requireSupabase()
  const { error: surveyError } = await client
    .from('surveys')
    .update({
      title: values.title.trim(),
      description: values.description.trim(),
    })
    .eq('id', surveyId)

  if (surveyError) throw surveyError

  const { error: deleteError } = await client.from('questions').delete().eq('survey_id', surveyId)
  if (deleteError) throw deleteError

  const { error: questionError } = await client
    .from('questions')
    .insert(values.questions.map((question, index) => normalizeQuestion(question, surveyId, index)))

  if (questionError) throw questionError
}

export async function publishSurvey(surveyId: string, userId: string) {
  const { error } = await requireSupabase()
    .from('surveys')
    .update({ status: 'published' })
    .eq('id', surveyId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function deleteSurvey(surveyId: string, userId: string) {
  const { error } = await requireSupabase()
    .from('surveys')
    .delete()
    .eq('id', surveyId)
    .eq('user_id', userId)

  if (error) throw error
}

export type { Question }
