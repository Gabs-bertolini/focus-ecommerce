import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Public()
  async login(@Body() signInDto: Record<string, any>) {
    const { email, password } = signInDto;
    return this.authService.login(email, password);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Public()
  async register(@Body() registerDto: Record<string, any>) {
    const { email, password } = registerDto;
    return this.authService.register({ email, password });
  }
}