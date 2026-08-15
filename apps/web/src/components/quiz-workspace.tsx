'use client';

import { useEffect, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, CircleHelp, Clock3, Send, Trophy } from 'lucide-react';
import type { AnswerInput, AttemptResult, Quiz, QuizQuestion } from '@it-sum/shared';
import { Badge, Button, Card, ProgressBar } from '@it-sum/ui';
import { autosaveQuiz, isLiveApi, startQuiz, submitQuiz } from '../lib/api/client';

interface QuizWorkspaceProps {
  quiz: Quiz;
  questions: QuizQuestion[];
  locale: 'ar' | 'en';
}

function toAnswerInputs(answers: Record<string, string[]>): AnswerInput[] {
  return Object.entries(answers).map(([questionId, optionIds]) => ({ questionId, optionIds, text: null }));
}

export function QuizWorkspace({ quiz, questions, locale }: QuizWorkspaceProps) {
  const storageKey = `it-sum-quiz-${quiz.id}`;
  const [activeQuestions, setActiveQuestions] = useState(questions);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(quiz.timeLimitSeconds ?? 0);
  const [attempt, setAttempt] = useState<{ attemptId: string; attemptToken: string } | null>(null);
  const [serverResult, setServerResult] = useState<AttemptResult | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? '{}') as { answers?: Record<string, string[]>; current?: number };
      if (saved.answers) setAnswers(saved.answers);
      if (typeof saved.current === 'number') setCurrent(Math.min(Math.max(saved.current, 0), Math.max(activeQuestions.length - 1, 0)));
    } catch { /* ignore corrupt local draft */ }
  }, [storageKey, activeQuestions.length]);

  useEffect(() => {
    if (!isLiveApi()) return;
    let cancelled = false;
    startQuiz(quiz.id).then((started) => {
      if (cancelled) return;
      setActiveQuestions(started.questions);
      setAttempt({ attemptId: started.attemptId, attemptToken: started.attemptToken });
      setSecondsLeft(started.timeLimitSeconds ?? 0);
      setAnswers(started.savedAnswers as Record<string, string[]>);
    }).catch((reason: unknown) => {
      if (!cancelled) setLiveError(reason instanceof Error ? reason.message : 'Unable to start this quiz');
    });
    return () => { cancelled = true; };
  }, [quiz.id]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ answers, current }));
  }, [answers, current, storageKey]);

  useEffect(() => {
    if (!secondsLeft || submitted) return;
    const timer = window.setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft, submitted]);

  useEffect(() => {
    if (!isLiveApi() || !attempt || !Object.keys(answers).length || submitted) return;
    const timer = window.setTimeout(() => {
      void autosaveQuiz(attempt.attemptId, { attemptToken: attempt.attemptToken, answers: toAnswerInputs(answers) }).catch(() => undefined);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [answers, attempt, submitted]);

  const question = activeQuestions[current];
  const selected = question ? answers[question.id] ?? [] : [];
  const answered = Object.values(answers).filter((value) => value.length > 0).length;
  const time = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`;
  const isRtl = locale === 'ar';

  const choose = (optionId: string) => {
    if (!question || submitted) return;
    const next = question.type === 'multiple_choice' ? (selected.includes(optionId) ? selected.filter((id: string) => id !== optionId) : [...selected, optionId]) : [optionId];
    setAnswers((value) => ({ ...value, [question.id]: next }));
  };

  const submit = async () => {
    setSubmitting(true);
    if (isLiveApi() && attempt) {
      try {
        const result = await submitQuiz(attempt.attemptId, { attemptToken: attempt.attemptToken, answers: toAnswerInputs(answers) });
        setServerResult(result);
      } catch (reason: unknown) {
        setLiveError(reason instanceof Error ? reason.message : 'Unable to submit this quiz');
        setSubmitting(false);
        return;
      }
    }
    localStorage.removeItem(storageKey);
    setSubmitted(true);
    setSubmitting(false);
  };

  if (submitted) return <ResultState quiz={quiz} locale={locale} answered={answered} total={activeQuestions.length} result={serverResult} />;
  if (!question) return <Card className="p-8 text-center">No questions are available.</Card>;

  return <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8" dir={isRtl ? 'rtl' : 'ltr'}>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><Badge tone="primary">{quiz.examPhase}</Badge><h1 className="mt-3 text-2xl font-semibold text-on-background">{quiz.title}</h1><p className="mt-2 text-sm text-on-surface-variant">{isRtl ? 'اختر إجابة لكل سؤال. سيتم الحفظ تلقائياً.' : 'Choose an answer for each question. Your draft saves automatically.'}</p></div><div className="flex items-center gap-2 rounded-full bg-secondary-container px-4 py-2 text-sm font-semibold text-on-secondary-container"><Clock3 className="size-4" />{time}</div></div>
    {liveError && <Card className="mb-4 border-error/40 bg-error-container p-4 text-sm text-on-error-container">{isRtl ? 'تعذر الاتصال بالاختبار الحي، يمكنك الاستمرار في النسخة المحلية.' : `Live quiz connection failed; you can continue in local preview. ${liveError}`}</Card>}
    <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center"><ProgressBar value={activeQuestions.length ? (answered / activeQuestions.length) * 100 : 0} label={`Answered ${answered} of ${activeQuestions.length}`} /><span className="text-sm text-on-surface-variant">{answered}/{activeQuestions.length}</span></div>
    <Card className="p-5 sm:p-8"><div className="flex items-start justify-between gap-4"><div><div className="text-sm font-semibold text-primary">{isRtl ? `السؤال ${current + 1} من ${activeQuestions.length}` : `Question ${current + 1} of ${activeQuestions.length}`}</div><h2 className="mt-4 text-xl font-semibold leading-relaxed text-on-surface">{question.prompt}</h2></div><CircleHelp className="size-6 shrink-0 text-on-surface-variant" /></div><div className="mt-8 grid gap-3">{question.options.map((option) => { const isSelected = selected.includes(option.id); return <button key={option.id} type="button" onClick={() => choose(option.id)} className={`flex min-h-14 items-center justify-between gap-4 rounded-[15px] border p-4 text-start transition-colors ${isSelected ? 'border-primary bg-primary-container text-on-primary-container' : 'border-outline-variant bg-surface hover:bg-surface-container-high'}`} aria-pressed={isSelected}><span>{option.text}</span>{isSelected && <Check className="size-5 shrink-0" />}</button>; })}</div><div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant pt-5"><Button variant="tonal" disabled={current === 0} onClick={() => setCurrent((value) => value - 1)}><ChevronLeft className="size-4" />{isRtl ? 'السابق' : 'Previous'}</Button>{current === activeQuestions.length - 1 ? <Button variant="reward" disabled={submitting} onClick={() => void submit()}><Send className="size-4" />{submitting ? (isRtl ? 'جارٍ الإرسال…' : 'Submitting…') : (isRtl ? 'إرسال الاختبار' : 'Submit quiz')}</Button> : <Button onClick={() => setCurrent((value) => value + 1)}>{isRtl ? 'التالي' : 'Next'}<ChevronRight className="size-4" /></Button>}</div></Card>
    <p className="mt-4 text-center text-xs text-on-surface-variant">{isRtl ? 'لن تظهر مفاتيح الإجابة في المتصفح قبل الإرسال.' : 'Answer keys never reach the browser before submission.'}</p>
  </main>;
}

function ResultState({ quiz, locale, answered, total, result }: { quiz: Quiz; locale: 'ar' | 'en'; answered: number; total: number; result: AttemptResult | null }) {
  const isRtl = locale === 'ar';
  const points = result?.pointsAwarded ?? (answered === total ? quiz.totalPoints : 0);
  const headline = result?.isPassed ? (isRtl ? 'أحسنت، اجتزت الاختبار' : 'Great work — you passed') : (isRtl ? 'تم إرسال الاختبار' : 'Quiz submitted');
  return <main className="mx-auto flex w-full max-w-2xl px-4 py-16 sm:px-6" dir={isRtl ? 'rtl' : 'ltr'}><Card className="w-full p-8 text-center sm:p-12"><div className="mx-auto grid size-16 place-items-center rounded-full bg-reward-container text-on-reward-container"><Trophy className="size-8" /></div><h1 className="mt-6 text-2xl font-semibold text-on-surface">{headline}</h1><p className="mt-3 text-on-surface-variant">{isRtl ? `أجبت عن ${answered} من ${total} أسئلة.` : `You answered ${answered} of ${total} questions.`}{result && ` ${Math.round(result.percent)}%`}</p><div className="mt-6 flex items-center justify-center gap-2"><Badge tone="reward" numeric>{points} {isRtl ? 'نقطة' : 'points'}</Badge></div><Button className="mt-8" onClick={() => window.location.reload()}>{isRtl ? 'إعادة المحاولة' : 'Try again'}</Button></Card></main>;
}
