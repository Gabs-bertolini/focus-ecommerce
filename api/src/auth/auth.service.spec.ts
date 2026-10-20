import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { GoogleIdentity } from './google/google-auth.types';
import { GoogleLoginError } from './google/google-login.error';
import { jest } from '@jest/globals';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    findByGoogleId: jest.Mock;
    findByEmail: jest.Mock;
    createGoogleCustomer: jest.Mock;
    linkGoogleAccount: jest.Mock;
  };
  let jwtService: { sign: jest.Mock };

  beforeEach(() => {
    usersService = {
      findByGoogleId: jest.fn(),
      findByEmail: jest.fn(),
      createGoogleCustomer: jest.fn(),
      linkGoogleAccount: jest.fn(),
    };
    jwtService = { sign: jest.fn().mockReturnValue('signed-token') };
    service = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a customer and issues a customer JWT for a new Google account', async () => {
    const identity: GoogleIdentity = {
      googleId: 'google-123',
      email: 'new@example.com',
      emailVerified: true,
    };
    const customer = {
      id: 8,
      email: identity.email,
      isAdmin: false,
      password: null,
      googleId: identity.googleId,
    } as User;
    usersService.findByGoogleId.mockResolvedValue(null);
    usersService.findByEmail.mockResolvedValue(null);
    usersService.createGoogleCustomer.mockResolvedValue(customer);

    await expect(service.loginWithGoogle(identity)).resolves.toEqual({
      access_token: 'signed-token',
    });
    expect(usersService.createGoogleCustomer).toHaveBeenCalledWith(
      identity.email,
      identity.googleId,
    );
    expect(jwtService.sign).toHaveBeenCalledWith({
      email: identity.email,
      sub: customer.id,
      isAdmin: false,
      role: 'customer',
    });
  });

  it('links Google to an existing customer with a verified email', async () => {
    const identity: GoogleIdentity = {
      googleId: 'google-123',
      email: 'existing@example.com',
      emailVerified: true,
    };
    const existing = {
      id: 4,
      email: identity.email,
      isAdmin: false,
      password: 'hash',
      googleId: null,
    } as User;
    const linked = { ...existing, googleId: identity.googleId };
    usersService.findByGoogleId.mockResolvedValue(null);
    usersService.findByEmail.mockResolvedValue(existing);
    usersService.linkGoogleAccount.mockResolvedValue(linked);

    await expect(service.loginWithGoogle(identity)).resolves.toEqual({
      access_token: 'signed-token',
    });
    expect(usersService.linkGoogleAccount).toHaveBeenCalledWith(
      existing.id,
      identity.googleId,
    );
    expect(usersService.createGoogleCustomer).not.toHaveBeenCalled();
  });

  it('rejects an unverified Google email before looking up an account', async () => {
    await expect(
      service.loginWithGoogle({
        googleId: 'google-123',
        email: 'unverified@example.com',
        emailVerified: false,
      }),
    ).rejects.toEqual(new GoogleLoginError('email_not_verified'));
    expect(usersService.findByGoogleId).not.toHaveBeenCalled();
    expect(usersService.findByEmail).not.toHaveBeenCalled();
  });

  it('rejects a missing Google email before looking up an account', async () => {
    await expect(
      service.loginWithGoogle({
        googleId: 'google-123',
        email: '  ',
        emailVerified: true,
      }),
    ).rejects.toEqual(new GoogleLoginError('email_not_verified'));
    expect(usersService.findByGoogleId).not.toHaveBeenCalled();
    expect(usersService.findByEmail).not.toHaveBeenCalled();
  });

  it('rejects an existing admin account without linking Google', async () => {
    const admin = {
      id: 2,
      email: 'admin@example.com',
      isAdmin: true,
      password: 'hash',
      googleId: null,
    } as User;
    usersService.findByGoogleId.mockResolvedValue(null);
    usersService.findByEmail.mockResolvedValue(admin);

    await expect(
      service.loginWithGoogle({
        googleId: 'google-123',
        email: admin.email,
        emailVerified: true,
      }),
    ).rejects.toEqual(new GoogleLoginError('admin_account'));
    expect(usersService.linkGoogleAccount).not.toHaveBeenCalled();
    expect(usersService.createGoogleCustomer).not.toHaveBeenCalled();
  });
});
