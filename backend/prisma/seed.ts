/**
 * Seed de démonstration : 1 admin, 3 membres, 3 salles équipées,
 * des réservations (passées et à venir) et des messages de chat.
 *
 * Exécution : npx prisma db seed
 * Comptes créés (mot de passe commun) : voir tableau du README / manuel d'utilisation.
 */
import { EquipmentCategory, PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const SEED_PASSWORD = 'SoundProof2026!';

/** Retourne une date au jour J+offset à l'heure donnée (minutes alignées sur 30). */
function at(dayOffset: number, hours: number, minutes = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

async function main(): Promise<void> {
  const passwordHash = await argon2.hash(SEED_PASSWORD);

  // Nettoyage (ordre inverse des dépendances) pour un seed reproductible
  await prisma.bookingEquipment.deleteMany();
  await prisma.message.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.room.deleteMany();
  await prisma.user.deleteMany();

  // --- Utilisateurs ---
  const admin = await prisma.user.create({
    data: {
      email: 'admin@soundproof.fr',
      passwordHash,
      firstName: 'Alice',
      lastName: 'Martin',
      role: Role.ADMIN,
    },
  });
  const marie = await prisma.user.create({
    data: {
      email: 'marie@soundproof.fr',
      passwordHash,
      firstName: 'Marie',
      lastName: 'Dubois',
      role: Role.MEMBER,
    },
  });
  const karim = await prisma.user.create({
    data: {
      email: 'karim@soundproof.fr',
      passwordHash,
      firstName: 'Karim',
      lastName: 'Benali',
      role: Role.MEMBER,
    },
  });
  const lea = await prisma.user.create({
    data: {
      email: 'lea@soundproof.fr',
      passwordHash,
      firstName: 'Léa',
      lastName: 'Rousseau',
      role: Role.MEMBER,
    },
  });

  // --- Salles et matériel ---
  const studioA = await prisma.room.create({
    data: {
      name: 'Studio A — Le Garage',
      description:
        'Grande salle adaptée aux groupes complets : batterie fixe, sonorisation complète.',
      capacity: 6,
      equipments: {
        create: [
          { name: 'Batterie Pearl Export', category: EquipmentCategory.DRUMS },
          { name: 'Ampli guitare Marshall JCM900', category: EquipmentCategory.AMPLIFIER },
          { name: 'Ampli basse Ampeg BA-115', category: EquipmentCategory.AMPLIFIER },
          { name: 'Micro chant Shure SM58', category: EquipmentCategory.MICROPHONE },
          { name: 'Table de mixage Yamaha MG12', category: EquipmentCategory.MIXER },
        ],
      },
    },
    include: { equipments: true },
  });

  const studioB = await prisma.room.create({
    data: {
      name: 'Studio B — La Cave',
      description: 'Salle intimiste pour duos et trios acoustiques, piano numérique sur place.',
      capacity: 4,
      equipments: {
        create: [
          { name: 'Piano numérique Roland FP-30', category: EquipmentCategory.KEYBOARD },
          { name: 'Guitare classique Yamaha C40', category: EquipmentCategory.GUITAR },
          { name: 'Micro voix AKG C214', category: EquipmentCategory.MICROPHONE },
          { name: 'Ampli acoustique AER Compact 60', category: EquipmentCategory.AMPLIFIER },
        ],
      },
    },
    include: { equipments: true },
  });

  const studioC = await prisma.room.create({
    data: {
      name: 'Studio C — Le Loft',
      description: 'Salle polyvalente répétition/enregistrement, cabine de prise de son.',
      capacity: 8,
      equipments: {
        create: [
          { name: 'Batterie électronique Roland TD-17', category: EquipmentCategory.DRUMS },
          { name: 'Basse Fender Jazz Bass', category: EquipmentCategory.BASS },
          { name: 'Ampli guitare Fender Twin Reverb', category: EquipmentCategory.AMPLIFIER },
          { name: 'Micro instrument Sennheiser e609', category: EquipmentCategory.MICROPHONE },
          { name: 'Table de mixage Behringer X32', category: EquipmentCategory.MIXER },
          { name: 'Clavier maître Arturia KeyLab 61', category: EquipmentCategory.KEYBOARD },
        ],
      },
    },
    include: { equipments: true },
  });

  // --- Réservations ---
  // Passée (donne à Marie l'accès au chat du Studio A)
  const pastBooking = await prisma.booking.create({
    data: {
      userId: marie.id,
      roomId: studioA.id,
      startsAt: at(-7, 18, 0),
      endsAt: at(-7, 20, 0),
      equipments: {
        create: [{ equipmentId: studioA.equipments[1].id }],
      },
    },
  });

  // À venir — Studio A, Karim, avec matériel
  await prisma.booking.create({
    data: {
      userId: karim.id,
      roomId: studioA.id,
      startsAt: at(2, 10, 0),
      endsAt: at(2, 12, 0),
      equipments: {
        create: [
          { equipmentId: studioA.equipments[0].id },
          { equipmentId: studioA.equipments[3].id },
        ],
      },
    },
  });

  // À venir — Studio B, Léa, sans matériel supplémentaire
  await prisma.booking.create({
    data: {
      userId: lea.id,
      roomId: studioB.id,
      startsAt: at(3, 14, 30),
      endsAt: at(3, 16, 0),
    },
  });

  // À venir — Studio A, Marie (deuxième réservation, autre créneau)
  await prisma.booking.create({
    data: {
      userId: marie.id,
      roomId: studioA.id,
      startsAt: at(2, 14, 0),
      endsAt: at(2, 16, 30),
    },
  });

  // Annulée (traçabilité : le statut CANCELLED est conservé)
  await prisma.booking.create({
    data: {
      userId: karim.id,
      roomId: studioC.id,
      startsAt: at(5, 9, 0),
      endsAt: at(5, 11, 0),
      status: 'CANCELLED',
    },
  });

  // --- Messages de chat (Studio A : Marie et Karim y ont réservé) ---
  await prisma.message.createMany({
    data: [
      {
        roomId: studioA.id,
        userId: marie.id,
        content: 'Salut ! Quelqu’un aurait un câble XLR à prêter pour jeudi ?',
        createdAt: at(-2, 14, 2),
      },
      {
        roomId: studioA.id,
        userId: karim.id,
        content: 'Oui je l’amène, j’en ai deux. Tu peux laisser le SM58 branché en partant ?',
        createdAt: at(-2, 14, 5),
      },
      {
        roomId: studioA.id,
        userId: marie.id,
        content: 'Ça marche, merci ! Bonne répète 🎸',
        createdAt: at(-2, 14, 6),
      },
      {
        roomId: studioA.id,
        userId: admin.id,
        content: '[Info gérance] La table de mixage a été révisée, pensez à recalibrer les gains.',
        createdAt: at(-1, 9, 30),
      },
    ],
  });

  console.log('Seed terminé :');
  console.log(`  - 4 utilisateurs (1 ADMIN, 3 MEMBER) — mot de passe : ${SEED_PASSWORD}`);
  console.log('  - 3 salles, 15 équipements');
  console.log(`  - 5 réservations (dont 1 passée ${pastBooking.id.slice(0, 8)}… et 1 annulée)`);
  console.log('  - 4 messages de chat (Studio A)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
