-- IT-SUM initial schema
-- Target: Supabase project ztujhryukdddhjymhfod / PostgreSQL 17
--
-- This migration deliberately keeps Google Drive as file storage only. Supabase is
-- the system of record for identity, structure, metadata, progress, quizzes,
-- rewards, governance and AI telemetry.

begin;

create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";
create extension if not exists vector;
create extension if not exists pg_trgm;
create extension if not exists unaccent;
create extension if not exists pg_cron;
create extension if not exists pg_net;

create schema if not exists private;

create type public.user_role as enum ('student', 'admin', 'owner');
create type public.approval_status as enum ('pending', 'approved', 'rejected', 'suspended');
create type public.publication_state as enum ('draft', 'review', 'published', 'unavailable', 'archived');
create type public.resource_type as enum ('pdf', 'video', 'link');
create type public.material_kind as enum ('summary', 'lecture', 'sheet', 'solution', 'tutorial', 'assignment', 'exam', 'reference', 'other');
create type public.exam_phase as enum ('pre_midterm', 'midterm', 'post_midterm', 'final', 'unphased');
create type public.text_quality as enum ('none', 'poor', 'fair', 'good');
create type public.semester_term as enum ('first', 'second');
create type public.attempt_status as enum ('in_progress', 'submitted', 'expired', 'abandoned');
create type public.roadmap_state as enum ('draft', 'published', 'archived');
create type public.notification_type as enum ('progress_reminder', 'announcement', 'quiz_result', 'badge_earned', 'system');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.universities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  name jsonb not null check (jsonb_typeof(name) = 'object'),
  short_name jsonb not null check (jsonb_typeof(short_name) = 'object'),
  logo_url text check (logo_url is null or logo_url ~* '\.webp(?:\?|$)'),
  primary_color text not null default '#1BA9A2' check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  email_domains text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  slug text not null,
  name jsonb not null,
  description jsonb,
  icon_name text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (university_id, slug)
);

create table public.batches (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id) on delete cascade,
  level smallint not null check (level between 1 and 4),
  name jsonb not null,
  drive_folder_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (department_id, level)
);

create table public.semesters (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches(id) on delete cascade,
  term public.semester_term not null,
  name jsonb not null,
  drive_folder_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (batch_id, term)
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  semester_id uuid not null references public.semesters(id) on delete cascade,
  slug text not null,
  code text,
  name jsonb not null,
  description jsonb,
  instructor_name text,
  credit_hours smallint check (credit_hours is null or credit_hours between 0 and 12),
  cover_image_url text check (cover_image_url is null or cover_image_url ~* '\.webp(?:\?|$)'),
  drive_folder_id text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (semester_id, slug)
);

create table public.course_aliases (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  alias text not null,
  normalized_alias text not null,
  source text not null default 'manual' check (source in ('manual', 'drive', 'ai_proposal')),
  confidence numeric(4,3) check (confidence is null or confidence between 0 and 1),
  created_at timestamptz not null default timezone('utc', now()),
  unique (course_id, normalized_alias)
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  university_id uuid references public.universities(id) on delete restrict,
  role public.user_role not null default 'student',
  approval_status public.approval_status not null default 'pending',
  full_name text not null check (char_length(full_name) between 2 and 160),
  email text not null,
  normalized_email text not null,
  display_name text,
  avatar_url text check (avatar_url is null or avatar_url ~* '\.(webp|svg)(?:\?|$)'),
  last_seen_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (normalized_email)
);

create or replace function private.current_university_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'university_id')::uuid,
    (select p.university_id from public.profiles p where p.id = auth.uid())
  );
$$;

create or replace function private.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role')::public.user_role,
    (select p.role from public.profiles p where p.id = auth.uid())
  );
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select private.current_role() in ('admin', 'owner');
$$;

grant usage on schema private to authenticated;
grant execute on function private.current_university_id() to authenticated;
grant execute on function private.current_role() to authenticated;
grant execute on function private.is_admin() to authenticated;

create table public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  locale text not null default 'ar' check (locale in ('ar', 'en')),
  theme text not null default 'light' check (theme in ('light', 'dark', 'system')),
  leaderboard_visibility text not null default 'anonymous' check (leaderboard_visibility in ('full', 'initial', 'anonymous', 'hidden')),
  reminders_enabled boolean not null default true,
  ai_enabled boolean not null default false,
  daily_email_cap smallint not null default 1 check (daily_email_cap between 0 and 5),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  university_id uuid references public.universities(id) on delete cascade,
  status public.approval_status not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  review_note text,
  created_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz
);

create table public.contributors (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  name text not null,
  normalized_name text not null,
  title text,
  resource_count integer not null default 0 check (resource_count >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  unique (university_id, normalized_name)
);

create table public.folders (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  parent_id uuid references public.folders(id) on delete set null,
  course_id uuid references public.courses(id) on delete set null,
  drive_folder_id text not null,
  name text not null,
  display_name text not null,
  normalized_name text not null,
  path text not null,
  depth smallint not null default 0 check (depth >= 0),
  material_kind public.material_kind not null default 'other',
  exam_phase public.exam_phase not null default 'unphased',
  resource_count integer not null default 0 check (resource_count >= 0),
  child_folder_count integer not null default 0 check (child_folder_count >= 0),
  state public.publication_state not null default 'published',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (university_id, drive_folder_id)
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  folder_id uuid references public.folders(id) on delete set null,
  course_id uuid references public.courses(id) on delete set null,
  type public.resource_type not null default 'pdf',
  title text not null,
  display_title text not null,
  description jsonb,
  material_kind public.material_kind not null default 'other',
  exam_phase public.exam_phase not null default 'unphased',
  state public.publication_state not null default 'draft',
  drive_file_id text,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  page_count integer check (page_count is null or page_count > 0),
  thumbnail_url text check (thumbnail_url is null or thumbnail_url ~* '\.webp(?:\?|$)'),
  md5 text,
  text_quality public.text_quality not null default 'none',
  is_searchable boolean not null default false,
  is_ai_ready boolean not null default false,
  download_allowed boolean not null default false,
  drive_modified_at timestamptz,
  published_at timestamptz,
  search_document tsvector,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (university_id, drive_file_id),
  unique (university_id, md5)
);

create table public.resource_contributors (
  resource_id uuid not null references public.resources(id) on delete cascade,
  contributor_id uuid not null references public.contributors(id) on delete cascade,
  primary key (resource_id, contributor_id)
);

create table public.bookmarks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, resource_id)
);

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid unique references public.resources(id) on delete cascade,
  university_id uuid not null references public.universities(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  youtube_id text not null,
  title text not null,
  description jsonb,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  thumbnail_url text check (thumbnail_url is null or thumbnail_url ~* '\.webp(?:\?|$)'),
  channel_title text,
  is_embeddable boolean not null default true,
  state public.publication_state not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (university_id, youtube_id)
);

create table public.resource_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  percent numeric(5,2) not null default 0 check (percent between 0 and 100),
  last_page integer check (last_page is null or last_page > 0),
  last_second numeric(12,3) check (last_second is null or last_second >= 0),
  elapsed_seconds numeric(12,3) not null default 0 check (elapsed_seconds >= 0),
  completed_at timestamptz,
  last_event_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, resource_id)
);

create table public.course_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  percent numeric(5,2) not null default 0 check (percent between 0 and 100),
  completed_resources integer not null default 0 check (completed_resources >= 0),
  total_resources integer not null default 0 check (total_resources >= 0),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, course_id)
);

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  resource_id uuid references public.resources(id) on delete set null,
  title text not null,
  description jsonb,
  exam_phase public.exam_phase not null default 'unphased',
  state public.publication_state not null default 'draft',
  published_version_id uuid,
  question_count integer not null default 0 check (question_count >= 0),
  total_points numeric(8,2) not null default 0 check (total_points >= 0),
  time_limit_seconds integer check (time_limit_seconds is null or time_limit_seconds > 0),
  pass_percent numeric(5,2) not null default 60 check (pass_percent between 0 and 100),
  max_attempts smallint check (max_attempts is null or max_attempts > 0),
  shuffle_questions boolean not null default true,
  shuffle_options boolean not null default true,
  show_answers_after_submit boolean not null default true,
  is_ai_generated boolean not null default false,
  ai_review_required boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.quiz_versions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  created_by uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (quiz_id, version_number)
);

alter table public.quizzes
  add constraint quizzes_published_version_fk
  foreign key (published_version_id) references public.quiz_versions(id) on delete set null;

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_version_id uuid not null references public.quiz_versions(id) on delete cascade,
  question_type text not null check (question_type in ('single_choice', 'multiple_choice', 'true_false', 'short_answer')),
  prompt text not null,
  image_url text check (image_url is null or image_url ~* '\.webp(?:\?|$)'),
  points numeric(8,2) not null default 1 check (points > 0),
  sort_order integer not null default 0,
  required_selections smallint check (required_selections is null or required_selections > 0),
  answer_key jsonb not null default '{}'::jsonb,
  explanation jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.quiz_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  text text not null,
  image_url text check (image_url is null or image_url ~* '\.webp(?:\?|$)'),
  sort_order integer not null default 0,
  is_correct boolean not null default false
);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete restrict,
  quiz_version_id uuid not null references public.quiz_versions(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete cascade,
  attempt_number smallint not null check (attempt_number > 0),
  status public.attempt_status not null default 'in_progress',
  score numeric(8,2),
  percent numeric(5,2) check (percent is null or percent between 0 and 100),
  passed boolean,
  started_at timestamptz not null default timezone('utc', now()),
  submitted_at timestamptz,
  unique (quiz_id, user_id, attempt_number)
);

create table public.quiz_attempt_answers (
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id) on delete restrict,
  selected_option_ids uuid[] not null default '{}',
  short_answer text,
  awarded_points numeric(8,2),
  is_correct boolean,
  feedback jsonb,
  saved_at timestamptz not null default timezone('utc', now()),
  primary key (attempt_id, question_id)
);

create table public.reward_rules (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  event_key text not null,
  points integer not null check (points > 0),
  daily_cap integer check (daily_cap is null or daily_cap > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  unique (university_id, event_key)
);

create table public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_key text not null,
  points integer not null,
  idempotency_key text not null,
  source_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (university_id, idempotency_key)
);

create table public.badges (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  slug text not null,
  name jsonb not null,
  description jsonb not null,
  icon_name text not null,
  tier text not null check (tier in ('bronze', 'silver', 'gold', 'platinum')),
  points_reward integer not null default 0 check (points_reward >= 0),
  is_secret boolean not null default false,
  unique (university_id, slug)
);

create table public.user_badges (
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  awarded_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, badge_id)
);

create table public.roadmaps (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  slug text not null,
  title jsonb not null,
  description jsonb not null,
  cover_image_url text check (cover_image_url is null or cover_image_url ~* '\.webp(?:\?|$)'),
  course_id uuid references public.courses(id) on delete set null,
  external_reference_url text,
  state public.roadmap_state not null default 'draft',
  estimated_hours numeric(8,1),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (university_id, slug)
);

create table public.roadmap_nodes (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references public.roadmaps(id) on delete cascade,
  slug text not null,
  title jsonb not null,
  description jsonb,
  sort_order integer not null default 0,
  estimated_minutes integer,
  unique (roadmap_id, slug)
);

create table public.roadmap_edges (
  roadmap_id uuid not null references public.roadmaps(id) on delete cascade,
  from_node_id uuid not null references public.roadmap_nodes(id) on delete cascade,
  to_node_id uuid not null references public.roadmap_nodes(id) on delete cascade,
  primary key (roadmap_id, from_node_id, to_node_id),
  check (from_node_id <> to_node_id)
);

create table public.roadmap_node_resources (
  node_id uuid not null references public.roadmap_nodes(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  primary key (node_id, resource_id)
);

create table public.roadmap_node_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  node_id uuid not null references public.roadmap_nodes(id) on delete cascade,
  completed_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, node_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  title jsonb not null,
  body jsonb not null,
  href text,
  read_at timestamptz,
  dedup_key text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, dedup_key)
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  university_id uuid references public.universities(id) on delete set null,
  sender_user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text not null,
  subject text not null,
  category text not null check (category in ('general', 'content', 'bug', 'join')),
  message text not null check (char_length(message) between 10 and 5000),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'spam')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  university_id uuid references public.universities(id) on delete set null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  correlation_id text,
  ip_hash text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.ai_budgets (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  scope text not null check (scope in ('tenant', 'role', 'user', 'feature')),
  scope_key text not null,
  window_seconds integer not null default 86400 check (window_seconds > 0),
  max_input_tokens bigint not null default 0 check (max_input_tokens >= 0),
  max_output_tokens bigint not null default 0 check (max_output_tokens >= 0),
  max_cost_usd numeric(12,6) not null default 0 check (max_cost_usd >= 0),
  is_active boolean not null default true,
  unique (university_id, scope, scope_key)
);

create table public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  university_id uuid references public.universities(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  feature text not null,
  provider text not null,
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  estimated_cost_usd numeric(12,8) not null default 0,
  latency_ms integer,
  cache_hit boolean not null default false,
  status text not null check (status in ('success', 'failed', 'blocked', 'cancelled')),
  fallback_chain text[] not null default '{}',
  correlation_id text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  page_number integer,
  chunk_index integer not null,
  content text not null,
  search_document tsvector,
  embedding vector(1536),
  created_at timestamptz not null default timezone('utc', now()),
  unique (resource_id, chunk_index)
);

-- Search and integrity indexes.
create index departments_university_sort_idx on public.departments (university_id, sort_order) where is_active;
create index batches_department_level_idx on public.batches (department_id, level) where is_active;
create index semesters_batch_term_idx on public.semesters (batch_id, term) where is_active;
create index courses_semester_sort_idx on public.courses (semester_id, sort_order) where is_active;
create index course_aliases_trgm_idx on public.course_aliases using gin (normalized_alias gin_trgm_ops);
create index folders_parent_idx on public.folders (university_id, parent_id, path);
create index resources_browse_idx on public.resources (university_id, state, course_id, material_kind, exam_phase);
create index resources_search_idx on public.resources using gin (search_document);
create index resources_md5_idx on public.resources (university_id, md5) where md5 is not null;
create index resource_contributors_contributor_idx on public.resource_contributors (contributor_id, resource_id);
create index progress_user_updated_idx on public.resource_progress (user_id, updated_at desc);
create index quizzes_course_state_idx on public.quizzes (university_id, course_id, state);
create index quiz_attempts_user_idx on public.quiz_attempts (user_id, submitted_at desc);
create index points_ledger_user_idx on public.points_ledger (user_id, created_at desc);
create index notifications_user_unread_idx on public.notifications (user_id, read_at, created_at desc);
create index audit_logs_tenant_created_idx on public.audit_logs (university_id, created_at desc);
create index ai_usage_tenant_created_idx on public.ai_usage_events (university_id, created_at desc);
create index document_chunks_search_idx on public.document_chunks using gin (search_document);
create index document_chunks_embedding_idx on public.document_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create or replace function public.resources_search_document_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.search_document := to_tsvector('simple', unaccent(coalesce(new.display_title, '') || ' ' || coalesce(new.title, '')));
  return new;
end;
$$;

create or replace function public.document_chunks_search_document_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.search_document := to_tsvector('simple', unaccent(coalesce(new.content, '')));
  return new;
end;
$$;

create trigger resources_search_document_trigger
before insert or update of title, display_title on public.resources
for each row execute function public.resources_search_document_update();

create trigger document_chunks_search_document_trigger
before insert or update of content on public.document_chunks
for each row execute function public.document_chunks_search_document_update();

-- updated_at triggers for mutable tables.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'universities', 'departments', 'batches', 'semesters', 'courses', 'profiles',
    'folders', 'resources', 'videos', 'resource_progress', 'course_progress',
    'quizzes', 'roadmaps', 'notifications', 'contact_messages', 'ai_budgets'
  ] loop
    execute format('create trigger %I_updated_at_trigger before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end;
$$;

-- RLS is enabled on every application table. The API uses the service role after
-- its own NestJS guards; direct clients get only the least privilege needed.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'universities', 'departments', 'batches', 'semesters', 'courses', 'course_aliases',
    'profiles', 'user_preferences', 'approval_requests', 'contributors', 'folders',
    'resources', 'resource_contributors', 'bookmarks', 'videos', 'resource_progress',
    'course_progress', 'quizzes', 'quiz_versions', 'quiz_questions', 'quiz_options',
    'quiz_attempts', 'quiz_attempt_answers', 'reward_rules', 'points_ledger', 'badges',
    'user_badges', 'roadmaps', 'roadmap_nodes', 'roadmap_edges', 'roadmap_node_resources',
    'roadmap_node_progress', 'notifications', 'contact_messages', 'audit_logs',
    'ai_budgets', 'ai_usage_events', 'document_chunks'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end;
$$;

-- Authenticated, approved members can read published tenant content.
create policy universities_member_read on public.universities for select to authenticated
  using (id = private.current_university_id() and is_active);
create policy departments_member_read on public.departments for select to authenticated
  using (university_id = private.current_university_id() and is_active);
create policy batches_member_read on public.batches for select to authenticated
  using (department_id in (select d.id from public.departments d where d.university_id = private.current_university_id()) and is_active);
create policy semesters_member_read on public.semesters for select to authenticated
  using (batch_id in (select b.id from public.batches b join public.departments d on d.id = b.department_id where d.university_id = private.current_university_id()) and is_active);
create policy courses_member_read on public.courses for select to authenticated
  using (semester_id in (select s.id from public.semesters s join public.batches b on b.id = s.batch_id join public.departments d on d.id = b.department_id where d.university_id = private.current_university_id()) and is_active);
create policy contributors_member_read on public.contributors for select to authenticated
  using (university_id = private.current_university_id());
create policy folders_member_read on public.folders for select to authenticated
  using (university_id = private.current_university_id() and state = 'published');
create policy resources_member_read on public.resources for select to authenticated
  using (university_id = private.current_university_id() and state = 'published');
create policy resource_contributors_member_read on public.resource_contributors for select to authenticated
  using (resource_id in (select r.id from public.resources r where r.university_id = private.current_university_id() and r.state = 'published'));
create policy videos_member_read on public.videos for select to authenticated
  using (university_id = private.current_university_id() and state = 'published');
create policy roadmaps_member_read on public.roadmaps for select to authenticated
  using (university_id = private.current_university_id() and state = 'published');
create policy roadmap_nodes_member_read on public.roadmap_nodes for select to authenticated
  using (roadmap_id in (select r.id from public.roadmaps r where r.university_id = private.current_university_id() and r.state = 'published'));
create policy roadmap_edges_member_read on public.roadmap_edges for select to authenticated
  using (roadmap_id in (select r.id from public.roadmaps r where r.university_id = private.current_university_id() and r.state = 'published'));
create policy roadmap_node_resources_member_read on public.roadmap_node_resources for select to authenticated
  using (node_id in (select n.id from public.roadmap_nodes n join public.roadmaps r on r.id = n.roadmap_id where r.university_id = private.current_university_id() and r.state = 'published'));
create policy badges_member_read on public.badges for select to authenticated
  using (university_id = private.current_university_id());
create policy user_badges_member_read on public.user_badges for select to authenticated
  using (user_id = auth.uid());
create policy reward_rules_member_read on public.reward_rules for select to authenticated
  using (university_id = private.current_university_id() and is_active);

-- Own-user data only. The backend remains the only writer for authoritative state.
create policy profiles_self_read on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_self_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy preferences_self_all on public.user_preferences for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy bookmarks_self_all on public.bookmarks for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy progress_self_all on public.resource_progress for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy course_progress_self_all on public.course_progress for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy roadmap_progress_self_all on public.roadmap_node_progress for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy attempts_self_read on public.quiz_attempts for select to authenticated using (user_id = auth.uid());
create policy attempt_answers_self_read on public.quiz_attempt_answers for select to authenticated using (attempt_id in (select a.id from public.quiz_attempts a where a.user_id = auth.uid()));
create policy notifications_self_all on public.notifications for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_ai_usage_read on public.ai_usage_events for select to authenticated using (user_id = auth.uid());

-- Contact is the one public write: the backend adds rate limits and validates the
-- payload; this policy is only a defence-in-depth fallback for authenticated users.
create policy contact_authenticated_insert on public.contact_messages for insert to authenticated with check (sender_user_id = auth.uid() or sender_user_id is null);

-- Privileged reads for admins are restricted to their tenant. Writes are executed
-- with the service role from NestJS after an explicit role guard and audit entry.
create policy admin_audit_read on public.audit_logs for select to authenticated using (private.is_admin() and university_id = private.current_university_id());
create policy admin_ai_usage_read on public.ai_usage_events for select to authenticated using (private.is_admin() and university_id = private.current_university_id());
create policy admin_approval_read on public.approval_requests for select to authenticated using (private.is_admin() and university_id = private.current_university_id());

-- Minimal auth profile bootstrap. It never grants approval or admin rights; those
-- remain explicit backend/admin actions. The before-user-created hook handles the
-- domain allowlist before this function can run.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, university_id, full_name, email, normalized_email)
  values (
    new.id,
    null,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    lower(new.email)
  )
  on conflict (id) do nothing;

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- The access-token hook can be enabled in the Supabase dashboard. The function is
-- present now so the dashboard configuration is a one-click activation and JWT
-- claims stay aligned with profiles after approval/role changes.
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  profile_row public.profiles;
begin
  select * into profile_row from public.profiles where id = (event ->> 'user_id')::uuid;
  event := jsonb_set(event, '{claims,app_metadata,role}', to_jsonb(coalesce(profile_row.role, 'student'::public.user_role)::text), true);
  event := jsonb_set(event, '{claims,app_metadata,university_id}', to_jsonb(profile_row.university_id::text), true);
  event := jsonb_set(event, '{claims,app_metadata,approval_status}', to_jsonb(coalesce(profile_row.approval_status, 'pending'::public.approval_status)::text), true);
  return event;
end;
$$;

grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
grant usage on schema public to supabase_auth_admin;
grant select on table public.profiles to supabase_auth_admin;

commit;
