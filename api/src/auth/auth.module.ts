import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GoogleStrategy } from './google/google.strategy';
import { GoogleOAuthStateService } from './google/google-oauth-state.service';
import { GoogleAuthGuard, GoogleCallbackGuard } from './google/google-auth.guard';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: Number(
            configService.get<string>('JWT_EXPIRES_IN', '3600'),
          ),
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    GoogleOAuthStateService,
    GoogleAuthGuard,
    GoogleCallbackGuard,
  ],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
