-- Small, human-authored quiz fixture. Answer keys stay in quiz_options/answer_key and are never selected by the student query.
begin;
insert into public.courses (id, semester_id, slug, code, name, description, instructor_name, credit_hours, sort_order, is_active)
values ('00000000-0000-4000-8000-000000000105', '00000000-0000-4000-8000-000000003001', 'python-programming', 'CS101', '{"ar":"برمجة بايثون","en":"Python Programming"}', '{"ar":"مقدمة في برمجة بايثون.","en":"Introduction to Python programming."}', 'Eng. Ahmed Eid', 3, 0, true)
on conflict (id) do update set name = excluded.name, description = excluded.description, instructor_name = excluded.instructor_name, updated_at = timezone('utc', now());

insert into public.quizzes (id, university_id, course_id, resource_id, title, description, exam_phase, state, question_count, total_points, time_limit_seconds, pass_percent, max_attempts, shuffle_questions, shuffle_options, show_answers_after_submit, is_ai_generated, ai_review_required)
values ('00000000-0000-4000-8000-000000000600', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000105', null, 'اختبار الباب الأول — بايثون', '{"ar":"اختبار قصير على أساسيات بايثون.","en":"A short quiz on Python fundamentals."}', 'midterm', 'published', 3, 4, 900, 60, 3, true, true, true, false, false)
on conflict (id) do update set title = excluded.title, state = excluded.state, updated_at = timezone('utc', now());

insert into public.quiz_versions (id, quiz_id, version_number, published_at)
values ('00000000-0000-4000-8000-000000000650', '00000000-0000-4000-8000-000000000600', 1, timezone('utc', now()))
on conflict (id) do update set published_at = excluded.published_at;

insert into public.quiz_questions (id, quiz_version_id, question_type, prompt, points, sort_order, required_selections, answer_key, explanation)
values
('00000000-0000-4000-8000-000000000700', '00000000-0000-4000-8000-000000000650', 'single_choice', 'ما هي نتيجة تنفيذ print(type(5/2)) في بايثون؟', 1, 0, 1, '{}', '{"ar":"القسمة العادية تعيد قيمة عشرية.","en":"Regular division returns a floating-point value."}'),
('00000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-000000000650', 'multiple_choice', 'أي من التالي قابل للتعديل في بايثون؟', 2, 1, 2, '{}', '{"ar":"القوائم والقواميس قابلة للتعديل.","en":"Lists and dictionaries are mutable."}'),
('00000000-0000-4000-8000-000000000702', '00000000-0000-4000-8000-000000000650', 'true_false', 'حلقة while تنفذ مرة واحدة على الأقل دائماً.', 1, 2, 1, '{}', '{"ar":"قد لا تنفذ إذا كان الشرط خاطئاً من البداية.","en":"It may not execute if its condition is false initially."}')
on conflict (id) do update set prompt = excluded.prompt, answer_key = excluded.answer_key, explanation = excluded.explanation;

insert into public.quiz_options (id, question_id, text, sort_order, is_correct)
values
('00000000-0000-4000-8000-000000000710', '00000000-0000-4000-8000-000000000700', '<class ''int''>', 0, false),
('00000000-0000-4000-8000-000000000711', '00000000-0000-4000-8000-000000000700', '<class ''float''>', 1, true),
('00000000-0000-4000-8000-000000000712', '00000000-0000-4000-8000-000000000700', '<class ''str''>', 2, false),
('00000000-0000-4000-8000-000000000720', '00000000-0000-4000-8000-000000000701', 'list', 0, true),
('00000000-0000-4000-8000-000000000721', '00000000-0000-4000-8000-000000000701', 'tuple', 1, false),
('00000000-0000-4000-8000-000000000722', '00000000-0000-4000-8000-000000000701', 'dict', 2, true),
('00000000-0000-4000-8000-000000000730', '00000000-0000-4000-8000-000000000702', 'صح', 0, false),
('00000000-0000-4000-8000-000000000731', '00000000-0000-4000-8000-000000000702', 'خطأ', 1, true)
on conflict (id) do update set text = excluded.text, is_correct = excluded.is_correct;

update public.quizzes set published_version_id = '00000000-0000-4000-8000-000000000650', question_count = 3, total_points = 4, updated_at = timezone('utc', now()) where id = '00000000-0000-4000-8000-000000000600';
commit;
