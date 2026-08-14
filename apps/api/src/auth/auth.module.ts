import { Module, Provider } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './google.strategy';
import { JwtStrategy } from './jwt.strategy';

/// Registering the Google strategy unconditionally would crash boot when the
/// OAuth credentials are absent, so environments without them simply run
/// password-only and /auth/providers tells the client which buttons to render.
const googleStrategy: Provider[] = process.env.GOOGLE_CLIENT_ID
  ? [GoogleStrategy]
  : [];

@Module({
  imports: [ConfigModule, PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, ...googleStrategy],
  exports: [AuthService],
})
export class AuthModule {}
