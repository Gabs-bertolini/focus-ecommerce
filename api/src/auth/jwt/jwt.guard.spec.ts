import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt.guard';

describe('JwtGuard', () => {
  it('should be defined', () => {
    const reflector = { getAllAndOverride: () => undefined } as unknown as Reflector;

    expect(new JwtAuthGuard(reflector)).toBeDefined();
  });
});
