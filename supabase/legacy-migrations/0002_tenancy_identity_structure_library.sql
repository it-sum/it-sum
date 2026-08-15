create type public.app_role as enum ('student', 'admin', 'owner');
create type public.account_status as enum ('pending', 'approved', 'suspended');
create type public.resource_status as enum ('draft', 'published', 'unavailable', 'archived');
create type public.resource_visibility as enum ('tenant', 'public');

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
  name text not null,
  slug text not null unique,
  default_locale text not null default 'ar',
  allowed_email_domains text[] not null default '{}',
  invite_only boolean not null default false,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  university_id uuid not null references public.universities(id) on delete restrict,
  email text not null,
  display_name text,
  role public.app_role not null default 'student',
  status public.account_status not null default 'pending',
  leaderboard_visibility text not null default 'anonymous' check (leaderboard_visibility in ('full', 'initial', 'anonymous', 'hidden')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index profiles_university_idx on public.profiles(university_id);
create unique index profiles_university_email_idx on public.profiles(university_id, lower(email));

create table public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  locale text not null default 'ar' check (locale in ('ar', 'en')),
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  reminders_enabled boolean not null default true,
  ai_enabled boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  email text not null,
  invited_by uuid references public.profiles(id) on delete set null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);
create index invitations_tenant_email_idx on public.invitations(university_id, lower(email));

create table public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);
create unique index approval_requests_pending_idx on public.approval_requests(user_id) where status = 'pending';

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  name_ar text not null,
  name_en text not null,
  slug text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (university_id, slug)
);

create table public.batches (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (university_id, department_id, name)
);

create table public.semesters (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  batch_id uuid not null references public.batches(id) on delete cascade,
  name text not null,
  number smallint not null check (number between 1 and 2),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (batch_id, number)
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  semester_id uuid not null references public.semesters(id) on delete cascade,
  code text,
  name_ar text not null,
  name_en text not null,
  slug text not null,
  search_vector tsvector generated always as (to_tsvector('simple', coalesce(name_ar, '') || ' ' || coalesce(name_en, '') || ' ' || coalesce(code, ''))) stored,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (university_id, slug)
);
create index courses_search_idx on public.courses using gin(search_vector);

create table public.course_aliases (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  alias text not null,
  normalized_alias text not null,
  source text not null default 'manual' check (source in ('manual', 'drive', 'ai_proposal')),
  confidence numeric(5,4) check (confidence between 0 and 1),
  created_at timestamptz not null default timezone('utc', now()),
  unique (university_id, normalized_alias)
);
create index course_aliases_trgm_idx on public.course_aliases using gin(normalized_alias extensions.gin_trgm_ops);

create table public.material_kinds (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  key text not null,
  name_ar text not null,
  name_en text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (university_id, key)
);

create table public.exam_phases (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  key text not null,
  name_ar text not null,
  name_en text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (university_id, key)
);

create table public.contributors (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  display_name text not null,
  normalized_name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (university_id, normalized_name)
);

create table public.folders (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  parent_id uuid references public.folders(id) on delete cascade,
  drive_file_id text not null,
  name text not null,
  normalized_name text not null,
  path text not null,
  depth smallint not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (university_id, drive_file_id)
);
create index folders_parent_idx on public.folders(university_id, parent_id);
create index folders_trgm_idx on public.folders using gin(normalized_name extensions.gin_trgm_ops);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  folder_id uuid references public.folders(id) on delete set null,
  drive_file_id text not null,
  drive_md5 text,
  title text not null,
  normalized_title text not null,
  mime_type text not null default 'application/pdf',
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  page_count int check (page_count is null or page_count > 0),
  modified_at timestamptz,
  status public.resource_status not null default 'draft',
  visibility public.resource_visibility not null default 'tenant',
  download_allowed boolean not null default false,
  text_quality numeric(5,4) check (text_quality between 0 and 1),
  course_id uuid references public.courses(id) on delete set null,
  contributor_id uuid references public.contributors(id) on delete set null,
  material_kind_id uuid references public.material_kinds(id) on delete set null,
  exam_phase_id uuid references public.exam_phases(id) on delete set null,
  search_vector tsvector generated always as (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(normalized_title, ''))) stored,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (university_id, drive_file_id)
);
create index resources_tenant_status_idx on public.resources(university_id, status, updated_at desc);
create index resources_drive_md5_idx on public.resources(university_id, drive_md5) where drive_md5 is not null;
create index resources_search_idx on public.resources using gin(search_vector);
create index resources_title_trgm_idx on public.resources using gin(normalized_title extensions.gin_trgm_ops);

create table public.resource_facets (
  resource_id uuid primary key references public.resources(id) on delete cascade,
  university_id uuid not null references public.universities(id) on delete cascade,
  material_kind_id uuid references public.material_kinds(id) on delete set null,
  exam_phase_id uuid references public.exam_phases(id) on delete set null,
  contributor_id uuid references public.contributors(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.resource_tags (
  resource_id uuid not null references public.resources(id) on delete cascade,
  university_id uuid not null references public.universities(id) on delete cascade,
  tag text not null,
  normalized_tag text not null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (resource_id, normalized_tag)
);
create index resource_tags_trgm_idx on public.resource_tags using gin(normalized_tag extensions.gin_trgm_ops);

create table public.bookmarks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  university_id uuid not null references public.universities(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, resource_id)
);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  university_id uuid not null references public.universities(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, name)
);

create table public.collection_resources (
  collection_id uuid not null references public.collections(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  university_id uuid not null references public.universities(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (collection_id, resource_id)
);

create trigger universities_updated_at before update on public.universities for each row execute function public.set_updated_at();
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger preferences_updated_at before update on public.user_preferences for each row execute function public.set_updated_at();
create trigger departments_updated_at before update on public.departments for each row execute function public.set_updated_at();
create trigger batches_updated_at before update on public.batches for each row execute function public.set_updated_at();
create trigger semesters_updated_at before update on public.semesters for each row execute function public.set_updated_at();
create trigger courses_updated_at before update on public.courses for each row execute function public.set_updated_at();
create trigger folders_updated_at before update on public.folders for each row execute function public.set_updated_at();
create trigger resources_updated_at before update on public.resources for each row execute function public.set_updated_at();
create trigger resource_facets_updated_at before update on public.resource_facets for each row execute function public.set_updated_at();
create trigger collections_updated_at before update on public.collections for each row execute function public.set_updated_at();
