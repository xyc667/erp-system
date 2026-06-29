import { Body, Controller, Get, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Request() req: { ip?: string; headers: Record<string, string> }) {
    return this.authService.login(loginDto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Post('refresh')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refresh_token);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: { user: { userId: string } }) {
    return this.authService.getProfile(req.user.userId);
  }

  @Patch('me/preferences')
  @UseGuards(JwtAuthGuard)
  async updatePreferences(
    @Request() req: { user: { userId: string } },
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.authService.updatePreferences(req.user.userId, dto);
  }
}