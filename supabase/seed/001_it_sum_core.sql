-- Forkable IT-SUM baseline seed.
-- Replace the bilingual names and email domain in one file for another university.
begin;

insert into public.universities (
  id, slug, name, short_name, logo_url, primary_color, email_domains
) values (
  '00000000-0000-4000-8000-000000000001',
  'it-sum',
  '{"ar":"جامعة IT-SUM","en":"IT-SUM University"}',
  '{"ar":"IT-SUM","en":"IT-SUM"}',
  null,
  '#1BA9A2',
  array['students.ctu.edu.eg']
)
on conflict (id) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  primary_color = excluded.primary_color,
  email_domains = excluded.email_domains,
  updated_at = timezone('utc', now());

insert into public.departments (id, university_id, slug, name, description, icon_name, sort_order)
values (
  '00000000-0000-4000-8000-000000001001',
  '00000000-0000-4000-8000-000000000001',
  'information-technology',
  '{"ar":"قسم تكنولوجيا المعلومات","en":"Information Technology"}',
  '{"ar":"ملخصات ومحاضرات واختبارات قسم تكنولوجيا المعلومات.","en":"Summaries, lectures and quizzes for the Information Technology department."}',
  'cpu',
  0
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  updated_at = timezone('utc', now());

insert into public.batches (id, department_id, level, name, drive_folder_id, is_active)
values
  ('00000000-0000-4000-8000-000000002001', '00000000-0000-4000-8000-000000001001', 1, '{"ar":"المستوى الأول","en":"Level 1"}', '10bpMPWKQ4EJ6UWEBwysqNdTEC6Tsh6B2', true),
  ('00000000-0000-4000-8000-000000002002', '00000000-0000-4000-8000-000000001001', 2, '{"ar":"المستوى الثاني","en":"Level 2"}', null, true),
  ('00000000-0000-4000-8000-000000002003', '00000000-0000-4000-8000-000000001001', 3, '{"ar":"المستوى الثالث","en":"Level 3"}', null, true),
  ('00000000-0000-4000-8000-000000002004', '00000000-0000-4000-8000-000000001001', 4, '{"ar":"المستوى الرابع","en":"Level 4"}', null, true)
on conflict (id) do update set
  name = excluded.name,
  drive_folder_id = excluded.drive_folder_id,
  updated_at = timezone('utc', now());

insert into public.semesters (id, batch_id, term, name, drive_folder_id, is_active)
select
  ('00000000-0000-4000-8000-' || lpad((3000 + ((level - 1) * 2) + term_offset)::text, 12, '0'))::uuid,
  b.id,
  case when term_offset = 1 then 'first'::public.semester_term else 'second'::public.semester_term end,
  case when term_offset = 1 then
    jsonb_build_object('ar', 'الترم الأول', 'en', 'First semester')
  else
    jsonb_build_object('ar', 'الترم الثاني', 'en', 'Second semester')
  end,
  case when b.level = 1 and term_offset = 1 then '10bpMPWKQ4EJ6UWEBwysqNdTEC6Tsh6B2' else null end,
  true
from public.batches b
cross join (values (1), (2)) as terms(term_offset)
where b.department_id = '00000000-0000-4000-8000-000000001001'
on conflict (id) do update set
  name = excluded.name,
  drive_folder_id = excluded.drive_folder_id,
  updated_at = timezone('utc', now());

insert into public.reward_rules (university_id, event_key, points, daily_cap)
values
  ('00000000-0000-4000-8000-000000000001', 'quiz_passed', 25, 5),
  ('00000000-0000-4000-8000-000000000001', 'resource_completed', 5, 20),
  ('00000000-0000-4000-8000-000000000001', 'streak_day', 10, 1)
on conflict (university_id, event_key) do update set
  points = excluded.points,
  daily_cap = excluded.daily_cap;

insert into public.badges (id, university_id, slug, name, description, icon_name, tier, points_reward)
values
  ('00000000-0000-4000-8000-000000004001', '00000000-0000-4000-8000-000000000001', 'first-quiz', '{"ar":"أول اختبار","en":"First quiz"}', '{"ar":"أكملت أول اختبار لك.","en":"You completed your first quiz."}', 'sparkles', 'bronze', 10),
  ('00000000-0000-4000-8000-000000004002', '00000000-0000-4000-8000-000000000001', 'quiz-master', '{"ar":"خبير الاختبارات","en":"Quiz master"}', '{"ar":"حصلت على خمس درجات كاملة.","en":"You earned five perfect quiz scores."}', 'trophy', 'gold', 50)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  points_reward = excluded.points_reward;

commit;
