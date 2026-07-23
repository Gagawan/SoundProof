import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentCategory, PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from './../src/app.module';

/** Corps des réponses d'authentification (response.body de supertest est any). */
interface AuthBody {
  accessToken: string;
  refreshToken: string;
  user: { email: string; role: string; passwordHash?: string };
}

interface BookingBody {
  id: string;
  equipments: unknown[];
}

/**
 * Tests e2e des parcours critiques de l'API (BDD PostgreSQL réelle) :
 * inscription → connexion → réservation → conflit 409 → annulation → accès chat,
 * plus contrôles d'accès par rôle et cycle refresh/logout.
 * La suite crée ses propres fixtures : elle ne dépend pas du seed.
 */
describe('API SoundProof (e2e) — parcours critiques', () => {
  let app: INestApplication<App>;
  let http: App;
  const prisma = new PrismaClient();

  const ADMIN_EMAIL = 'admin.e2e@soundproof.fr';
  const PASSWORD = 'MotDePasseE2e1';
  const MEMBER_EMAIL = 'membre.e2e@soundproof.fr';
  const OTHER_EMAIL = 'autre.e2e@soundproof.fr';

  let roomAId: string;
  let roomBId: string;
  let equipmentAId: string;
  let equipmentBId: string;

  /** Créneau futur aligné (UTC) à J+14. */
  function slot(hoursUtc: number, minutes: 0 | 30 = 0): string {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 14);
    d.setUTCHours(hoursUtc, minutes, 0, 0);
    return d.toISOString();
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
    http = app.getHttpServer();

    // Base propre + fixtures dédiées (ordre inverse des dépendances)
    await prisma.bookingEquipment.deleteMany();
    await prisma.message.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.equipment.deleteMany();
    await prisma.room.deleteMany();
    await prisma.user.deleteMany();

    await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        passwordHash: await argon2.hash(PASSWORD),
        firstName: 'Admin',
        lastName: 'E2E',
        role: Role.ADMIN,
      },
    });

    const roomA = await prisma.room.create({
      data: {
        name: 'Salle e2e A',
        description: 'Salle de test e2e',
        capacity: 4,
        equipments: {
          create: [{ name: 'Ampli e2e', category: EquipmentCategory.AMPLIFIER }],
        },
      },
      include: { equipments: true },
    });
    roomAId = roomA.id;
    equipmentAId = roomA.equipments[0].id;

    const roomB = await prisma.room.create({
      data: {
        name: 'Salle e2e B',
        description: 'Seconde salle de test',
        capacity: 2,
        equipments: {
          create: [{ name: 'Micro e2e', category: EquipmentCategory.MICROPHONE }],
        },
      },
      include: { equipments: true },
    });
    roomBId = roomB.id;
    equipmentBId = roomB.equipments[0].id;
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  let memberAccess: string;
  let memberRefresh: string;
  let otherAccess: string;
  let adminAccess: string;
  let bookingId: string;

  describe('US1/US2 — inscription et connexion', () => {
    it('inscrit un nouveau membre (tokens + profil sans donnée sensible)', async () => {
      const response = await request(http)
        .post('/api/v1/auth/register')
        .send({
          email: MEMBER_EMAIL,
          password: PASSWORD,
          firstName: 'Marie',
          lastName: 'E2E',
        })
        .expect(201);

      const body = response.body as AuthBody;
      expect(body.user).toMatchObject({ email: MEMBER_EMAIL, role: 'MEMBER' });
      expect(body.user.passwordHash).toBeUndefined();
      expect(body.accessToken).toBeDefined();
    });

    it('refuse un mot de passe faible (politique de mot de passe)', () => {
      return request(http)
        .post('/api/v1/auth/register')
        .send({ email: 'faible@soundproof.fr', password: 'court', firstName: 'A', lastName: 'B' })
        .expect(400);
    });

    it('refuse un email déjà utilisé (409)', () => {
      return request(http)
        .post('/api/v1/auth/register')
        .send({ email: MEMBER_EMAIL, password: PASSWORD, firstName: 'Marie', lastName: 'E2E' })
        .expect(409);
    });

    it('connecte le membre et rejette un payload non whitelisté (400)', async () => {
      const login = await request(http)
        .post('/api/v1/auth/login')
        .send({ email: MEMBER_EMAIL, password: PASSWORD })
        .expect(200);
      const loginBody = login.body as AuthBody;
      memberAccess = loginBody.accessToken;
      memberRefresh = loginBody.refreshToken;

      await request(http)
        .post('/api/v1/auth/login')
        .send({ email: MEMBER_EMAIL, password: PASSWORD, injection: 'x' })
        .expect(400);
    });

    it('répond au mauvais mot de passe par le message générique (401)', async () => {
      const response = await request(http)
        .post('/api/v1/auth/login')
        .send({ email: MEMBER_EMAIL, password: 'MauvaisMotDePasse1' })
        .expect(401);

      expect((response.body as { message: string }).message).toBe('Identifiants invalides.');
    });
  });

  describe('US3/US5/US6 — salles et réservations', () => {
    it('liste les salles pour un membre authentifié (401 sans token)', async () => {
      await request(http).get('/api/v1/rooms').expect(401);

      const response = await request(http)
        .get('/api/v1/rooms')
        .set('Authorization', `Bearer ${memberAccess}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
    });

    it('crée une réservation avec matériel de la salle (201)', async () => {
      const response = await request(http)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${memberAccess}`)
        .send({
          roomId: roomAId,
          startsAt: slot(10),
          endsAt: slot(12),
          equipmentIds: [equipmentAId],
        })
        .expect(201);

      const body = response.body as BookingBody;
      bookingId = body.id;
      expect(body.equipments).toHaveLength(1);
    });

    it('refuse un créneau en conflit (409) — chevauchement partiel', () => {
      return request(http)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${memberAccess}`)
        .send({ roomId: roomAId, startsAt: slot(11), endsAt: slot(13) })
        .expect(409);
    });

    it("refuse un matériel n'appartenant pas à la salle (400)", () => {
      return request(http)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${memberAccess}`)
        .send({
          roomId: roomAId,
          startsAt: slot(14),
          endsAt: slot(15),
          equipmentIds: [equipmentBId],
        })
        .expect(400);
    });

    it('la disponibilité expose le créneau occupé', async () => {
      const from = new Date();
      const to = new Date();
      to.setUTCDate(to.getUTCDate() + 21);

      const response = await request(http)
        .get(`/api/v1/rooms/${roomAId}/availability`)
        .query({ from: from.toISOString(), to: to.toISOString() })
        .set('Authorization', `Bearer ${memberAccess}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
    });
  });

  describe('US7/US10 — annulation et contrôle de propriété', () => {
    it('crée un second membre qui ne peut pas annuler la réservation d’autrui (403)', async () => {
      const register = await request(http)
        .post('/api/v1/auth/register')
        .send({ email: OTHER_EMAIL, password: PASSWORD, firstName: 'Karim', lastName: 'E2E' })
        .expect(201);
      otherAccess = (register.body as AuthBody).accessToken;

      await request(http)
        .delete(`/api/v1/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${otherAccess}`)
        .expect(403);
    });

    it('la route admin est interdite à un membre (403) et ouverte à un ADMIN', async () => {
      await request(http)
        .get('/api/v1/bookings')
        .set('Authorization', `Bearer ${memberAccess}`)
        .expect(403);

      const adminLogin = await request(http)
        .post('/api/v1/auth/login')
        .send({ email: ADMIN_EMAIL, password: PASSWORD })
        .expect(200);
      adminAccess = (adminLogin.body as AuthBody).accessToken;

      const response = await request(http)
        .get('/api/v1/bookings')
        .set('Authorization', `Bearer ${adminAccess}`)
        .expect(200);
      expect((response.body as unknown[]).length).toBeGreaterThanOrEqual(1);
    });

    it('le propriétaire annule sa réservation (204) → statut CANCELLED', async () => {
      await request(http)
        .delete(`/api/v1/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${memberAccess}`)
        .expect(204);

      const cancelled = await prisma.booking.findUnique({ where: { id: bookingId } });
      expect(cancelled?.status).toBe('CANCELLED');
    });

    it('le créneau annulé redevient réservable (l’anti-chevauchement ignore CANCELLED)', () => {
      return request(http)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${otherAccess}`)
        .send({ roomId: roomAId, startsAt: slot(10), endsAt: slot(12) })
        .expect(201);
    });
  });

  describe('US8 — accès au chat', () => {
    it('autorise l’historique au membre ayant réservé la salle (200)', async () => {
      const response = await request(http)
        .get(`/api/v1/rooms/${roomAId}/messages`)
        .set('Authorization', `Bearer ${otherAccess}`)
        .expect(200);

      expect(response.body).toEqual({ messages: [], nextCursor: null });
    });

    it('refuse l’historique sans réservation sur la salle (403)', () => {
      return request(http)
        .get(`/api/v1/rooms/${roomBId}/messages`)
        .set('Authorization', `Bearer ${memberAccess}`)
        .expect(403);
    });
  });

  describe('US2 — cycle refresh / logout', () => {
    it('renouvelle la paire de tokens avec un refresh token valide', async () => {
      const response = await request(http)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: memberRefresh })
        .expect(200);

      const body = response.body as AuthBody;
      expect(body.accessToken).toBeDefined();
      memberAccess = body.accessToken;
      memberRefresh = body.refreshToken;
    });

    it('invalide le refresh token au logout (refresh suivant → 401)', async () => {
      await request(http)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${memberAccess}`)
        .expect(204);

      await request(http)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: memberRefresh })
        .expect(401);
    });
  });
});
