-- Prevent failed writes from locking surveys that belong to another user.
create or replace function app_private.can_edit_draft_survey(p_survey_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := (select auth.uid());
begin
  if v_caller is null then
    return false;
  end if;

  perform 1
  from public.surveys s
  where s.id = p_survey_id
    and s.user_id = v_caller
    and s.status = 'draft'
  for update;

  return found;
end;
$$;

-- Save the survey and all of its questions in one database transaction. Publishing
-- happens only after the replacement questions exist, so the publish trigger can
-- enforce the non-empty survey invariant.
create or replace function public.save_survey(
  p_survey_id uuid,
  p_title text,
  p_description text,
  p_questions jsonb,
  p_publish boolean default false
)
returns public.surveys
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_survey public.surveys;
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_questions is null
     or jsonb_typeof(p_questions) <> 'array'
     or jsonb_array_length(p_questions) not between 1 and 200 then
    raise exception 'A survey needs between 1 and 200 questions'
      using errcode = '22023';
  end if;

  if p_survey_id is null then
    insert into public.surveys (user_id, title, description, status)
    values (v_user_id, p_title, coalesce(p_description, ''), 'draft')
    returning * into v_survey;
  else
    update public.surveys
    set title = p_title,
        description = coalesce(p_description, '')
    where id = p_survey_id
      and user_id = v_user_id
      and status = 'draft'
    returning * into v_survey;

    if not found then
      raise exception 'Survey cannot be edited';
    end if;
  end if;

  delete from public.questions where survey_id = v_survey.id;

  insert into public.questions (
    survey_id,
    type,
    title,
    options,
    required,
    max_length,
    question_order
  )
  select
    v_survey.id,
    q.type,
    q.title,
    q.options,
    coalesce(q.required, false),
    q.max_length,
    q.question_order
  from jsonb_to_recordset(p_questions) as q(
    type text,
    title text,
    options jsonb,
    required boolean,
    max_length integer,
    question_order integer
  );

  if p_publish then
    update public.surveys
    set status = 'published'
    where id = v_survey.id
      and user_id = v_user_id
    returning * into v_survey;
  end if;

  return v_survey;
end;
$$;

revoke all on function public.save_survey(uuid, text, text, jsonb, boolean)
  from public, anon, authenticated;

grant execute on function public.save_survey(uuid, text, text, jsonb, boolean)
  to authenticated;
