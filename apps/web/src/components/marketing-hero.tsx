import { ArrowUpRight, Sparkles } from 'lucide-react';

export function MarketingHero({
  eyebrow,
  title,
  description,
  index,
  signal,
}: {
  eyebrow: string;
  title: string;
  description: string;
  index: string;
  signal: string;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-primary text-on-primary">
      <div className="pointer-events-none absolute -end-24 -top-28 -z-10 size-80 rounded-full bg-tertiary/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-36 start-1/3 -z-10 size-96 rounded-full bg-secondary/30 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-20 [background-image:linear-gradient(rgb(255_255_255_/_0.16)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255_/_0.16)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />

      <div className="mx-auto grid max-w-[var(--it-sum-content-max-width)] gap-10 px-4 py-16 sm:px-6 md:py-20 lg:grid-cols-[1.25fr_0.75fr] lg:items-end lg:gap-16 lg:px-8 lg:py-24">
        <div>
          <div className="flex items-center gap-3 text-label-large text-on-primary/75">
            <span className="grid size-8 place-items-center rounded-full border border-on-primary/25 bg-on-primary/10 text-label-medium text-on-primary">
              {index}
            </span>
            <span className="h-px w-10 bg-on-primary/35" aria-hidden="true" />
            <span>{eyebrow}</span>
          </div>
          <h1 className="mt-7 max-w-4xl text-display-small text-on-primary sm:text-display-medium">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-body-large text-on-primary/75 md:text-headline-small md:leading-relaxed">
            {description}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-[1.75rem] border border-on-primary/20 bg-on-primary/10 p-6 backdrop-blur-sm sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="grid size-11 place-items-center rounded-2xl bg-tertiary text-on-tertiary shadow-level1">
              <Sparkles className="size-5" aria-hidden="true" />
            </div>
            <ArrowUpRight className="size-5 text-on-primary/60" aria-hidden="true" />
          </div>
          <p className="mt-12 max-w-xs text-title-large text-on-primary">{signal}</p>
          <div className="mt-6 flex items-center gap-2 text-label-medium text-on-primary/60">
            <span className="size-2 rounded-full bg-tertiary" aria-hidden="true" />
            <span>IT-SUM / 2026</span>
          </div>
        </div>
      </div>
    </section>
  );
}
