import json
import re
import uuid
from pathlib import Path

ROOT = Path('/home/ubuntu/it-sum')
INPUT = ROOT / 'supabase/seed/drive_metadata.json'
OUTPUT = ROOT / 'supabase/seed/002_drive_library_seed.sql'
UNIVERSITY_ID = '00000000-0000-4000-8000-000000000001'
ROOT_DRIVE_ID = '10bpMPWKQ4EJ6UWEBwysqNdTEC6Tsh6B2'
NAMESPACE = uuid.UUID('00000000-0000-4000-8000-000000000099')


def sql(value):
    if value is None:
        return 'null'
    if isinstance(value, bool):
        return 'true' if value else 'false'
    if isinstance(value, (int, float)):
        return str(value)
    text = str(value).replace("'", "''")
    return f"'{text}'"


def db_id(prefix: str, drive_id: str) -> str:
    return str(uuid.uuid5(NAMESPACE, f'{prefix}:{drive_id}'))


def classify(path: str):
    lower = path.casefold()
    if 'ميدترم' in path or 'midterm' in lower:
        phase = 'midterm'
    elif 'فاينل' in path or 'final' in lower:
        phase = 'final'
    elif 'ما قبل' in path or 'pre' in lower:
        phase = 'pre_midterm'
    elif 'ما بعد' in path or 'post' in lower:
        phase = 'post_midterm'
    else:
        phase = 'unphased'
    if 'ملخص' in path or 'summary' in lower:
        kind = 'summary'
    elif 'محاضر' in path or 'lecture' in lower:
        kind = 'lecture'
    elif 'assignment' in lower:
        kind = 'assignment'
    elif 'sheet' in lower or 'شيت' in path:
        kind = 'sheet'
    elif 'tutorial' in lower:
        kind = 'tutorial'
    elif 'exam' in lower or 'امتحان' in path:
        kind = 'exam'
    else:
        kind = 'other'
    return kind, phase


def main():
    data = json.loads(INPUT.read_text(encoding='utf-8'))
    folders = [{'id': ROOT_DRIVE_ID, 'name': 'ملخصات قسم IT', 'path': 'ملخصات قسم IT', 'parentId': None}]
    folders.extend(data['folders'])
    files = [item for item in data['files'] if item['mimeType'] == 'application/pdf']
    md5_counts = {}
    for item in files:
        if item.get('md5Checksum'):
            md5_counts[item['md5Checksum']] = md5_counts.get(item['md5Checksum'], 0) + 1

    lines = [
        '-- Generated from the read-only export of the IT-SUM Drive folder.',
        '-- This file contains metadata only; PDF bytes remain in Google Drive.',
        'begin;',
    ]
    for folder in folders:
        folder_id = db_id('folder', folder['id'])
        parent_db_id = db_id('folder', folder['parentId']) if folder.get('parentId') else None
        path = folder.get('path') or folder['name']
        depth = max(0, path.count('/'))
        lines.append(
            "insert into public.folders (id, university_id, parent_id, drive_folder_id, name, display_name, normalized_name, path, depth, material_kind, exam_phase, state) values ("
            + ', '.join([
                sql(folder_id), sql(UNIVERSITY_ID), sql(parent_db_id), sql(folder['id']), sql(folder['name']), sql(folder['name'].strip()), sql(folder['name'].strip().casefold()), sql(path), str(depth), "'other'", "'unphased'", "'published'",
            ])
            + ") on conflict (university_id, drive_folder_id) do update set parent_id = excluded.parent_id, name = excluded.name, display_name = excluded.display_name, path = excluded.path, depth = excluded.depth, updated_at = timezone('utc', now());"
        )

    for item in files:
        resource_id = db_id('resource', item['id'])
        folder_id = db_id('folder', item['parentId'])
        kind, phase = classify(item['path'])
        checksum = item.get('md5Checksum') if md5_counts.get(item.get('md5Checksum'), 0) == 1 else None
        title = item['name']
        display = re.sub(r'\.pdf$', '', title, flags=re.IGNORECASE).strip() or title
        lines.append(
            "insert into public.resources (id, university_id, folder_id, type, title, display_title, description, material_kind, exam_phase, state, drive_file_id, mime_type, size_bytes, md5, text_quality, is_searchable, is_ai_ready, download_allowed, tags, view_count, drive_modified_at, published_at) values ("
            + ', '.join([
                sql(resource_id), sql(UNIVERSITY_ID), sql(folder_id), "'pdf'", sql(title), sql(display), "'{\"ar\":null,\"en\":null}'::jsonb", sql(kind), sql(phase), "'published'", sql(item['id']), sql(item['mimeType']), sql(item.get('size')), sql(checksum), "'none'", 'false', 'false', 'false', "'{}'", '0', sql(item.get('modifiedTime')), 'timezone(\'utc\', now())',
            ])
            + ") on conflict (university_id, drive_file_id) do update set folder_id = excluded.folder_id, title = excluded.title, display_title = excluded.display_title, material_kind = excluded.material_kind, exam_phase = excluded.exam_phase, size_bytes = excluded.size_bytes, md5 = excluded.md5, drive_modified_at = excluded.drive_modified_at, updated_at = timezone('utc', now());"
        )
    lines.append('commit;')
    OUTPUT.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(json.dumps({'folders': len(folders), 'pdfs': len(files), 'duplicate_md5_files_without_checksum': sum(1 for item in files if item.get('md5Checksum') and md5_counts.get(item['md5Checksum'], 0) > 1), 'output': str(OUTPUT)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
