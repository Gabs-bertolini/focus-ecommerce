import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  function createGuard(requiredRoles: string[] | undefined) {
    const reflector = {
      getAllAndOverride: () => requiredRoles,
    } as unknown as Reflector;
    return new RolesGuard(reflector);
  }

  function createContext(role?: string): ExecutionContext {
    return {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({
        getRequest: () => ({ user: role ? { role } : undefined }),
      }),
    } as unknown as ExecutionContext;
  }

  it('allows the request when no role is required', () => {
    expect(createGuard(undefined).canActivate(createContext('customer'))).toBe(
      true,
    );
  });

  it('allows a customer on customer-only endpoints', () => {
    expect(
      createGuard(['customer']).canActivate(createContext('customer')),
    ).toBe(true);
  });

  it('denies a customer on admin-only endpoints', () => {
    expect(createGuard(['admin']).canActivate(createContext('customer'))).toBe(
      false,
    );
  });

  it('denies requests without a role when a role is required', () => {
    expect(createGuard(['admin']).canActivate(createContext())).toBe(false);
  });
});
