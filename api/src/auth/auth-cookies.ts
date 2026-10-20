import { ConfigService } from '@nestjs/config';
import type { CookieOptions } from 'express';

export const ACCESS_TOKEN_COOKIE = 'focus_access_token';
export const GOOGLE_STATE_COOKIE = 'focus_google_oauth_state';
export const GOOGLE_CALLBACK_COOKIE_PATH = '/api/auth/google/callback';

export function accessTokenCookieOptions(
  configService: ConfigService,
): CookieOptions {
  return {
    httpOnly: true,
    secure: configService.get<string>('NODE_ENV') === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Number(configService.get<string>('JWT_EXPIRES_IN', '3600')) * 1000,
  };
}

export function googleStateCookieOptions(
  configService: ConfigService,
): CookieOptions {
  return {
    httpOnly: true,
    secure: configService.get<string>('NODE_ENV') === 'production',
    sameSite: 'lax',
    path: GOOGLE_CALLBACK_COOKIE_PATH,
    maxAge: 5 * 60 * 1000,
  };
}

export function googleStateClearCookieOptions(
  configService: ConfigService,
): CookieOptions {
  const { httpOnly, secure, sameSite, path } =
    googleStateCookieOptions(configService);
  return { httpOnly, secure, sameSite, path };
}

export function accessTokenClearCookieOptions(
  configService: ConfigService,
): CookieOptions {
  const { httpOnly, secure, sameSite, path } =
    accessTokenCookieOptions(configService);
  return { httpOnly, secure, sameSite, path };
}
