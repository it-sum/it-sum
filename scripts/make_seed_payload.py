import json
from pathlib import Path

root = Path('/home/ubuntu/it-sum')
sql = (root / 'supabase/seed/001_it_sum_core.sql').read_text()
(root / 'supabase/seed/001_it_sum_core_payload.json').write_text(json.dumps({
    'project_id': 'ztujhryukdddhjymhfod',
    'query': sql,
}, ensure_ascii=False))
print('wrote seed payload', len(sql), 'characters')
