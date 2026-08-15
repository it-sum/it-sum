import { AdminSectionPage } from '@/components/admin-section-page';
export default async function AdminUsersPage({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; return <AdminSectionPage locale={locale} section="users" />; }
