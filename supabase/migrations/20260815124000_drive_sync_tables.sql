-- Drive credentials and synchronization metadata stay server-side and tenant-scoped.
begin;

create table public.drive_accounts (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  mode text not null check (mode in ('oauth_user', 'shared_drive')),
  owner_email text,
  root_folder_id text not null,
  encrypted_refresh_token text,
  shared_drive_id text,
  status text not null default 'connected' check (status in ('connected', 'needs_reauth', 'error', 'disabled')),
  last_error text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (university_id)
);

create table public.drive_sync_state (
  drive_account_id uuid primary key references public.drive_accounts(id) on delete cascade,
  start_page_token text,
  last_page_token text,
  last_full_scan_at timestamptz,
  last_delta_sync_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.drive_sync_runs (
  id uuid primary key default gen_random_uuid(),
  drive_account_id uuid not null references public.drive_accounts(id) on delete cascade,
  mode text not null check (mode in ('full', 'delta', 'subtree')),
  status text not null default 'running' check (status in ('running', 'success', 'partial', 'failed')),
  started_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz,
  pages_read integer not null default 0,
  files_seen integer not null default 0,
  files_created integer not null default 0,
  files_updated integer not null default 0,
  files_deleted integer not null default 0,
  error_message text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.drive_file_versions (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid references public.resources(id) on delete set null,
  university_id uuid not null references public.universities(id) on delete cascade,
  drive_file_id text not null,
  md5 text,
  size_bytes bigint,
  modified_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (university_id, drive_file_id, md5)
);

create table public.drive_conflicts (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  drive_file_id text not null,
  resource_id uuid references public.resources(id) on delete set null,
  conflict_type text not null check (conflict_type in ('duplicate_md5', 'duplicate_name', 'moved_folder', 'metadata_mismatch')),
  details jsonb not null default '{}'::jsonb,
  status text not null default 'open' check (status in ('open', 'resolved', 'ignored')),
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index drive_sync_runs_account_idx on public.drive_sync_runs (drive_account_id, created_at desc);
create index drive_file_versions_resource_idx on public.drive_file_versions (resource_id, created_at desc);
create index drive_conflicts_tenant_idx on public.drive_conflicts (university_id, status, created_at desc);

alter table public.drive_accounts enable row level security;
alter table public.drive_sync_state enable row level security;
alter table public.drive_sync_runs enable row level security;
alter table public.drive_file_versions enable row level security;
alter table public.drive_conflicts enable row level security;

create policy drive_accounts_admin_read on public.drive_accounts for select to authenticated
  using (private.is_admin() and university_id = private.current_university_id());
create policy drive_sync_state_admin_read on public.drive_sync_state for select to authenticated
  using (drive_account_id in (select d.id from public.drive_accounts d where d.university_id = private.current_university_id() and private.is_admin()));
create policy drive_sync_runs_admin_read on public.drive_sync_runs for select to authenticated
  using (drive_account_id in (select d.id from public.drive_accounts d where d.university_id = private.current_university_id() and private.is_admin()));
create policy drive_file_versions_admin_read on public.drive_file_versions for select to authenticated
  using (private.is_admin() and university_id = private.current_university_id());
create policy drive_conflicts_admin_read on public.drive_conflicts for select to authenticated
  using (private.is_admin() and university_id = private.current_university_id());

create trigger drive_accounts_updated_at_trigger before update on public.drive_accounts for each row execute function public.set_updated_at();
create trigger drive_sync_state_updated_at_trigger before update on public.drive_sync_state for each row execute function public.set_updated_at();

commit;
