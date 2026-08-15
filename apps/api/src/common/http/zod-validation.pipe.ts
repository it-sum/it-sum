import { BadRequestException, Injectable, type ArgumentMetadata, type PipeTransform } from '@nestjs/common';
import { type ZodType } from 'zod';

@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown, metadata: ArgumentMetadata): T {
    const parsed = this.schema.safeParse(value);
    if (parsed.success) return parsed.data;

    throw new BadRequestException({
      message: 'Request validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors,
      path: metadata.data,
    });
  }
}
