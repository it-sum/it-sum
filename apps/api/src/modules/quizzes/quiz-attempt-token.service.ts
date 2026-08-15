import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SignJWT, jwtVerify } from 'jose';
import { requireEnv } from '../../common/config/env';

export interface QuizAttemptTokenPayload {
  attemptId: string;
  userId: string;
  quizId: string;
  quizVersionId: string;
}

@Injectable()
export class QuizAttemptTokenService {
  private key() {
    return new TextEncoder().encode(requireEnv('QUIZ_ATTEMPT_SECRET'));
  }

  issue(payload: QuizAttemptTokenPayload) {
    return new SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256', typ: 'IT-SUM-QUIZ' })
      .setSubject(payload.attemptId)
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(this.key());
  }

  async verify(token: string): Promise<QuizAttemptTokenPayload> {
    try {
      const { payload } = await jwtVerify(token, this.key(), { algorithms: ['HS256'] });
      if (typeof payload.attemptId !== 'string' || typeof payload.userId !== 'string' || typeof payload.quizId !== 'string' || typeof payload.quizVersionId !== 'string') throw new Error('Invalid quiz claims');
      return { attemptId: payload.attemptId, userId: payload.userId, quizId: payload.quizId, quizVersionId: payload.quizVersionId };
    } catch {
      throw new UnauthorizedException('Invalid or expired quiz attempt token');
    }
  }
}
