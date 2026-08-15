create table public.drive_accounts (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  mode text not null check (mode in ('oauth_user', 'shared_drive')),
  account_email text,
  encrypted_refresh_token text not null,
  shared_drive_id text,
  root_folder_id text,
  status text not null default 'active' check (status in ('active', 'revoked', 'error')),
  last_error text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (university_id, mode)
);

create table public.drive_sync_state (
  university_id uuid primary key references public.universities(id) on delete cascade,
  page_token text,
  last_success_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.drive_sync_runs (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  status text not null check (status in ('queued', 'running', 'completed', 'failed')),
  started_at timestamptz,
  completed_at timestamptz,
  imported_count int not null default 0,
  updated_count int not null default 0,
  unavailable_count int not null default 0,
  error_message text,
  created_at timestamptz not null default timezone('utc', now())
);
create index drive_sync_runs_tenant_idx on public.drive_sync_runs(university_id, created_at desc);

create table public.drive_file_versions (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  resource_id uuid references public.resources(id) on delete set null,
  drive_file_id text not null,
  md5 text,
  size_bytes bigint,
  modified_at timestamptz,
  is_current boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);
create index drive_file_versions_current_idx on public.drive_file_versions(university_id, drive_file_id) where is_current;

create table public.drive_conflicts (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  resource_id uuid references public.resources(id) on delete set null,
  drive_file_id text not null,
  conflict_type text not null,
  details jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  title text not null,
  description text,
  course_id uuid references public.courses(id) on delete set null,
  thumbnail_url text,
  duration_seconds int,
  published boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.video_sources (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos(id) on delete cascade,
  provider text not null check (provider in ('youtube')),
  external_id text not null,
  source_url text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (provider, external_id)
);

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'review', 'published', 'archived')),
  current_version_id uuid,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.quiz_versions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  version_number int not null,
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (quiz_id, version_number)
);
alter table public.quizzes add constraint quizzes_current_version_fk foreign key (current_version_id) references public.quiz_versions(id) on delete set null;

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  quiz_version_id uuid not null references public.quiz_versions(id) on delete cascade,
  position int not null,
  prompt text not null,
  explanation text,
  points int not null default 1 check (points > 0),
  created_at timestamptz not null default timezone('utc', now()),
  unique (quiz_version_id, position)
);

create table public.options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  position int not null,
  label text not null,
  is_correct boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  unique (question_id, position)
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  quiz_version_id uuid not null references public.quiz_versions(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete cascade,
  attempt_token_hash text not null unique,
  status text not null default 'in_progress' check (status in ('in_progress', 'submitted', 'expired')),
  score numeric(8,2),
  submitted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index attempts_user_quiz_idx on public.attempts(user_id, quiz_id, created_at desc);

create table public.attempt_answers (
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  selected_option_id uuid references public.options(id) on delete restrict,
  is_correct boolean,
  answered_at timestamptz,
  primary key (attempt_id, question_id)
);

create table public.resource_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  university_id uuid not null references public.universities(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  last_page int not null default 1 check (last_page > 0),
  percent numeric(5,4) not null default 0 check (percent between 0 and 1),
  completed_at timestamptz,
  last_opened_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, resource_id)
);

create table public.course_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  university_id uuid not null references public.universities(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  percent numeric(5,4) not null default 0 check (percent between 0 and 1),
  completed_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, course_id)
);

create table public.roadmap_node_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  university_id uuid not null references public.universities(id) on delete cascade,
  node_id uuid not null,
  completed_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, node_id)
);

create table public.streaks (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  university_id uuid not null references public.universities(id) on delete cascade,
  current_days int not null default 0,
  longest_days int not null default 0,
  last_activity_date date,
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.reward_rules (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  event_key text not null,
  points int not null check (points > 0),
  enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  unique (university_id, event_key)
);

create table public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_key text not null,
  points int not null,
  idempotency_key text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (university_id, idempotency_key)
);

create table public.badges (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  key text not null,
  name_ar text not null,
  name_en text not null,
  rule jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (university_id, key)
);

create table public.user_badges (
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  university_id uuid not null references public.universities(id) on delete cascade,
  awarded_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, badge_id)
);

create table public.leaderboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  scope_key text not null,
  snapshot_date date not null,
  ranking jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (university_id, scope_key, snapshot_date)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  university_id uuid not null references public.universities(id) on delete cascade,
  type text not null,
  title_ar text not null,
  title_en text not null,
  body_ar text not null,
  body_en text not null,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);
create index notifications_user_idx on public.notifications(user_id, created_at desc);

create table public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  university_id uuid not null references public.universities(id) on delete cascade,
  reminders_enabled boolean not null default true,
  announcements_enabled boolean not null default true,
  email_enabled boolean not null default true,
  daily_email_cap int not null default 1 check (daily_email_cap between 0 and 10),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.email_deliveries (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  template_key text not null,
  dedup_key text not null,
  status text not null check (status in ('queued', 'sent', 'failed', 'cancelled')),
  provider_message_id text,
  sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (university_id, dedup_key)
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  title_ar text not null,
  title_en text not null,
  body_ar text not null,
  body_en text not null,
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.unsubscribe_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  university_id uuid references public.universities(id) on delete set null,
  sender_email text not null,
  subject text not null,
  body text not null,
  status text not null default 'unread' check (status in ('unread', 'in_progress', 'resolved', 'spam')),
  created_at timestamptz not null default timezone('utc', now())
);

create table public.content_reports (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  resource_id uuid references public.resources(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  university_id uuid references public.universities(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_state jsonb,
  after_state jsonb,
  ip_hash text,
  correlation_id text,
  created_at timestamptz not null default timezone('utc', now())
);
create index audit_logs_tenant_idx on public.audit_logs(university_id, created_at desc);

create table public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  page_number int,
  content text not null,
  search_vector tsvector generated always as (to_tsvector('simple', content)) stored,
  embedding extensions.vector(1536),
  text_quality numeric(5,4) check (text_quality between 0 and 1),
  created_at timestamptz not null default timezone('utc', now())
);
create index document_chunks_search_idx on public.document_chunks using gin(search_vector);
create index document_chunks_embedding_idx on public.document_chunks using hnsw (embedding extensions.vector_cosine_ops);

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  feature text not null,
  locale text not null default 'ar',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  model text,
  citations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  feature text not null,
  provider text not null,
  model text not null,
  tokens_in int not null default 0,
  tokens_out int not null default 0,
  estimated_cost numeric(12,8) not null default 0,
  latency_ms int,
  cache_hit boolean not null default false,
  status text not null,
  fallback_chain text[] not null default '{}',
  correlation_id text,
  created_at timestamptz not null default timezone('utc', now())
);
create index ai_usage_events_tenant_idx on public.ai_usage_events(university_id, created_at desc);

create table public.ai_budgets (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  scope text not null check (scope in ('user', 'role', 'tenant', 'global')),
  scope_key text not null,
  window_seconds int not null,
  max_tokens bigint not null,
  max_cost numeric(12,8) not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  unique (university_id, scope, scope_key, window_seconds)
);

create table public.ai_provider_keys (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  provider text not null,
  encrypted_key text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (university_id, provider)
);

create table public.ai_cache (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  cache_key text not null,
  feature text not null,
  locale text not null,
  model text not null,
  response jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (university_id, cache_key)
);

create table public.ai_feedback (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  message_id uuid references public.ai_messages(id) on delete set null,
  rating smallint not null check (rating in (-1, 1)),
  note text,
  created_at timestamptz not null default timezone('utc', now())
);

create trigger drive_accounts_updated_at before update on public.drive_accounts for each row execute function public.set_updated_at();
create trigger videos_updated_at before update on public.videos for each row execute function public.set_updated_at();
create trigger quizzes_updated_at before update on public.quizzes for each row execute function public.set_updated_at();
create trigger attempts_updated_at before update on public.attempts for each row execute function public.set_updated_at();
create trigger resource_progress_updated_at before update on public.resource_progress for each row execute function public.set_updated_at();
create trigger course_progress_updated_at before update on public.course_progress for each row execute function public.set_updated_at();
create trigger streaks_updated_at before update on public.streaks for each row execute function public.set_updated_at();
create trigger ai_conversations_updated_at before update on public.ai_conversations for each row execute function public.set_updated_at();
create trigger ai_provider_keys_updated_at before update on public.ai_provider_keys for each row execute function public.set_updated_at();
