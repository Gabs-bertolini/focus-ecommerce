import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import {
  GoogleAuthGuard,
  GoogleCallbackGuard,
} from '../src/auth/google/google-auth.guard';
import { GoogleOAuthStateService } from '../src/auth/google/google-oauth-state.service';
import { jest } from '@jest/globals';

describe('Google OAuth callback (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const callbackGuard = {
      canActivate: (context: {
        switchToHttp: () => {
          getRequest: () => { user?: unknown };
        };
      }) => {
        context.switchToHttp().getRequest().user = {
          googleId: 'google-123',
          email: 'customer@example.com',
          emailVerified: true,
        };
        return true;
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            loginWithGoogle: jest
              .fn()
              .mockResolvedValue({ access_token: 'test-jwt' }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: (_key: string, fallback?: string) => fallback,
            getOrThrow: (key: string) =>
              key === 'FRONTEND_URL' ? 'http://localhost:3000' : undefined,
          },
        },
        { provide: GoogleOAuthStateService, useValue: {} },
        GoogleAuthGuard,
        GoogleCallbackGuard,
      ],
    })
      .overrideGuard(GoogleAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GoogleCallbackGuard)
      .useValue(callbackGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('sets an HttpOnly JWT cookie and redirects to the frontend store', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/google/callback')
      .expect(302);

    expect(response.headers.location).toBe('http://localhost:3000/store');
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining('focus_access_token=test-jwt'),
        expect.stringContaining('HttpOnly'),
        expect.stringContaining('SameSite=Lax'),
      ]),
    );
  });
});
