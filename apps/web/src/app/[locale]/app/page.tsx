import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  Flame,
  LayoutGrid,
  Play,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import { Badge, Card, LinkButton, ProgressBar, ProgressRing } from "@it-sum/ui";
import { mockQuizzes, mockResources } from "@it-sum/shared/mocks";
import { getPageTranslations } from "@/i18n/server";

export default async function AppDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { t } = await getPageTranslations(locale);
  const continueItems = mockResources
    .filter((item) => item.progress && item.progress.percent < 100)
    .slice(0, 3);
  const publishedQuizzes = mockQuizzes
    .filter((quiz) => quiz.state === "published")
    .slice(0, 3);
  const averageProgress = Math.round(
    continueItems.reduce(
      (total, item) => total + (item.progress?.percent ?? 0),
      0,
    ) / Math.max(continueItems.length, 1),
  );
  const featuredResource = continueItems[0];

  return (
    <div className="min-h-dvh bg-surface-container-lowest">
      <section className="relative overflow-hidden bg-[#10253d] text-white">
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="pointer-events-none absolute -top-40 end-0 size-[28rem] rounded-full bg-[#2dc9b4]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-56 start-1/4 size-[26rem] rounded-full bg-[#89a9ff]/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-[var(--it-sum-content-max-width)] gap-12 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <Badge
              tone="info"
              icon={<Sparkles className="size-3.5" />}
              className="border border-white/10 bg-white/10 text-white"
            >
              {t("app.dashboardLabel")}
            </Badge>
            <p className="mt-7 flex items-center gap-2 text-sm font-medium text-[#a9e9de]">
              <span className="size-2 rounded-full bg-[#2dc9b4] shadow-[0_0_0_5px_rgba(45,201,180,.15)]" />
              {t("app.eyebrow")}
            </p>
            <h1 className="mt-3 max-w-xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
              {t("app.title")}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
              {t("app.subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton
                href={`/${locale}/resources`}
                variant="filled"
                size="lg"
                className="bg-[#d5fff7] text-[#10253d] hover:bg-white"
              >
                {t("app.browse")}
                <ArrowRight className="ms-2 size-4" />
              </LinkButton>
              <LinkButton
                href={`/${locale}/roadmaps`}
                variant="outlined"
                size="lg"
                className="border-white/25 text-white hover:border-white/50 hover:bg-white/10"
              >
                {t("app.planAction")}
                <ArrowUpRight className="ms-2 size-4" />
              </LinkButton>
            </div>
          </div>

          <Card
            variant="elevated"
            className="relative overflow-hidden rounded-[15px] border border-white/15 bg-white/[0.09] p-5 text-white shadow-2xl backdrop-blur sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                  {t("app.focusEyebrow")}
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  {t("app.focusTitle")}
                </h2>
              </div>
              <div className="grid size-11 place-items-center rounded-[15px] bg-[#2dc9b4]/15 text-[#7ee7d8]">
                <Target className="size-5" />
              </div>
            </div>
            <div className="mt-7 flex items-center gap-5">
              <ProgressRing
                value={averageProgress}
                size={106}
                strokeWidth={8}
                showLabel
                label={t("app.focusProgressLabel")}
                className="text-white/20 [&_circle:nth-child(2)]:text-[#2dc9b4]"
              />
              <div>
                <p className="text-sm text-white/60">
                  {t("app.focusProgressLabel")}
                </p>
                <p
                  className="mt-1 text-3xl font-semibold tabular"
                  data-numeric="true"
                >
                  {averageProgress}%
                </p>
                <p className="mt-1 text-sm text-[#a9e9de]">
                  {t("app.focusProgressBody")}
                </p>
              </div>
            </div>
            <div className="mt-7 rounded-[15px] border border-white/10 bg-black/10 p-4">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-[15px] bg-white/10 text-[#a9e9de]">
                  <Zap className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-white/50">{t("app.nextUp")}</p>
                  <p className="mt-1 truncate text-sm font-semibold">
                    {featuredResource?.displayTitle ?? t("app.continue")}
                  </p>
                </div>
                <ArrowUpRight className="size-4 text-white/50" />
              </div>
            </div>
          </Card>
        </div>
      </section>

      <div className="mx-auto max-w-[var(--it-sum-content-max-width)] px-4 sm:px-6 lg:px-8">
        <section className="-mt-7 grid gap-3 sm:grid-cols-3">
          <Metric
            icon={<BookOpenCheck className="size-5" />}
            label={t("app.metrics.resources")}
            value="12"
            detail={t("app.metrics.resourcesDetail")}
            tone="teal"
          />
          <Metric
            icon={<Flame className="size-5" />}
            label={t("app.metrics.streak")}
            value={t("app.metrics.streakValue")}
            detail={t("app.metrics.streakDetail")}
            tone="orange"
          />
          <Metric
            icon={<Trophy className="size-5" />}
            label={t("app.metrics.points")}
            value="185"
            detail={t("app.metrics.pointsDetail")}
            tone="violet"
          />
        </section>

        <section className="grid gap-8 py-12 lg:grid-cols-[1.35fr_0.65fr] lg:py-16">
          <div>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                  {t("app.continueEyebrow")}
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-on-background sm:text-3xl">
                  {t("app.continue")}
                </h2>
              </div>
              <Link
                href={`/${locale}/resources`}
                className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline sm:flex"
              >
                {t("app.seeAll")} <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="grid gap-4">
              {continueItems.map((item, index) => (
                <Card
                  key={item.id}
                  variant="elevated"
                  interactive
                  className="group overflow-hidden rounded-[15px] border border-outline-variant/50 p-0"
                >
                  <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
                    <div
                      className={`grid size-14 shrink-0 place-items-center rounded-[15px] ${index === 0 ? "bg-primary-container text-on-primary-container" : index === 1 ? "bg-secondary-container text-on-secondary-container" : "bg-reward-container text-on-reward-container"}`}
                    >
                      {item.type === "video" ? (
                        <Play className="size-6" />
                      ) : (
                        <BookOpenCheck className="size-6" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          tone={
                            index === 0
                              ? "primary"
                              : index === 1
                                ? "info"
                                : "reward"
                          }
                        >
                          {item.materialKind}
                        </Badge>
                        <span className="text-xs text-on-surface-variant">
                          {item.examPhase}
                        </span>
                      </div>
                      <h3 className="mt-2 truncate text-lg font-semibold text-on-surface">
                        {item.displayTitle}
                      </h3>
                      <div className="mt-3 flex items-center gap-3">
                        <ProgressBar
                          value={item.progress?.percent ?? 0}
                          label={`${item.displayTitle} progress`}
                          className="h-1.5"
                        />
                        <span
                          className="shrink-0 text-sm font-semibold text-primary"
                          data-numeric="true"
                        >
                          {Math.round(item.progress?.percent ?? 0)}%
                        </span>
                      </div>
                    </div>
                    <LinkButton
                      href={`/${locale}/app/resource/${item.id}`}
                      variant="tonal"
                      size="sm"
                      className="shrink-0 self-start sm:self-center"
                    >
                      {t("app.open")}{" "}
                      <ArrowRight className="ms-2 size-4 transition-transform group-hover:translate-x-0.5" />
                    </LinkButton>
                  </div>
                </Card>
              ))}
            </div>
            <Link
              href={`/${locale}/resources`}
              className="mt-5 flex items-center justify-center gap-1 text-sm font-semibold text-primary hover:underline sm:hidden"
            >
              {t("app.seeAll")} <ArrowRight className="size-4" />
            </Link>
          </div>

          <Card
            variant="filled"
            className="h-fit rounded-[15px] glass-panel p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                  {t("app.weeklyEyebrow")}
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-on-surface">
                  {t("app.weeklyTitle")}
                </h2>
              </div>
              <BarChart3 className="size-5 text-primary" />
            </div>
            <div className="mt-8 space-y-5">
              <FocusRow
                icon={<CalendarDays className="size-4" />}
                label={t("app.weeklySessions")}
                value="4 / 5"
              />
              <FocusRow
                icon={<BookOpenCheck className="size-4" />}
                label={t("app.weeklyResources")}
                value="12 / 15"
              />
              <FocusRow
                icon={<Trophy className="size-4" />}
                label={t("app.weeklyQuizzes")}
                value="3 / 5"
              />
            </div>
            <div className="mt-8 glass-soft rounded-[15px] p-4">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-[15px] bg-primary-container text-on-primary-container">
                  <LayoutGrid className="size-5" />
                </div>
                <p className="text-sm font-medium leading-6 text-on-surface">
                  {t("app.weeklyBody")}
                </p>
              </div>
            </div>
          </Card>
        </section>

        <section className="border-t border-outline-variant/60 py-12 lg:py-16">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                {t("app.practiceEyebrow")}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-on-background sm:text-3xl">
                {t("app.quizzesTitle")}
              </h2>
            </div>
            <span className="hidden text-sm text-on-surface-variant sm:inline">
              {t("app.rewards")}
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {publishedQuizzes.map((quiz) => (
              <Card
                key={quiz.id}
                variant="outlined"
                interactive
                className="flex h-full flex-col rounded-[15px] p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="grid size-11 place-items-center rounded-[15px] bg-reward-container text-on-reward-container">
                    <Trophy className="size-5" />
                  </div>
                  <Badge tone="reward">{quiz.examPhase}</Badge>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-on-surface">
                  {quiz.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                  {quiz.questionCount} questions · {quiz.totalPoints} points
                </p>
                <LinkButton
                  href={`/${locale}/app/quiz/${quiz.id}`}
                  variant="reward"
                  size="sm"
                  className="mt-6 w-full"
                >
                  {t("app.takeQuiz")} <ArrowRight className="ms-2 size-4" />
                </LinkButton>
              </Card>
            ))}
          </div>
        </section>

        <section className="pb-14 lg:pb-20">
          <div className="flex flex-col gap-6 overflow-hidden rounded-[15px] glass-panel p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="flex items-start gap-4">
              <div className="grid size-12 shrink-0 place-items-center rounded-[15px] bg-primary text-on-primary">
                <Sparkles className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                  {t("app.tipEyebrow")}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-on-surface">
                  {t("app.tipTitle")}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
                  {t("app.tipBody")}
                </p>
              </div>
            </div>
            <LinkButton
              href={`/${locale}/roadmaps`}
              variant="filled"
              className="shrink-0"
            >
              {t("app.planAction")} <ArrowUpRight className="ms-2 size-4" />
            </LinkButton>
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: "teal" | "orange" | "violet";
}) {
  const toneClasses = {
    teal: "bg-[#dff8f3] text-[#087f72]",
    orange: "bg-[#fff0dc] text-[#b85c00]",
    violet: "bg-[#eeeaff] text-[#6552b8]",
  } as const;

  return (
    <Card
      variant="elevated"
      className="flex items-center gap-4 rounded-[15px] border border-outline-variant/40 p-4 sm:p-5"
    >
      <div
        className={`grid size-11 shrink-0 place-items-center rounded-[15px] ${toneClasses[tone]}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs text-on-surface-variant">{label}</div>
        <div
          className="mt-0.5 text-xl font-semibold text-on-surface"
          data-numeric="true"
        >
          {value}
        </div>
        <div className="mt-0.5 truncate text-xs text-on-surface-variant">
          {detail}
        </div>
      </div>
    </Card>
  );
}

function FocusRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-9 place-items-center rounded-[15px] bg-white text-primary dark:bg-surface-low">
        {icon}
      </div>
      <span className="flex-1 text-sm text-on-surface-variant">{label}</span>
      <span
        className="text-sm font-semibold text-on-surface"
        data-numeric="true"
      >
        {value}
      </span>
    </div>
  );
}
