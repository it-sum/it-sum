import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  loginRequestSchema,
  refreshRequestSchema,
  registerRequestSchema,
  type LoginRequest,
  type RefreshRequest,
  type RegisterRequest,
} from '@it-sum/shared';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { Public } from '../../common/auth/auth.decorators';
import type { AuthenticatedUser } from '../../common/auth/auth.types';
import { ZodValidationPipe } from '../../common/http/zod-validation.pipe';
import { type AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body(new ZodValidationPipe(registerRequestSchema)) input: RegisterRequest) {
    return this.authService.register(input);
  }

  @Public()
  @Post('login')
  login(@Body(new ZodValidationPipe(loginRequestSchema)) input: LoginRequest) {
    return this.authService.login(input);
  }

  @Public()
  @Post('refresh')
  refresh(@Body(new ZodValidationPipe(refreshRequestSchema)) input: RefreshRequest) {
    return this.authService.refresh(input.refreshToken);
  }

  @Get('me')
  me(@CurrentUser('id') userId: string) {
    return this.authService.me(userId);
  }

  @Get('claims')
  claims(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
