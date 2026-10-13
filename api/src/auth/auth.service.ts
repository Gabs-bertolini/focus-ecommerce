import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { GoogleIdentity } from './google/google-auth.types';
import { GoogleLoginError } from './google/google-login.error';

type AuthenticatedUser = Pick<User, 'id' | 'email' | 'isAdmin'>;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    pass: string,
  ): Promise<AuthenticatedUser | null> {
    const user = await this.usersService.validateUser(email, pass);
    if (user) {
      return { id: user.id, email: user.email, isAdmin: user.isAdmin };
    }
    return null;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueToken(user);
  }

  async loginWithGoogle(identity: GoogleIdentity) {
    const email = identity.email.trim().toLowerCase();
    if (!identity.emailVerified || !email) {
      throw new GoogleLoginError('email_not_verified');
    }

    let user = await this.usersService.findByGoogleId(identity.googleId);
    if (user) {
      if (user.isAdmin) {
        throw new GoogleLoginError('admin_account');
      }
      return this.issueToken(user);
    }

    user = await this.usersService.findByEmail(email);
    if (user) {
      if (user.isAdmin) {
        throw new GoogleLoginError('admin_account');
      }
      if (user.googleId && user.googleId !== identity.googleId) {
        throw new GoogleLoginError('google_account_conflict');
      }

      if (!user.googleId) {
        user = await this.usersService.linkGoogleAccount(
          user.id,
          identity.googleId,
        );
      }
      return this.issueToken(user);
    }

    user = await this.usersService.createGoogleCustomer(
      email,
      identity.googleId,
    );
    return this.issueToken(user);
  }

  async register(dto: { email: string; password: string }) {
    const { email, password } = dto;
    // Check if user already exists
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new Error('User already exists');
    }
    const user = await this.usersService.create(email, password, false);
    // Return user without password
    return { id: user.id, email: user.email, isAdmin: user.isAdmin };
  }

  private issueToken(user: AuthenticatedUser) {
    const isAdmin = user.isAdmin;
    const payload = {
      email: user.email,
      sub: user.id,
      isAdmin,
      role: isAdmin ? 'admin' : 'customer',
    };
    return { access_token: this.jwtService.sign(payload) };
  }
}
