import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { AuthSession, AuthUser } from '@dealroom/shared';
import { hashPassword, verifyPassword } from '../common/password.util';
import { AppConfig } from '../config/app-config';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

interface GoogleIdentity {
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async register(dto: RegisterDto): Promise<AuthSession> {
    const email = dto.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('An account with that email already exists');
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        name: dto.name.trim(),
        passwordHash: await hashPassword(dto.password),
      },
    });

    return this.issueSession(user);
  }

  async login(dto: LoginDto): Promise<AuthSession> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user?.passwordHash) {
      throw new UnauthorizedException('Incorrect email or password');
    }

    const valid = await verifyPassword(user.passwordHash, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Incorrect email or password');
    }

    return this.issueSession(user);
  }

  async upsertGoogleUser(identity: GoogleIdentity): Promise<AuthSession> {
    const email = identity.email.toLowerCase();
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ googleId: identity.googleId }, { email }] },
    });

    const user = existing
      ? await this.prisma.user.update({
          where: { id: existing.id },
          data: {
            googleId: identity.googleId,
            avatarUrl: existing.avatarUrl ?? identity.avatarUrl,
          },
        })
      : await this.prisma.user.create({
          data: {
            email,
            name: identity.name,
            googleId: identity.googleId,
            avatarUrl: identity.avatarUrl,
          },
        });

    return this.issueSession(user);
  }

  async findById(id: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id } });
    return this.toAuthUser(user);
  }

  private issueSession(user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  }): AuthSession {
    const jwtConfig = this.config.get('jwt', { infer: true });
    const token = this.jwt.sign(
      { sub: user.id, email: user.email },
      {
        secret: jwtConfig.secret,
        expiresIn: jwtConfig.expiresIn as `${number}${'d' | 'h' | 'm' | 's'}`,
      },
    );

    return { token, user: this.toAuthUser(user) };
  }

  private toAuthUser(user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    };
  }
}
