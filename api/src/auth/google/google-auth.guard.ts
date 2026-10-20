import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import {
  GOOGLE_STATE_COOKIE,
  googleStateClearCookieOptions,
  googleStateCookieOptions,
} from '../auth-cookies';
import { GoogleAuthRequest } from './google-auth.types';
import { GoogleOAuthStateService } from './google-oauth-state.service';

@Injectable()
export class GoogleAuthGuard
  extends AuthGuard('google')
  implements CanActivate
{
  constructor(
    private readonly stateService: GoogleOAuthStateService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<Request & GoogleAuthRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    const { state, nonce } = this.stateService.create();

    request.googleOAuthState = state;
    response.cookie(
      GOOGLE_STATE_COOKIE,
      nonce,
      googleStateCookieOptions(this.configService),
    );

    return super.canActivate(context);
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<Request & GoogleAuthRequest>();
    return {
      scope: ['openid', 'email', 'profile'],
      state: request.googleOAuthState,
    };
  }
}

@Injectable()
export class GoogleCallbackGuard
  extends AuthGuard('google')
  implements CanActivate
{
  constructor(
    private readonly stateService: GoogleOAuthStateService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<Request & GoogleAuthRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    const stateValue: unknown = request.query.state;
    const cookieNonceValue: unknown = request.cookies?.[GOOGLE_STATE_COOKIE];

    response.clearCookie(
      GOOGLE_STATE_COOKIE,
      googleStateClearCookieOptions(this.configService),
    );

    if (
      typeof stateValue !== 'string' ||
      typeof cookieNonceValue !== 'string' ||
      !this.stateService.isValid(stateValue, cookieNonceValue)
    ) {
      request.googleAuthError = 'invalid_oauth_state';
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = GoogleAuthRequest['user']>(
    error: unknown,
    user: TUser,
    _info: unknown,
    context: ExecutionContext,
  ): TUser {
    if (error || !user) {
      const request = context
        .switchToHttp()
        .getRequest<Request & GoogleAuthRequest>();
      request.googleAuthError = 'google_login_failed';
      return null as TUser;
    }

    return user;
  }
}
