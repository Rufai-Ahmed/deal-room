import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import type { AuthSession, AuthUser } from '@dealroom/shared';
import type { Request, Response } from 'express';
import { CurrentUser, type RequestUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { AppConfig } from '../config/app-config';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  @Get('providers')
  providers(): { google: boolean } {
    return { google: Boolean(this.config.get('google', { infer: true }).clientId) };
  }

  @Post('register')
  register(@Body() dto: RegisterDto): Promise<AuthSession> {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto): Promise<AuthSession> {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: RequestUser): Promise<AuthUser> {
    return this.authService.findById(user.id);
  }

  @UseGuards(AuthGuard('google'))
  @Get('google')
  google(): void {
    return;
  }

  @UseGuards(AuthGuard('google'))
  @Get('google/callback')
  googleCallback(@Req() req: Request, @Res() res: Response): void {
    const session = req.user as AuthSession;
    const webUrl = this.config.get('webUrl', { infer: true });
    res.redirect(`${webUrl}/auth/callback#token=${session.token}`);
  }
}
