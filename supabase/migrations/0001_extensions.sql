create extension if not exists vector with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_cron;
create extension if not exists pg_net;

create schema if not exists private;

comment on extension vector is 'Vector similarity search for document retrieval';
comment on extension pg_trgm is 'Trigram indexes for fuzzy course and filename matching';
comment on extension unaccent is 'Accent-insensitive bilingual search normalization';
