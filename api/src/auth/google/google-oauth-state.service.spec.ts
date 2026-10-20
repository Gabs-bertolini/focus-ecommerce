import { ConfigService } from '@nestjs/config';
import { GoogleOAuthStateService } from './google-oauth-state.service';

describe('GoogleOAuthStateService', () => {
  const stateService = new GoogleOAuthStateService(
    new ConfigService({ JWT_SECRET: 'test-jwt-secret' }),
  );

  it('validates a signed state bound to the initiating browser', () => {
    const { state, nonce } = stateService.create();

    expect(stateService.isValid(state, nonce)).toBe(true);
    expect(stateService.isValid(state, 'different-browser')).toBe(false);
    expect(stateService.isValid(`${state}tampered`, nonce)).toBe(false);
  });
});
