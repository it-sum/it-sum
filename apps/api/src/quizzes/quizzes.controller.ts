import { Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Post, Query } from "@nestjs/common";
import { createHash, randomUUID } from "node:crypto";
import {
  QuizDetailResponseSchema,
  QuizListQuerySchema,
  QuizListResponseSchema,
  QuizAttemptResultSchema,
  StartQuizAttemptResponseSchema,
  SubmitQuizAttemptRequestSchema,
  type QuizAttemptResult,
  type QuizDetailResponse,
  type QuizListResponse,
  type StartQuizAttemptResponse,
  type SubmitQuizAttemptRequest,
} from "@it-sum/shared";
import { CurrentUser } from "../auth/current-user.decorator.js";
import type { AuthUser } from "../auth/auth.types.js";
import { SupabaseService } from "../common/supabase.service.js";

@Controller("quizzes")
export class QuizzesController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get()
  async list(@CurrentUser() user: AuthUser, @Query() query: unknown): Promise<QuizListResponse> {
    const input = QuizListQuerySchema.parse(query);
    const client = this.supabase.requireClient();
    const from = (input.page - 1) * input.pageSize;
    const to = from + input.pageSize - 1;

    let request = client
      .from("quizzes")
      .select("id, university_id, course_id, title, status, current_version_id, created_at, updated_at", { count: "exact" })
      .eq("university_id", user.universityId)
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .range(from, to);

    if (input.courseId) request = request.eq("course_id", input.courseId);
    const { data, error, count } = await request;
    if (error) throw error;

    return QuizListResponseSchema.parse({
      data: (data ?? []).map((row) => ({
        id: row.id,
        universityId: row.university_id,
        courseId: row.course_id,
        title: row.title,
        status: row.status,
        currentVersionId: row.current_version_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      page: input.page,
      pageSize: input.pageSize,
      total: count ?? 0,
    });
  }

  @Get(":id")
  async detail(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string): Promise<QuizDetailResponse> {
    const client = this.supabase.requireClient();
    const { data: quiz, error: quizError } = await client
      .from("quizzes")
      .select("id, university_id, course_id, title, status, current_version_id, created_at, updated_at")
      .eq("id", id)
      .eq("university_id", user.universityId)
      .eq("status", "published")
      .maybeSingle();

    if (quizError) throw quizError;
    if (!quiz?.current_version_id) throw new NotFoundException("Published quiz was not found");

    const { data: questions, error: questionsError } = await client
      .from("questions")
      .select("id, position, prompt, explanation, points, options(id, position, label)")
      .eq("quiz_version_id", quiz.current_version_id)
      .order("position");

    if (questionsError) throw questionsError;

    return QuizDetailResponseSchema.parse({
      id: quiz.id,
      universityId: quiz.university_id,
      courseId: quiz.course_id,
      title: quiz.title,
      status: quiz.status,
      currentVersionId: quiz.current_version_id,
      createdAt: quiz.created_at,
      updatedAt: quiz.updated_at,
      questions: (questions ?? []).map((question) => ({
        id: question.id,
        position: question.position,
        prompt: question.prompt,
        explanation: question.explanation,
        points: question.points,
        options: (question.options ?? []).map((option) => ({
          id: option.id,
          position: option.position,
          label: option.label,
        })),
      })),
    });
  }

  @Post(":id/attempts")
  async startAttempt(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string): Promise<StartQuizAttemptResponse> {
    const client = this.supabase.requireClient();
    const { data: quiz, error: quizError } = await client
      .from("quizzes")
      .select("id, current_version_id")
      .eq("id", id)
      .eq("university_id", user.universityId)
      .eq("status", "published")
      .maybeSingle();

    if (quizError) throw quizError;
    if (!quiz?.current_version_id) throw new NotFoundException("Published quiz was not found");

    const attemptToken = randomUUID();
    const { data, error } = await client
      .from("attempts")
      .insert({
        university_id: user.universityId,
        quiz_id: quiz.id,
        quiz_version_id: quiz.current_version_id,
        user_id: user.sub,
        attempt_token_hash: createHash("sha256").update(attemptToken).digest("hex"),
      })
      .select("id, quiz_id, quiz_version_id, status, created_at")
      .single();

    if (error) throw error;
    return StartQuizAttemptResponseSchema.parse({
      attemptId: data.id,
      quizId: data.quiz_id,
      quizVersionId: data.quiz_version_id,
      status: data.status,
      createdAt: data.created_at,
    });
  }

  @Post("attempts/:attemptId/submit")
  async submitAttempt(
    @CurrentUser() user: AuthUser,
    @Param("attemptId", ParseUUIDPipe) attemptId: string,
    @Body() body: SubmitQuizAttemptRequest,
  ): Promise<QuizAttemptResult> {
    const input = SubmitQuizAttemptRequestSchema.parse(body);
    const client = this.supabase.requireClient();
    const { data: attempt, error: attemptError } = await client
      .from("attempts")
      .select("id, quiz_id, quiz_version_id, status")
      .eq("id", attemptId)
      .eq("university_id", user.universityId)
      .eq("user_id", user.sub)
      .maybeSingle();

    if (attemptError) throw attemptError;
    if (!attempt) throw new NotFoundException("Quiz attempt was not found");

    const { data: questions, error: questionsError } = await client
      .from("questions")
      .select("id, points, options(id, is_correct)")
      .eq("quiz_version_id", attempt.quiz_version_id);

    if (questionsError) throw questionsError;

    const answers = new Map(input.answers.map((answer) => [answer.questionId, answer.selectedOptionId]));
    let score = 0;
    let maxScore = 0;
    let correctCount = 0;
    const rows = (questions ?? []).map((question) => {
      maxScore += question.points;
      const selectedOptionId = answers.get(question.id) ?? null;
      const selected = (question.options ?? []).find((option) => option.id === selectedOptionId);
      const isCorrect = Boolean(selected?.is_correct);
      if (isCorrect) {
        score += question.points;
        correctCount += 1;
      }
      return {
        attempt_id: attempt.id,
        question_id: question.id,
        selected_option_id: selectedOptionId,
        is_correct: selectedOptionId ? isCorrect : null,
        answered_at: new Date().toISOString(),
      };
    });

    const { error: answersError } = await client.from("attempt_answers").upsert(rows);
    if (answersError) throw answersError;

    const submittedAt = new Date().toISOString();
    const { error: updateError } = await client
      .from("attempts")
      .update({ status: "submitted", score, submitted_at: submittedAt })
      .eq("id", attempt.id)
      .eq("university_id", user.universityId)
      .eq("user_id", user.sub);

    if (updateError) throw updateError;

    return QuizAttemptResultSchema.parse({
      attemptId: attempt.id,
      quizId: attempt.quiz_id,
      status: "submitted",
      score,
      maxScore,
      correctCount,
      totalQuestions: questions?.length ?? 0,
      submittedAt,
    });
  }
}
