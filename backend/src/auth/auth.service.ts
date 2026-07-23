import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as argon2 from 'argon2';

import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './types/authenticated-user';

export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult extends AuthTokens {
  user: PublicUser;
}

/** Sélection Prisma sans champ sensible (jamais de hash dans les réponses). */
const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
} as const;

// Message volontairement générique : ne révèle pas si le compte existe (A07).
const INVALID_CREDENTIALS = 'Identifiants invalides.';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Un compte existe déjà avec cette adresse email.');
    }

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
      select: PUBLIC_USER_SELECT,
    });

    const tokens = await this.issueTokens(user);
    return { ...tokens, user };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      this.logger.warn(`Échec de connexion (compte inconnu) — email non journalisé`);
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) {
      this.logger.warn(`Échec de connexion (mot de passe) — utilisateur ${user.id}`);
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    const publicUser: PublicUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
    const tokens = await this.issueTokens(publicUser);
    return { ...tokens, user: publicUser };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Session expirée, veuillez vous reconnecter.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.refreshTokenHash) {
      // Token révoqué (logout) ou compte supprimé
      throw new UnauthorizedException('Session expirée, veuillez vous reconnecter.');
    }

    const tokenValid = await argon2.verify(user.refreshTokenHash, refreshToken);
    if (!tokenValid) {
      this.logger.warn(`Refresh token invalide — utilisateur ${user.id}`);
      throw new UnauthorizedException('Session expirée, veuillez vous reconnecter.');
    }

    return this.issueTokens({ id: user.id, email: user.email, role: user.role });
  }

  async logout(userId: string): Promise<void> {
    // Invalidation du refresh token : le hash est effacé en BDD (A07)
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  /** Émet une paire access/refresh et stocke le hash du refresh en BDD. */
  private async issueTokens(user: Pick<PublicUser, 'id' | 'email' | 'role'>): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };

    const accessTtl = (this.config.get<string>('JWT_ACCESS_TTL') ??
      '15m') as JwtSignOptions['expiresIn'];
    const refreshTtl = (this.config.get<string>('JWT_REFRESH_TTL') ??
      '7d') as JwtSignOptions['expiresIn'];

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: accessTtl,
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: refreshTtl,
    });

    // Le refresh token n'est jamais stocké en clair (A02)
    const refreshTokenHash = await argon2.hash(refreshToken);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash },
    });

    return { accessToken, refreshToken };
  }
}
