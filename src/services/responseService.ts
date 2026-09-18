import { requireSupabase } from '../lib/supabase'
import type { SurveyAnswer } from '../types/survey'

export async function submitSurvey(surveyId: string, answers: SurveyAnswer[]) {
  const { error } = await requireSupabase().rpc('submit_survey', {
    p_survey_id: surveyId,
    p_answers: answers,
  })

  if (error) throw error
}
