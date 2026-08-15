import json
from pathlib import Path

root = Path('/home/ubuntu/it-sum')
sql = (root / 'supabase/migrations/20260815120000_initial_schema.sql').read_text()
payload = {
    'name': 'initial_schema',
    'project_id': 'ztujhryukdddhjymhfod',
    'query': sql,
}
(root / 'supabase/apply_initial_schema.json').write_text(json.dumps(payload, ensure_ascii=False))
print('wrote migration payload', len(sql), 'characters')
