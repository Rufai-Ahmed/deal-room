import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AppConfig } from '../config/app-config';

export interface ViewSession {
  viewId: string;
  shareLinkId: string;
}

/// Heartbeats arrive from an unauthenticated page, so the view they update is
/// named by a signed token rather than a raw id. Without this any caller could
/// inflate another investor's engagement figures.
@Injectable()
export class ViewSessionService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  issue(session: ViewSession): string {
    return this.jwt.sign(session, {
      secret: this.secret,
      expiresIn: '12h',
    });
  }

  verify(token: string): ViewSession {
    try {
      const payload = this.jwt.verify<ViewSession>(token, {
        secret: this.secret,
      });
      return { viewId: payload.viewId, shareLinkId: payload.shareLinkId };
    } catch {
      throw new UnauthorizedException('Invalid or expired view session');
    }
  }

  tryVerify(token: string | undefined): ViewSession | null {
    if (!token) {
      return null;
    }
    try {
      return this.verify(token);
    } catch {
      return null;
    }
  }

  private get secret(): string {
    return this.config.get('jwt', { infer: true }).secret;
  }
}
