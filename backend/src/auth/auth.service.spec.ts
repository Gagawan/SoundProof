import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as argon2 from 'argon2';

import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

jest.mock('argon2');
const argon2Mock = argon2 as jest.Mocked<typeof argon2>;

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const jwtMock = {
    signAsync: jest.fn().mockResolvedValue('un-token-signe'),
    verifyAsync: jest.fn(),
  };

  const configMock = {
    getOrThrow: jest.fn().mockReturnValue('secret-de-test'),
    get: jest.fn().mockReturnValue(undefined),
  };

  const storedUser = {
    id: 'user-1',
    email: 'marie@soundproof.fr',
    passwordHash: 'hash-argon2',
    firstName: 'Marie',
    lastName: 'Dubois',
    role: Role.MEMBER,
    refreshTokenHash: 'hash-refresh',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    argon2Mock.hash.mockResolvedValue('hash-argon2');

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('register', () => {
    const dto = {
      email: 'marie@soundproof.fr',
      password: 'MotDePasseFort1',
      firstName: 'Marie',
      lastName: 'Dubois',
    };

    it('hache le mot de passe avec argon2 et crée le compte', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: storedUser.id,
        email: storedUser.email,
        firstName: storedUser.firstName,
        lastName: storedUser.lastName,
        role: storedUser.role,
      });
      prismaMock.user.update.mockResolvedValue(storedUser);

      const result = await service.register(dto);

      expect(argon2Mock.hash).toHaveBeenCalledWith(dto.password);
      expect(prismaMock.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ passwordHash: 'hash-argon2' }) as unknown,
        }),
      );
      expect(result.accessToken).toBe('un-token-signe');
      expect(result.user.email).toBe(dto.email);
      // Aucune donnée sensible dans la réponse
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user).not.toHaveProperty('refreshTokenHash');
    });

    it('refuse un email déjà utilisé (conflit)', async () => {
      prismaMock.user.findUnique.mockResolvedValue(storedUser);

      await expect(service.register(dto)).rejects.toBeInstanceOf(ConflictException);
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const dto = { email: 'marie@soundproof.fr', password: 'MotDePasseFort1' };

    it('retourne les tokens et le profil public en cas de succès', async () => {
      prismaMock.user.findUnique.mockResolvedValue(storedUser);
      prismaMock.user.update.mockResolvedValue(storedUser);
      argon2Mock.verify.mockResolvedValue(true);

      const result = await service.login(dto);

      expect(result.accessToken).toBe('un-token-signe');
      expect(result.refreshToken).toBe('un-token-signe');
      expect(result.user).toEqual({
        id: storedUser.id,
        email: storedUser.email,
        firstName: storedUser.firstName,
        lastName: storedUser.lastName,
        role: storedUser.role,
      });
    });

    it('stocke un hash du refresh token en base (jamais en clair)', async () => {
      prismaMock.user.findUnique.mockResolvedValue(storedUser);
      prismaMock.user.update.mockResolvedValue(storedUser);
      argon2Mock.verify.mockResolvedValue(true);
      argon2Mock.hash.mockResolvedValue('hash-du-refresh');

      await service.login(dto);

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: storedUser.id },
        data: { refreshTokenHash: 'hash-du-refresh' },
      });
    });

    it('rejette un mauvais mot de passe avec le message générique', async () => {
      prismaMock.user.findUnique.mockResolvedValue(storedUser);
      argon2Mock.verify.mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toMatchObject({
        constructor: UnauthorizedException,
        message: 'Identifiants invalides.',
      });
    });

    it('rejette un compte inexistant avec LE MÊME message générique (A07)', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toMatchObject({
        constructor: UnauthorizedException,
        message: 'Identifiants invalides.',
      });
    });
  });

  describe('refresh', () => {
    it('émet une nouvelle paire de tokens pour un refresh token valide', async () => {
      jwtMock.verifyAsync.mockResolvedValue({
        sub: storedUser.id,
        email: storedUser.email,
        role: storedUser.role,
      });
      prismaMock.user.findUnique.mockResolvedValue(storedUser);
      prismaMock.user.update.mockResolvedValue(storedUser);
      argon2Mock.verify.mockResolvedValue(true);

      const result = await service.refresh('refresh-valide');

      expect(result).toEqual({ accessToken: 'un-token-signe', refreshToken: 'un-token-signe' });
    });

    it('rejette un refresh token invalide ou expiré', async () => {
      jwtMock.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      await expect(service.refresh('refresh-expire')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejette un refresh token révoqué par un logout', async () => {
      jwtMock.verifyAsync.mockResolvedValue({
        sub: storedUser.id,
        email: storedUser.email,
        role: storedUser.role,
      });
      prismaMock.user.findUnique.mockResolvedValue({ ...storedUser, refreshTokenHash: null });

      await expect(service.refresh('refresh-revoque')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejette un refresh token ne correspondant pas au hash stocké', async () => {
      jwtMock.verifyAsync.mockResolvedValue({
        sub: storedUser.id,
        email: storedUser.email,
        role: storedUser.role,
      });
      prismaMock.user.findUnique.mockResolvedValue(storedUser);
      argon2Mock.verify.mockResolvedValue(false);

      await expect(service.refresh('refresh-vole')).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('efface le hash du refresh token (invalidation)', async () => {
      prismaMock.user.update.mockResolvedValue(storedUser);

      await service.logout(storedUser.id);

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: storedUser.id },
        data: { refreshTokenHash: null },
      });
    });
  });
});
