from pathlib import Path

pages = {
    'apps/web/src/app/[locale]/page.tsx': 'HomePage',
    'apps/web/src/app/[locale]/departments/page.tsx': 'DepartmentsPage',
    'apps/web/src/app/[locale]/resources/page.tsx': 'ResourcesPage',
    'apps/web/src/app/[locale]/roadmaps/page.tsx': 'RoadmapsPage',
    'apps/web/src/app/[locale]/about/page.tsx': 'AboutPage',
    'apps/web/src/app/[locale]/contact/page.tsx': 'ContactPage',
    'apps/web/src/app/[locale]/login/page.tsx': 'LoginPage',
    'apps/web/src/app/[locale]/register/page.tsx': 'RegisterPage',
}

root = Path('/home/ubuntu/it-sum')
for relative, name in pages.items():
    path = root / relative
    text = path.read_text()
    old_signature = f'export default async function {name}() {{'
    new_signature = f'''export default async function {name}({{ params }}: {{ params: Promise<{{ locale: string }}> }}) {{'''
    if old_signature not in text:
        raise SystemExit(f'missing signature in {path}')
    text = text.replace(old_signature, new_signature, 1)
    old_translation = '  const { t } = await getPageTranslations();'
    new_translation = '  const { locale } = await params;\n  const { t } = await getPageTranslations(locale);'
    if old_translation not in text:
        raise SystemExit(f'missing translation call in {path}')
    text = text.replace(old_translation, new_translation, 1)
    path.write_text(text)

print(f'updated {len(pages)} locale-aware server pages')
