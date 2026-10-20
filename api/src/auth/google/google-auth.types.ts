export interface GoogleIdentity {
  googleId: string;
  email: string;
  emailVerified: boolean;
}

export interface GoogleAuthRequest {
  cookies?: Record<string, string>;
  query: Record<string, string | string[] | undefined>;
  user?: GoogleIdentity;
  googleOAuthState?: string;
  googleAuthError?: string;
}
