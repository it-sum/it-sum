-- Keep Supabase status values identical to packages/shared contract vocabulary.
begin;
alter type public.approval_status rename value 'approved' to 'active';
commit;
