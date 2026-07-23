import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  const prismaMock = {
    user: { findUnique: jest.fn(), update: jest.fn() },
  };

  const profile = {
    id: 'user-1',
    email: 'marie@soundproof.fr',
    firstName: 'Marie',
    lastName: 'Dubois',
    role: Role.MEMBER,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  it('getProfile renvoie le profil sans champ sensible', async () => {
    prismaMock.user.findUnique.mockResolvedValue(profile);

    const result = await service.getProfile(profile.id);

    expect(result).toEqual(profile);
    expect(result).not.toHaveProperty('passwordHash');
    expect(result).not.toHaveProperty('refreshTokenHash');
  });

  it('getProfile renvoie 404 pour un utilisateur inconnu', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(service.getProfile('inconnu')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updateProfile met à jour prénom et nom', async () => {
    prismaMock.user.findUnique.mockResolvedValue(profile);
    prismaMock.user.update.mockResolvedValue({ ...profile, firstName: 'Maria' });

    const result = await service.updateProfile(profile.id, { firstName: 'Maria' });

    expect(result.firstName).toBe('Maria');
  });
});
