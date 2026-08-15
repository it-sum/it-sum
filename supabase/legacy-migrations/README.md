# Legacy migrations

These SQL files belong to the first backend schema draft and are retained for historical reference only. They are **not** part of the active Supabase migration path because they create tables that are replaced by the timestamped schema under `supabase/migrations`.

Do not apply these files with `supabase db reset`, staging deployments, or production deployments. The authoritative migration sequence is the timestamped set in `supabase/migrations`.
