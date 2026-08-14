import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppConfig } from '../config/app-config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './google.strategy';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [ConfigModule, PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    {
      // Constructing the strategy without credentials throws, so it is built
      // only when Google is configured. This has to be decided here rather than
      // from process.env at import time: module files are evaluated before
      // ConfigModule has read .env, which would leave the strategy unregistered
      // while /auth/providers still advertised the button.
      provide: GoogleStrategy,
      inject: [ConfigService, AuthService],
      useFactory: (
        config: ConfigService<AppConfig, true>,
        authService: AuthService,
      ) =>
        config.get('google', { infer: true }).clientId
          ? new GoogleStrategy(config, authService)
          : null,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
