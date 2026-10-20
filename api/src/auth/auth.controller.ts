import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Req,
  Res,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import {
  GoogleAuthGuard,
  GoogleCallbackGuard,
} from './google/google-auth.guard';
import { GoogleIdentity } from './google/google-auth.types';
import { GoogleLoginError } from './google/google-login.error';
import { JwtAuthGuard } from './jwt/jwt.guard';
import {
  ACCESS_TOKEN_COOKIE,
  accessTokenClearCookieOptions,
  accessTokenCookieOptions,
} from './auth-cookies';

type GoogleCallbackRequest = Request & {
  user?: GoogleIdentity;
  googleAuthError?: string;
};

type PasswordCredentials = { email: string; password: string };

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Public()
  async login(
    @Body() signInDto: PasswordCredentials,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { email, password } = signInDto;
    const result = await this.authService.login(email, password);
    response.cookie(
      ACCESS_TOKEN_COOKIE,
      result.access_token,
      accessTokenCookieOptions(this.configService),
    );
    return result;
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Public()
  async register(@Body() registerDto: PasswordCredentials) {
    const { email, password } = registerDto;
    return this.authService.register({ email, password });
  }

  @Get('google')
  @Public()
  @UseGuards(GoogleAuthGuard)
  googleLogin(): void {}

  @Get('google/callback')
  @Public()
  @UseGuards(GoogleCallbackGuard)
  async googleCallback(
    @Req() request: GoogleCallbackRequest,
    @Res() response: Response,
  ): Promise<void> {
    if (request.googleAuthError || !request.user) {
      this.redirectToLogin(
        response,
        request.googleAuthError === 'invalid_oauth_state'
          ? 'invalid_oauth_state'
          : 'google_login_failed',
      );
      return;
    }

    try {
      const result = await this.authService.loginWithGoogle(request.user);
      response.cookie(
        ACCESS_TOKEN_COOKIE,
        result.access_token,
        accessTokenCookieOptions(this.configService),
      );
      response.redirect(this.frontendUrl('/store'));
    } catch (error) {
      if (error instanceof GoogleLoginError) {
        this.redirectToLogin(response, error.code);
        return;
      }

      this.logger.error(
        `Google OAuth callback failed (${error instanceof Error ? error.name : 'unknown error'})`,
      );
      this.redirectToLogin(response, 'google_login_failed');
    }
  }

  @Get('session')
  @UseGuards(JwtAuthGuard)
  session(@Req() request: Request & { user: { role: string } }) {
    return { role: request.user.role };
  }

  private redirectToLogin(response: Response, errorCode: string): void {
    response.clearCookie(
      ACCESS_TOKEN_COOKIE,
      accessTokenClearCookieOptions(this.configService),
    );
    const loginUrl = new URL(this.frontendUrl('/login'));
    loginUrl.searchParams.set('error', errorCode);
    response.redirect(loginUrl.toString());
  }

  private frontendUrl(path: string): string {
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    return new URL(path, frontendUrl).toString();
  }
}
