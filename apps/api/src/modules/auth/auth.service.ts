import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import {
  currentUserSchema,
  defaultUserPreferences,
  type CurrentUser,
  type LoginRequest,
  type RegisterRequest,
  type Session,
} from '@it-sum/shared';
import { type SupabaseService } from '../../common/supabase/supabase.service';

@Injectable()
export class AuthService {
  constructor(private readonly supabase: SupabaseService) {}

  async register(input: RegisterRequest) {
    const { data, error } = await this.supabase.admin.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          full_name: input.fullName,
          department_id: input.departmentId,
          batch_level: input.batchLevel,
          locale: input.locale,
        },
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes('already')) throw new ConflictException('Email already registered');
      throw new ConflictException(error.message);
    }
    if (!data.user) throw new ConflictException('Registration did not create a user');

    return {
      userId: data.user.id,
      status: 'pending' as const,
      requiresEmailVerification: data.session == null,
      requiresAdminApproval: true,
    };
  }

  async login(input: LoginRequest): Promise<Session> {
    const { data, error } = await this.supabase.admin.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });
    if (error || !data.session || !data.user) throw new UnauthorizedException('Invalid credentials');

    const user = await this.loadCurrentUser(data.user.id, data.user.email ?? input.email, data.user.email_confirmed_at != null);
    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: new Date((data.session.expires_at ?? Math.floor(Date.now() / 1000) + 3600) * 1000).toISOString(),
      tokenType: 'bearer',
      user,
    };
  }

  async refresh(refreshToken: string): Promise<Session> {
    const { data, error } = await this.supabase.admin.auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session || !data.user) throw new UnauthorizedException('Invalid refresh token');
    const user = await this.loadCurrentUser(data.user.id, data.user.email ?? '', data.user.email_confirmed_at != null);
    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: new Date((data.session.expires_at ?? Math.floor(Date.now() / 1000) + 3600) * 1000).toISOString(),
      tokenType: 'bearer',
      user,
    };
  }

  async me(userId: string): Promise<CurrentUser> {
    const { data, error } = await this.supabase.admin.auth.admin.getUserById(userId);
    if (error || !data.user) throw new UnauthorizedException('User no longer exists');
    return this.loadCurrentUser(userId, data.user.email ?? '', data.user.email_confirmed_at != null);
  }

  private async loadCurrentUser(userId: string, email: string, emailVerified: boolean): Promise<CurrentUser> {
    const { data: profile, error } = await this.supabase.admin
      .from('profiles')
      .select('id,email,full_name,display_name,avatar_url,role,approval_status,university_id,department_id,batch_level,created_at,last_seen_at')
      .eq('id', userId)
      .maybeSingle();
    if (error || !profile) throw new UnauthorizedException('Profile is not available');

    const { data: preferences } = await this.supabase.admin
      .from('user_preferences')
      .select('locale,theme,leaderboard_visibility,reminders_enabled,ai_enabled')
      .eq('user_id', userId)
      .maybeSingle();

    const mapped = {
      id: profile.id,
      email: profile.email || email,
      fullName: profile.full_name,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
      role: profile.role,
      status: profile.approval_status,
      universityId: profile.university_id,
      departmentId: profile.department_id,
      batchLevel: profile.batch_level,
      preferences: {
        locale: preferences?.locale ?? defaultUserPreferences.locale,
        theme: preferences?.theme ?? defaultUserPreferences.theme,
        leaderboardVisibility: preferences?.leaderboard_visibility === 'full' ? 'full_name' : preferences?.leaderboard_visibility === 'hidden' ? 'hidden' : preferences?.leaderboard_visibility === 'anonymous' ? 'anonymous' : 'partial_name',
        emailNotifications: true,
        progressReminders: preferences?.reminders_enabled ?? defaultUserPreferences.progressReminders,
        reduceMotion: defaultUserPreferences.reduceMotion,
      },
      emailVerified,
      createdAt: profile.created_at,
      lastSeenAt: profile.last_seen_at,
    } satisfies CurrentUser;

    return currentUserSchema.parse(mapped);
  }
}
