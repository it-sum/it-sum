-- Registration captures a student's department and batch placement.
begin;
alter table public.profiles
  add column if not exists department_id uuid references public.departments(id) on delete set null,
  add column if not exists batch_level smallint check (batch_level is null or batch_level between 1 and 4);
create index if not exists profiles_university_department_idx on public.profiles (university_id, department_id, batch_level);
commit;
