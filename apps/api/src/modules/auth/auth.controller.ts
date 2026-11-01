import { Controller, Post, Body, Get, Headers, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';

export class LoginDto {
  email: string;
  password: string;
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user profile and memberships' })
  async me(@Headers('x-user-id') userId: string) {
    if (!userId) {
      throw new UnauthorizedException('Missing authenticated user header');
    }
    return this.authService.getCurrentUser(userId);
  }
}
