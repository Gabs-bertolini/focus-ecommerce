import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { GoogleIdentity } from './google-auth.types';

function requiredConfig(configService: ConfigService, key: string): string {
  const value = configService.get<string>(key);
  if (!value?.trim()) {
    throw new Error(
      `[auth] ${key} must be configured to enable Google sign-in`,
    );
  }
  return value.trim();
}

function requiredHttpUrl(configService: ConfigService, key: string): string {
  const value = requiredConfig(configService, key);
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error();
    }
  } catch {
    throw new Error(`[auth] ${key} must be an absolute HTTP(S) URL`);
  }
  return value;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    const frontendURL = new URL(requiredHttpUrl(configService, 'FRONTEND_URL'));
    const callbackURL = new URL(
      requiredHttpUrl(configService, 'GOOGLE_CALLBACK_URL'),
    );
    if (
      callbackURL.origin !== frontendURL.origin ||
      callbackURL.pathname !== '/api/auth/google/callback'
    ) {
      throw new Error(
        '[auth] GOOGLE_CALLBACK_URL must use the FRONTEND_URL origin and /api/auth/google/callback path',
      );
    }

    super({
      clientID: requiredConfig(configService, 'GOOGLE_CLIENT_ID'),
      clientSecret: requiredConfig(configService, 'GOOGLE_CLIENT_SECRET'),
      callbackURL: callbackURL.toString(),
      scope: ['openid', 'email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): GoogleIdentity {
    return {
      googleId: profile.id,
      email: profile._json.email ?? profile.emails?.[0]?.value ?? '',
      emailVerified: profile._json.email_verified === true,
    };
  }
}
