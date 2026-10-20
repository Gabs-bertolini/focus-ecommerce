export type GoogleLoginErrorCode =
  'email_not_verified' | 'admin_account' | 'google_account_conflict';

export class GoogleLoginError extends Error {
  constructor(readonly code: GoogleLoginErrorCode) {
    super(code);
    this.name = GoogleLoginError.name;
  }
}
