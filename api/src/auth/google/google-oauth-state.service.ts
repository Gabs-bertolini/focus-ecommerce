import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const STATE_TTL_SECONDS = 5 * 60;

@Injectable()
export class GoogleOAuthStateService {
  private readonly secret: string;

  constructor(configService: ConfigService) {
    this.secret = configService.getOrThrow<string>('JWT_SECRET');
    if (!this.secret.trim()) {
      throw new Error('[auth] JWT_SECRET must be configured for OAuth state');
    }
  }

  create(): { state: string; nonce: string } {
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = randomBytes(32).toString('base64url');
    const signedValue = `${timestamp}.${nonce}`;
    const signature = createHmac('sha256', this.secret)
      .update(signedValue)
      .digest('base64url');

    return { state: `${signedValue}.${signature}`, nonce };
  }

  isValid(state: string | undefined, cookieNonce: string | undefined): boolean {
    if (!state || !cookieNonce) {
      return false;
    }

    const [timestampValue, nonce, signature, ...extra] = state.split('.');
    if (!timestampValue || !nonce || !signature || extra.length > 0) {
      return false;
    }

    const timestamp = Number(timestampValue);
    const now = Math.floor(Date.now() / 1000);
    if (
      !Number.isInteger(timestamp) ||
      timestamp > now ||
      now - timestamp > STATE_TTL_SECONDS
    ) {
      return false;
    }

    const expectedSignature = createHmac('sha256', this.secret)
      .update(`${timestampValue}.${nonce}`)
      .digest();
    const providedSignature = Buffer.from(signature, 'base64url');
    const cookieValue = Buffer.from(cookieNonce);
    const stateNonce = Buffer.from(nonce);

    return (
      expectedSignature.length === providedSignature.length &&
      cookieValue.length === stateNonce.length &&
      timingSafeEqual(expectedSignature, providedSignature) &&
      timingSafeEqual(cookieValue, stateNonce)
    );
  }
}
