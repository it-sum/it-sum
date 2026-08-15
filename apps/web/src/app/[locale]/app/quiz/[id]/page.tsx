import { notFound } from 'next/navigation';
import { mockQuizQuestions, mockQuizzes } from '@it-sum/shared/mocks';
import { QuizWorkspace } from '@/components/quiz-workspace';

export function generateStaticParams() {
  return ['ar', 'en'].flatMap((locale) => mockQuizzes.map((quiz) => ({ locale, id: quiz.id })));
}

export default async function QuizPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const quiz = mockQuizzes.find((item) => item.id === id);
  if (!quiz || quiz.state !== 'published') notFound();
  return <QuizWorkspace quiz={quiz} questions={mockQuizQuestions} locale={locale === 'en' ? 'en' : 'ar'} />;
}
