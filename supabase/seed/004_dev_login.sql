-- Development-only login for local Supabase resets.
-- Never use this credential in staging or production.
begin;

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values (
  '00000000-0000-4000-8000-000000009001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'dev.student@students.ctu.edu.eg',
  crypt('ITSumDev2026!', gen_salt('bf')),
  timezone('utc', now()),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"IT-SUM Demo Student","locale":"en"}'::jsonb,
  timezone('utc', now()),
  timezone('utc', now())
)
on conflict (id) do update set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = timezone('utc', now());

insert into public.profiles (
  id,
  university_id,
  role,
  approval_status,
  full_name,
  email,
  normalized_email
)
values (
  '00000000-0000-4000-8000-000000009001'::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  'student'::public.user_role,
  'active'::public.approval_status,
  'IT-SUM Demo Student',
  'dev.student@students.ctu.edu.eg',
  'dev.student@students.ctu.edu.eg'
)
on conflict (id) do update set
  university_id = excluded.university_id,
  role = excluded.role,
  approval_status = excluded.approval_status,
  full_name = excluded.full_name,
  email = excluded.email,
  normalized_email = excluded.normalized_email,
  updated_at = timezone('utc', now());

insert into public.user_preferences (user_id, locale, theme, reminders_enabled, ai_enabled)
values (
  '00000000-0000-4000-8000-000000009001'::uuid,
  'en',
  'light',
  true,
  false
)
on conflict (user_id) do update set
  locale = excluded.locale,
  theme = excluded.theme,
  updated_at = timezone('utc', now());

commit;

-- Login: dev.student@students.ctu.edu.eg
-- Password: ITSumDev2026!
