import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { AppConfig } from '../config/app-config';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    config: ConfigService<AppConfig, true>,
    private readonly authService: AuthService,
  ) {
    const google = config.get('google', { infer: true });
    super({
      clientID: google.clientId,
      clientSecret: google.clientSecret,
      callbackURL: `${config.get('apiUrl', { infer: true })}/api/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  async validate(_accessToken: string, _refreshToken: string, profile: Profile) {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      throw new Error('Google account did not return an email address');
    }

    return this.authService.upsertGoogleUser({
      googleId: profile.id,
      email,
      name: profile.displayName || email.split('@')[0],
      avatarUrl: profile.photos?.[0]?.value ?? null,
    });
  }
}
