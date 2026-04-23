import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const GENRES = [
  'Романтика', 'Фентезі', 'Екшн', 'Комедія', 'Хоррор',
  'Психологічний', 'Детектив', 'Наукова фантастика',
  'Повсякденність', 'Пригоди', 'Надприродне',
  'Спортивний', 'Історичний', 'Трилер', 'Драма',
];

async function main() {
  // Видаляємо дублікати жанрів які могли з'явитись раніше
  const duplicates = ['Историчний', 'Повсякденність (Slice of Life)'];
  for (const name of duplicates) {
    await prisma.genre.deleteMany({ where: { name } }).catch(() => {});
  }

  for (const name of GENRES) {
    await prisma.genre.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const hashedPassword = await bcrypt.hash('password123', 10);

  await prisma.user.upsert({
    where: { email: 'author@comicslib.ua' },
    update: {},
    create: { username: 'test_author', email: 'author@comicslib.ua', password: hashedPassword, role: 'AUTHOR' },
  });

  await prisma.user.upsert({
    where: { email: 'translator@comicslib.ua' },
    update: {},
    create: { username: 'test_translator', email: 'translator@comicslib.ua', password: hashedPassword, role: 'TRANSLATOR' },
  });

  await prisma.user.upsert({
    where: { email: 'reader@comicslib.ua' },
    update: {},
    create: { username: 'test_reader', email: 'reader@comicslib.ua', password: hashedPassword, role: 'READER' },
  });
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
