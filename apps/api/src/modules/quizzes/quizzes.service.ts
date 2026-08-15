import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { attemptResultSchema, quizQuestionSchema, quizSummarySchema, startAttemptResponseSchema, type AnswerInput, type AttemptResult, type QuizSummary, type StartAttemptResponse } from '@it-sum/shared';
import type { AuthenticatedUser } from '../../common/auth/auth.types';
import { type SupabaseService } from '../../common/supabase/supabase.service';
import { type QuizAttemptTokenService, type QuizAttemptTokenPayload } from './quiz-attempt-token.service';

type DbRow = Record<string, unknown>;

function text(value: unknown): string { return typeof value === 'string' ? value : ''; }
function numberValue(value: unknown): number { return typeof value === 'number' ? value : Number(value ?? 0); }
function jsonObject(value: unknown): DbRow { return value && typeof value === 'object' && !Array.isArray(value) ? value as DbRow : {}; }
function sameIds(left: string[], right: string[]) { return left.length === right.length && left.every((value) => right.includes(value)); }

@Injectable()
export class QuizzesService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly tokens: QuizAttemptTokenService,
  ) {}

  async list(rawQuery: DbRow, user: AuthenticatedUser): Promise<QuizSummary[]> {
    if (!user.universityId) return [];
    let query = this.supabase.admin.from('quizzes').select('*').eq('university_id', user.universityId).eq('state', 'published').order('created_at', { ascending: false }).limit(100);
    if (typeof rawQuery.courseId === 'string') query = query.eq('course_id', rawQuery.courseId);
    if (typeof rawQuery.examPhase === 'string') query = query.eq('exam_phase', rawQuery.examPhase);
    const { data, error } = await query;
    if (error) throw new Error(`Failed to load quizzes: ${error.message}`);
    const summaries = await Promise.all((data ?? []).map(async (row) => {
      const { data: attempts } = await this.supabase.admin.from('quiz_attempts').select('percent,passed,submitted_at').eq('quiz_id', row.id).eq('user_id', user.id).order('submitted_at', { ascending: false }).limit(50);
      const completed = (attempts ?? []).filter((attempt) => attempt.submitted_at);
      const best = completed.reduce<number | null>((value, attempt) => Math.max(value ?? 0, numberValue(attempt.percent)), null);
      return quizSummarySchema.parse({
        id: row.id,
        courseId: row.course_id,
        title: row.title,
        examPhase: row.exam_phase,
        questionCount: row.question_count,
        totalPoints: numberValue(row.total_points),
        timeLimitSeconds: row.time_limit_seconds,
        passPercent: numberValue(row.pass_percent),
        maxAttempts: row.max_attempts,
        isAiGenerated: row.is_ai_generated,
        courseName: 'Course',
        attemptsUsed: completed.length,
        bestPercent: best,
        lastAttemptAt: completed[0]?.submitted_at ?? null,
        isPassed: completed.some((attempt) => attempt.passed === true),
      });
    }));
    return summaries;
  }

  async start(quizId: string, user: AuthenticatedUser): Promise<StartAttemptResponse> {
    if (!user.universityId) throw new ForbiddenException('University membership required');
    const { data: quiz, error: quizError } = await this.supabase.admin.from('quizzes').select('*').eq('id', quizId).eq('university_id', user.universityId).eq('state', 'published').maybeSingle();
    if (quizError || !quiz) throw new NotFoundException('Quiz not found');
    const versionId = quiz.published_version_id as string | null;
    if (!versionId) throw new NotFoundException('Quiz version is not published');
    const { data: version } = await this.supabase.admin.from('quiz_versions').select('id').eq('id', versionId).eq('quiz_id', quizId).maybeSingle();
    if (!version) throw new NotFoundException('Quiz version not found');
    const { count } = await this.supabase.admin.from('quiz_attempts').select('id', { count: 'exact', head: true }).eq('quiz_id', quizId).eq('user_id', user.id);
    const attemptNumber = (count ?? 0) + 1;
    if (quiz.max_attempts && attemptNumber > Number(quiz.max_attempts)) throw new ForbiddenException('Maximum quiz attempts reached');
    const { data: attempt, error: attemptError } = await this.supabase.admin.from('quiz_attempts').insert({ quiz_id: quizId, quiz_version_id: versionId, user_id: user.id, attempt_number: attemptNumber, status: 'in_progress' }).select('id,started_at').single();
    if (attemptError || !attempt) throw new Error(`Unable to start quiz: ${attemptError?.message ?? 'no attempt'}`);

    const { data: questions, error: questionError } = await this.supabase.admin.from('quiz_questions').select('id,question_type,prompt,image_url,points,sort_order,required_selections,quiz_options(id,text,image_url,sort_order)').eq('quiz_version_id', versionId).order('sort_order', { ascending: true });
    if (questionError) throw new Error(`Unable to load quiz questions: ${questionError.message}`);
    const safeQuestions = (questions ?? []).map((question) => quizQuestionSchema.parse({
      id: question.id,
      type: question.question_type,
      prompt: question.prompt,
      imageUrl: question.image_url,
      points: Math.max(1, Math.round(numberValue(question.points))),
      sortOrder: question.sort_order,
      options: (Array.isArray(question.quiz_options) ? question.quiz_options : []).map((option: DbRow) => ({ id: option.id, text: option.text, imageUrl: option.image_url, sortOrder: option.sort_order })),
      requiredSelections: question.required_selections,
    }));
    const startedAt = new Date(attempt.started_at as string);
    const expiresAt = quiz.time_limit_seconds ? new Date(startedAt.getTime() + Number(quiz.time_limit_seconds) * 1000).toISOString() : null;
    const tokenPayload: QuizAttemptTokenPayload = { attemptId: attempt.id, userId: user.id, quizId, quizVersionId: versionId };
    const attemptToken = await this.tokens.issue(tokenPayload);
    return startAttemptResponseSchema.parse({ attemptId: attempt.id, quizId, quizVersionId: versionId, attemptToken, title: quiz.title, questions: safeQuestions, totalPoints: Math.round(numberValue(quiz.total_points)), timeLimitSeconds: quiz.time_limit_seconds, expiresAt, startedAt: attempt.started_at, savedAnswers: {} });
  }

  async autosave(attemptId: string, body: { attemptToken: string; answers: AnswerInput[] }, user: AuthenticatedUser) {
    const claims = await this.verifyAttempt(attemptId, body.attemptToken, user);
    for (const answer of body.answers) {
      const { error } = await this.supabase.admin.from('quiz_attempt_answers').upsert({ attempt_id: claims.attemptId, question_id: answer.questionId, selected_option_ids: answer.optionIds, short_answer: answer.text, saved_at: new Date().toISOString() }, { onConflict: 'attempt_id,question_id' });
      if (error) throw new Error(`Unable to autosave answer: ${error.message}`);
    }
    return { saved: body.answers.length, savedAt: new Date().toISOString() };
  }

  async submit(attemptId: string, body: { attemptToken: string; answers: AnswerInput[] }, user: AuthenticatedUser): Promise<AttemptResult> {
    const claims = await this.verifyAttempt(attemptId, body.attemptToken, user);
    const { data: attempt, error: attemptError } = await this.supabase.admin.from('quiz_attempts').select('id,quiz_id,quiz_version_id,status,started_at').eq('id', claims.attemptId).eq('user_id', user.id).maybeSingle();
    if (attemptError || !attempt) throw new NotFoundException('Attempt not found');
    if (attempt.status !== 'in_progress') throw new ForbiddenException('Attempt has already been submitted');
    const { data: quiz } = await this.supabase.admin.from('quizzes').select('pass_percent,show_answers_after_submit').eq('id', attempt.quiz_id).maybeSingle();
    const { data: questions, error: questionError } = await this.supabase.admin.from('quiz_questions').select('id,question_type,points,answer_key,explanation,quiz_options(id,is_correct)').eq('quiz_version_id', attempt.quiz_version_id).order('sort_order', { ascending: true });
    if (questionError || !questions) throw new Error(`Unable to load answer keys: ${questionError?.message ?? 'no questions'}`);
    const inputByQuestion = new Map(body.answers.map((answer) => [answer.questionId, answer]));
    const results = questions.map((question) => {
      const input = inputByQuestion.get(question.id) ?? { questionId: question.id, optionIds: [], text: null };
      const options = Array.isArray(question.quiz_options) ? question.quiz_options : [];
      const correctOptionIds = options.filter((option: DbRow) => option.is_correct === true).map((option: DbRow) => text(option.id));
      const selected = input.optionIds;
      const key = jsonObject(question.answer_key);
      const accepted = Array.isArray(key.correctShortAnswers) ? key.correctShortAnswers.map((value) => text(value).trim().toLocaleLowerCase()) : [];
      const isCorrect = question.question_type === 'short_answer' ? accepted.includes(text(input.text).trim().toLocaleLowerCase()) : sameIds([...selected].sort(), [...correctOptionIds].sort());
      const pointsPossible = Math.max(1, Math.round(numberValue(question.points)));
      const pointsEarned = isCorrect ? pointsPossible : 0;
      return { questionId: question.id, isCorrect, pointsEarned, pointsPossible, selectedOptionIds: selected, correctOptionIds, correctShortAnswers: accepted, explanation: quiz?.show_answers_after_submit ? text(jsonObject(question.explanation).en ?? jsonObject(question.explanation).ar) || null : null };
    });
    for (const result of results) {
      const input = inputByQuestion.get(result.questionId) ?? { questionId: result.questionId, optionIds: [], text: null };
      await this.supabase.admin.from('quiz_attempt_answers').upsert({ attempt_id: attempt.id, question_id: result.questionId, selected_option_ids: input.optionIds, short_answer: input.text, awarded_points: result.pointsEarned, is_correct: result.isCorrect, feedback: { explanation: result.explanation }, saved_at: new Date().toISOString() }, { onConflict: 'attempt_id,question_id' });
    }
    const score = results.reduce((total, result) => total + result.pointsEarned, 0);
    const totalPoints = results.reduce((total, result) => total + result.pointsPossible, 0);
    const percent = totalPoints ? Math.round((score / totalPoints) * 10000) / 100 : 0;
    const isPassed = percent >= numberValue(quiz?.pass_percent ?? 60);
    const submittedAt = new Date();
    const { error: updateError } = await this.supabase.admin.from('quiz_attempts').update({ status: 'submitted', score, percent, passed: isPassed, submitted_at: submittedAt.toISOString() }).eq('id', attempt.id);
    if (updateError) throw new Error(`Unable to submit attempt: ${updateError.message}`);
    const pointsAwarded = isPassed ? await this.awardPoints(user, attempt.quiz_id, attempt.id) : 0;
    return attemptResultSchema.parse({ attemptId: attempt.id, quizId: attempt.quiz_id, quizVersionId: attempt.quiz_version_id, status: 'submitted', score, totalPoints, percent, isPassed, durationSeconds: Math.max(0, Math.round((submittedAt.getTime() - new Date(attempt.started_at as string).getTime()) / 1000)), submittedAt: submittedAt.toISOString(), pointsAwarded, newBadges: [], answers: results });
  }

  private async verifyAttempt(attemptId: string, token: string, user: AuthenticatedUser): Promise<QuizAttemptTokenPayload> {
    const claims = await this.tokens.verify(token);
    if (claims.attemptId !== attemptId || claims.userId !== user.id) throw new ForbiddenException('Attempt token mismatch');
    return claims;
  }

  private async awardPoints(user: AuthenticatedUser, quizId: string, attemptId: string) {
    if (!user.universityId) return 0;
    const { data: rule } = await this.supabase.admin.from('reward_rules').select('points').eq('university_id', user.universityId).eq('event_key', 'quiz_passed').eq('is_active', true).maybeSingle();
    const points = Number(rule?.points ?? 0);
    if (!points) return 0;
    const { error } = await this.supabase.admin.from('points_ledger').insert({ university_id: user.universityId, user_id: user.id, event_key: 'quiz_passed', points, idempotency_key: `quiz:${attemptId}:passed`, source_id: quizId, metadata: { quizId, attemptId } });
    return error && !error.message.toLowerCase().includes('duplicate') ? 0 : points;
  }
}
