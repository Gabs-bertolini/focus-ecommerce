import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { jest } from '@jest/globals';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects password login for an account without a password hash', async () => {
    const repository = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 1,
        email: 'google@example.com',
        password: null,
        isAdmin: false,
        googleId: 'google-123',
      }),
    };
    const usersService = new UsersService(
      repository as unknown as Repository<User>,
    );

    const validation = usersService.validateUser(
      'google@example.com',
      'any-password',
    );
    await expect(validation).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(validation).rejects.toThrow('Invalid email or password');
  });
});
