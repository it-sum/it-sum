import Image from 'next/image';
import { BookOpenCheck, CheckCircle2, LockKeyhole, Sparkles } from 'lucide-react';
import { getPageTranslations } from '@/i18n/server';
import { Badge, Card, CardBody } from '@it-sum/ui';
import { Link } from '@/i18n/routing';
import { LoginForm } from '@/components/login-form';

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { t } = await getPageTranslations(locale);
  const ar = locale === 'ar';
  const benefits = ar ? ['كل مواردك في مساحة تعلم واحدة', 'تقدم محفوظ مع كل قراءة ومشاهدة', 'اختبارات ونقاط تساعدك على الاستمرار'] : ['All your resources in one learning space', 'Progress saved across reading and watching', 'Quizzes and rewards that keep you moving'];

  return <div className="relative grid min-h-[calc(100dvh-4rem)] overflow-hidden bg-background lg:grid-cols-[1.05fr_0.95fr]">
    <div className="pointer-events-none absolute -start-40 top-20 size-[28rem] rounded-full bg-primary-container/35 blur-3xl" />
    <div className="order-2 relative flex items-center px-4 py-12 sm:px-8 lg:order-1 lg:px-12 xl:px-20"><div className="mx-auto w-full max-w-xl"><Badge tone="primary"><Sparkles className="me-2 size-4" />{ar ? 'تعلم بوضوح' : 'Learn with clarity'}</Badge><h1 className="mt-6 text-display-small text-on-surface sm:text-display-medium">{t('home.heroTitle')}</h1><p className="mt-5 max-w-lg text-body-large text-on-surface-variant">{t('home.heroSubtitle')}</p><div className="mt-8 grid gap-3">{benefits.map((benefit) => <div key={benefit} className="flex items-center gap-3 text-body-medium text-on-surface"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-container text-on-primary-container"><CheckCircle2 className="size-4" /></span>{benefit}</div>)}</div><div className="mt-10 grid max-w-md grid-cols-2 gap-3"><Card variant="filled" className="p-4"><BookOpenCheck className="size-5 text-primary" /><p className="mt-3 text-title-medium text-on-surface">223+</p><p className="mt-1 text-body-small text-on-surface-variant">{ar ? 'ملف ومصدر' : 'files and resources'}</p></Card><Card variant="filled" className="p-4"><LockKeyhole className="size-5 text-primary" /><p className="mt-3 text-title-medium text-on-surface">{ar ? 'آمن' : 'Private'}</p><p className="mt-1 text-body-small text-on-surface-variant">{ar ? 'للطلاب والمشرفين' : 'for students and admins'}</p></Card></div></div></div>
    <div className="order-1 relative flex items-center justify-center bg-surface-container-low px-4 py-12 sm:px-8 lg:order-2 lg:px-12"><div className="w-full max-w-md"><Card variant="elevated" className="overflow-hidden rounded-[2rem] border border-outline-variant/60"><CardBody className="p-6 sm:p-8"><div className="mb-8 text-center"><Image src="/brand/it-sum-logo.webp" alt="" width={76} height={76} className="mx-auto size-19 rounded-full object-cover shadow-level1" priority /><h2 className="mt-5 text-headline-medium text-on-surface">{t('auth.loginTitle')}</h2><p className="mt-2 text-body-medium text-on-surface-variant">{t('auth.loginSubtitle')}</p></div><LoginForm /><p className="mt-6 text-center text-body-medium text-on-surface-variant">{t('auth.noAccount')} <Link href="/register" className="font-semibold text-primary underline-offset-4 hover:underline">{t('nav.register')}</Link></p></CardBody></Card><p className="mt-5 text-center text-body-small text-on-surface-variant">{ar ? 'منصة تعليمية غير ربحية — مبنية بواسطة طلاب، لطلاب.' : 'Non-profit education — built by students, for students.'}</p></div></div>
  </div>;
}
