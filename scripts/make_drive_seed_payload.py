import json
from pathlib import Path

root = Path('/home/ubuntu/it-sum')
sql = (root / 'supabase/seed/002_drive_library_seed.sql').read_text(encoding='utf-8')
(root / 'supabase/drive_seed_payload.json').write_text(json.dumps({
    'name': 'seed_drive_library_metadata',
    'project_id': 'ztujhryukdddhjymhfod',
    'query': sql,
}, ensure_ascii=False))
print('wrote Drive seed payload', len(sql), 'characters')
