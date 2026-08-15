import { describe, expect, it } from 'vitest';
import { registerRequestSchema } from '@it-sum/shared';
import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
  it('accepts a valid registration payload and applies schema defaults', () => {
    const pipe = new ZodValidationPipe(registerRequestSchema);
    const result = pipe.transform({
      email: 'student@students.ctu.edu.eg',
      password: 'Study12345',
      fullName: 'Test Student',
      departmentId: null,
      batchLevel: null,
      acceptedTerms: true,
    }, { type: 'body' });

    expect(result.locale).toBe('ar');
  });

  it('throws a structured bad-request error for invalid credentials', () => {
    const pipe = new ZodValidationPipe(registerRequestSchema);
    expect(() => pipe.transform({ email: 'not-an-email', password: 'short' }, { type: 'body' })).toThrow(/validation failed/i);
  });
});
