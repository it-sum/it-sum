-- Library projections need tags/view counts and the full media vocabulary.
begin;
alter type public.resource_type add value if not exists 'document';
alter type public.resource_type add value if not exists 'image';
alter type public.resource_type add value if not exists 'archive';
alter table public.resources
  add column if not exists tags text[] not null default '{}',
  add column if not exists view_count integer not null default 0 check (view_count >= 0);
create index if not exists resources_tags_idx on public.resources using gin (tags);
commit;
