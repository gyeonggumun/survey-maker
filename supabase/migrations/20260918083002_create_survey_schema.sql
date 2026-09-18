create schema if not exists app_private;

revoke all on schema app_private from public;
revoke all on schema app_private from anon, authenticated;

create or replace function app_private.valid_choice_options(p_options jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_options is null or jsonb_typeof(p_options) <> 'array' then
    return false;
  end if;

  if jsonb_array_length(p_options) < 2 or jsonb_array_length(p_options) > 100 then
    return false;
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_options) as option_item(value)
    where jsonb_typeof(value) <> 'string'
      or btrim(value #>> '{}') = ''
  ) then
    return false;
  end if;

  return (
    select count(*) = count(distinct value #>> '{}')
    from jsonb_array_elements(p_options) as option_item(value)
  );
end;
$$;

create table public.surveys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint surveys_title_length_check
    check (char_length(btrim(title)) between 1 and 160),
  constraint surveys_description_length_check
    check (char_length(description) <= 5000),
  constraint surveys_status_check
    check (status in ('draft', 'published'))
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  type text not null,
  title text not null,
  options jsonb not null default '[]'::jsonb,
  required boolean not null default false,
  max_length integer,
  question_order integer not null,
  created_at timestamptz not null default now(),

  constraint questions_id_survey_id_key unique (id, survey_id),
  constraint questions_survey_order_key unique (survey_id, question_order),
  constraint questions_type_check
    check (type in ('single_choice', 'multiple_choice', 'text')),
  constraint questions_title_length_check
    check (char_length(btrim(title)) between 1 and 500),
  constraint questions_order_range_check
    check (question_order between 0 and 199),
  constraint questions_shape_check
    check (
      (
        type in ('single_choice', 'multiple_choice')
        and app_private.valid_choice_options(options)
        and max_length is null
      )
      or
      (
        type = 'text'
        and options = '[]'::jsonb
        and (max_length is null or max_length between 1 and 10000)
      )
    )
);

create table public.responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  submitted_at timestamptz not null default now(),

  constraint responses_id_survey_id_key unique (id, survey_id)
);

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null,
  response_id uuid not null,
  question_id uuid not null,
  answer jsonb not null,

  constraint answers_answer_type_check
    check (jsonb_typeof(answer) in ('string', 'array')),
  constraint answers_response_in_survey_fkey
    foreign key (response_id, survey_id)
    references public.responses (id, survey_id)
    on delete cascade,
  constraint answers_question_in_survey_fkey
    foreign key (question_id, survey_id)
    references public.questions (id, survey_id)
    on delete cascade,
  constraint answers_response_question_key unique (response_id, question_id)
);

create index surveys_user_created_at_idx
  on public.surveys (user_id, created_at desc);

create index responses_survey_submitted_at_idx
  on public.responses (survey_id, submitted_at desc);

create index answers_survey_question_idx
  on public.answers (survey_id, question_id);

create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger surveys_set_updated_at
before update on public.surveys
for each row
execute function app_private.set_updated_at();

create or replace function app_private.assert_publishable_survey()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if old.status <> 'draft' or new.status <> 'published' then
    raise exception 'Invalid survey status transition' using errcode = '23514';
  end if;

  if not exists (
    select 1 from public.questions where survey_id = new.id
  ) then
    raise exception 'A survey needs at least one question before publishing'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger surveys_validate_publish
before update of status on public.surveys
for each row
execute function app_private.assert_publishable_survey();

-- Lock the parent row while a draft question is changed. This prevents a question
-- write from racing a draft-to-published transition.
create or replace function app_private.can_edit_draft_survey(p_survey_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := (select auth.uid());
  v_owner uuid;
  v_status text;
begin
  if v_caller is null then
    return false;
  end if;

  select s.user_id, s.status
    into v_owner, v_status
  from public.surveys s
  where s.id = p_survey_id
  for update;

  return found and v_owner = v_caller and v_status = 'draft';
end;
$$;

alter table public.surveys enable row level security;
alter table public.questions enable row level security;
alter table public.responses enable row level security;
alter table public.answers enable row level security;

revoke all on table public.surveys, public.questions, public.responses, public.answers
  from public, anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select on table public.surveys, public.questions to anon;
grant select, insert, update, delete on table public.surveys, public.questions to authenticated;
grant select on table public.responses, public.answers to authenticated;

-- RLS policies: owners can manage draft surveys; anyone can read published surveys.
create policy surveys_owner_select
on public.surveys for select to authenticated
using ((select auth.uid()) = user_id);

create policy surveys_public_select_published
on public.surveys for select to anon, authenticated
using (status = 'published');

create policy surveys_owner_insert_draft
on public.surveys for insert to authenticated
with check ((select auth.uid()) = user_id and status = 'draft');

create policy surveys_owner_update_draft
on public.surveys for update to authenticated
using ((select auth.uid()) = user_id and status = 'draft')
with check ((select auth.uid()) = user_id and status in ('draft', 'published'));

create policy surveys_owner_delete
on public.surveys for delete to authenticated
using ((select auth.uid()) = user_id);

create policy questions_owner_select
on public.questions for select to authenticated
using (
  exists (
    select 1 from public.surveys s
    where s.id = questions.survey_id
      and s.user_id = (select auth.uid())
  )
);

create policy questions_public_select_published
on public.questions for select to anon, authenticated
using (
  exists (
    select 1 from public.surveys s
    where s.id = questions.survey_id and s.status = 'published'
  )
);

create policy questions_owner_insert_draft
on public.questions for insert to authenticated
with check ((select app_private.can_edit_draft_survey(survey_id)));

create policy questions_owner_update_draft
on public.questions for update to authenticated
using ((select app_private.can_edit_draft_survey(survey_id)))
with check ((select app_private.can_edit_draft_survey(survey_id)));

create policy questions_owner_delete_draft
on public.questions for delete to authenticated
using ((select app_private.can_edit_draft_survey(survey_id)));

create policy responses_owner_select
on public.responses for select to authenticated
using (
  exists (
    select 1 from public.surveys s
    where s.id = responses.survey_id
      and s.user_id = (select auth.uid())
  )
);

create policy answers_owner_select
on public.answers for select to authenticated
using (
  exists (
    select 1
    from public.responses r
    join public.surveys s on s.id = r.survey_id
    where r.id = answers.response_id
      and r.survey_id = answers.survey_id
      and s.user_id = (select auth.uid())
  )
);

create or replace function app_private.is_valid_answer(
  p_type text,
  p_options jsonb,
  p_max_length integer,
  p_answer jsonb
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_answer is null or jsonb_typeof(p_answer) = 'null' then
    return false;
  end if;

  case p_type
    when 'single_choice' then
      return jsonb_typeof(p_answer) = 'string'
        and p_options ? (p_answer #>> '{}');

    when 'multiple_choice' then
      if jsonb_typeof(p_answer) <> 'array' or jsonb_array_length(p_answer) = 0 then
        return false;
      end if;

      if exists (
        select 1
        from jsonb_array_elements(p_answer) as answer_item(value)
        where jsonb_typeof(value) <> 'string'
          or not (p_options ? (value #>> '{}'))
      ) then
        return false;
      end if;

      return (
        select count(*) = count(distinct value #>> '{}')
        from jsonb_array_elements(p_answer) as answer_item(value)
      );

    when 'text' then
      return jsonb_typeof(p_answer) = 'string'
        and char_length(btrim(p_answer #>> '{}')) > 0
        and char_length(p_answer #>> '{}') <= coalesce(p_max_length, 10000);

    else
      return false;
  end case;
end;
$$;

-- This is the only public write endpoint for anonymous respondents.
-- It validates all input before atomically creating one response and its answers.
create or replace function public.submit_survey(
  p_survey_id uuid,
  p_answers jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_response_id uuid;
  v_question_count integer;
begin
  if p_survey_id is null or p_answers is null or jsonb_typeof(p_answers) <> 'array' then
    raise exception 'Invalid survey submission' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_answers) as item(value)
    where jsonb_typeof(value) <> 'object'
  ) then
    raise exception 'Invalid survey submission' using errcode = '22023';
  end if;

  perform 1
  from public.surveys s
  where s.id = p_survey_id and s.status = 'published'
  for share;

  if not found then
    raise exception 'Survey is not accepting responses';
  end if;

  select count(*) into v_question_count
  from public.questions q
  where q.survey_id = p_survey_id;

  if jsonb_array_length(p_answers) > v_question_count then
    raise exception 'Invalid survey submission' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_answers) as p(question_id uuid, answer jsonb)
    where p.question_id is null or p.answer is null or jsonb_typeof(p.answer) = 'null'
  ) then
    raise exception 'Invalid survey submission' using errcode = '22023';
  end if;

  if exists (
    select 1
    from (
      select p.question_id
      from jsonb_to_recordset(p_answers) as p(question_id uuid, answer jsonb)
      group by p.question_id
      having count(*) > 1
    ) duplicates
  ) then
    raise exception 'Duplicate question answer';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_answers) as p(question_id uuid, answer jsonb)
    where not exists (
      select 1 from public.questions q
      where q.id = p.question_id and q.survey_id = p_survey_id
    )
  ) then
    raise exception 'Invalid survey submission' using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.questions q
    where q.survey_id = p_survey_id and q.required
      and not exists (
        select 1
        from jsonb_to_recordset(p_answers) as p(question_id uuid, answer jsonb)
        where p.question_id = q.id
      )
  ) then
    raise exception 'Required question is missing';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_answers) as p(question_id uuid, answer jsonb)
    join public.questions q
      on q.id = p.question_id and q.survey_id = p_survey_id
    where not app_private.is_valid_answer(q.type, q.options, q.max_length, p.answer)
  ) then
    raise exception 'Invalid answer';
  end if;

  insert into public.responses (survey_id)
  values (p_survey_id)
  returning id into v_response_id;

  insert into public.answers (survey_id, response_id, question_id, answer)
  select p_survey_id, v_response_id, p.question_id, p.answer
  from jsonb_to_recordset(p_answers) as p(question_id uuid, answer jsonb);

  return v_response_id;
end;
$$;

revoke all on function app_private.valid_choice_options(jsonb) from public;
revoke all on function app_private.can_edit_draft_survey(uuid) from public;
revoke all on function app_private.is_valid_answer(text, jsonb, integer, jsonb) from public;
revoke all on function app_private.set_updated_at() from public;
revoke all on function app_private.assert_publishable_survey() from public;

grant usage on schema app_private to authenticated;
grant execute on function app_private.valid_choice_options(jsonb) to authenticated;
grant execute on function app_private.can_edit_draft_survey(uuid) to authenticated;

revoke all on function public.submit_survey(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.submit_survey(uuid, jsonb) to anon, authenticated;
