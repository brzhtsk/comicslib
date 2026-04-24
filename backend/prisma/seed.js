import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const GENRES = [
  'Романтика', 'Фентезі', 'Екшн', 'Комедія', 'Хоррор',
  'Психологічний', 'Детектив', 'Наукова фантастика',
  'Повсякденність', 'Пригоди', 'Надприродне',
  'Спортивний', 'Історичний', 'Трилер', 'Драма',
];

const COMICS = [
  {
    title:       'Берсерк',
    authorName:  'Кентаро Міура',
    description: 'Темне фентезі про воїна Ґатса, який мандрує світом, переслідуваний демонами після зради свого найближчого друга. Одна з найвпливовіших манга всіх часів.',
    status:      'ONGOING',
    genres:      ['Фентезі', 'Екшн', 'Психологічний', 'Драма'],
  },
  {
    title:       'Вандітамус',
    authorName:  'One',
    description: 'Людина-монстр Сайтама може перемогти будь-якого ворога одним ударом і страждає від нудьги. Гостра сатира на жанр супергероїки.',
    status:      'ONGOING',
    genres:      ['Екшн', 'Комедія', 'Надприродне'],
  },
  {
    title:       'Атака титанів',
    authorName:  'Хаджіме Ісаяма',
    description: 'Людство живе за стінами, захищаючись від гігантських людиноподібних істот. Ерен Єґер вступає до армії після трагедії та відкриває страшну правду про свій світ.',
    status:      'COMPLETED',
    genres:      ['Екшн', 'Драма', 'Психологічний', 'Фентезі'],
  },
  {
    title:       'Дитина планети',
    authorName:  'Макото Юкімура',
    description: 'На космічній станції народжується перша людина, виростає і мріє ступити на поверхню Землі. Вдумлива наукова фантастика про людську природу та тугу за домівкою.',
    status:      'COMPLETED',
    genres:      ['Наукова фантастика', 'Драма', 'Пригоди'],
  },
  {
    title:       'Токійський гуль',
    authorName:  'Суі Ісіда',
    description: 'Студент Кен Канекі після нападу гуля стає напівлюдиною-напівгулем і змушений існувати між двома світами. Глибоке дослідження ідентичності та приналежності.',
    status:      'COMPLETED',
    genres:      ['Екшн', 'Хоррор', 'Психологічний', 'Драма'],
  },
  {
    title:       'Ван Піс',
    authorName:  'Ейїтіро Ода',
    description: 'Монкі Д. Луффі мріє стати Королем піратів і вирушає на пошуки легендарного скарбу Ван Піс. Найпродаваніша манга в історії.',
    status:      'ONGOING',
    genres:      ['Екшн', 'Пригоди', 'Комедія', 'Фентезі'],
  },
  {
    title:       'Тетрадь смерті',
    authorName:  'Цугумі Охба',
    description: 'Учень Лайт Яґамі знаходить зошит, який вбиває будь-кого, чиє ім\'я в ньому записане. Психологічний трилер про межі справедливості та влади.',
    status:      'COMPLETED',
    genres:      ['Трилер', 'Психологічний', 'Детектив', 'Надприродне'],
  },
  {
    title:       'Пірат Флатбред',
    authorName:  'Хіромуса Окамото',
    description: 'Легкий пригодницький комікс про молодого пекаря, який випадково потрапляє у піратський світ і вирішує завоювати його своїми кулінарними талантами.',
    status:      'ONGOING',
    genres:      ['Пригоди', 'Комедія', 'Повсякденність'],
  },
];

async function main() {
  console.log('Очищення бази даних...');

  // Видаляємо у правильному порядку (каскадність)
  await prisma.commentReaction.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comicView.deleteMany();
  await prisma.collectionItem.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.chapterPage.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.comicGenre.deleteMany();
  await prisma.comicTag.deleteMany();
  await prisma.comic.deleteMany();
  await prisma.user.deleteMany();
  await prisma.genre.deleteMany();

  console.log('Заповнення жанрів...');
  for (const name of GENRES) {
    await prisma.genre.create({ data: { name } });
  }

  console.log('Створення користувачів...');
  const password = await bcrypt.hash('password123', 10);

  const author = await prisma.user.create({
    data: {
      username: 'mangaka',
      email:    'author@comicslib.ua',
      password,
      role:     'AUTHOR',
      bio:      'Публікую улюблену мангу та власні роботи. Фанат темного фентезі.',
    },
  });

  const translator = await prisma.user.create({
    data: {
      username: 'translator_ua',
      email:    'translator@comicslib.ua',
      password,
      role:     'TRANSLATOR',
      bio:      'Перекладаю мангу українською вже 5 років. Спеціалізуюсь на сьонен та сейнен.',
    },
  });

  const reader1 = await prisma.user.create({
    data: {
      username: 'reader_diana',
      email:    'reader@comicslib.ua',
      password,
      role:     'READER',
      bio:      'Читаю все підряд, але найбільше люблю психологічні трилери та фентезі.',
    },
  });

  const reader2 = await prisma.user.create({
    data: {
      username: 'otaku_max',
      email:    'max@comicslib.ua',
      password,
      role:     'READER',
      bio:      'Манга та аніме — моє все.',
    },
  });

  console.log('Створення коміксів...');
  const genreMap = {};
  const allGenres = await prisma.genre.findMany();
  for (const g of allGenres) genreMap[g.name] = g.id;

  const createdComics = [];

  for (const c of COMICS) {
    const isTranslation = c.title !== 'Пірат Флатбред'; // Власний твір — без перекладача
    const publisherId   = isTranslation ? translator.id : author.id;

    const comic = await prisma.comic.create({
      data: {
        title:       c.title,
        authorName:  c.authorName,
        description: c.description,
        status:      c.status,
        coverUrl:    `uploads/covers/placeholder-${c.title.replace(/\s/g, '-').toLowerCase()}.jpg`,
        publisherId,
        translatorId: isTranslation ? translator.id : null,
        genres: {
          create: c.genres
            .filter((name) => genreMap[name])
            .map((name) => ({ genre: { connect: { id: genreMap[name] } } })),
        },
      },
    });

    createdComics.push(comic);
  }

  console.log('Додавання переглядів та вподобань...');
  const readers = [reader1, reader2, author];

  for (const comic of createdComics) {
    // Перегляди від різних користувачів
    for (const r of readers.slice(0, Math.floor(Math.random() * 3) + 1)) {
      await prisma.comicView.upsert({
        where:  { userId_comicId: { userId: r.id, comicId: comic.id } },
        update: {},
        create: { userId: r.id, comicId: comic.id },
      });
    }

    // Вподобання коміксу
    if (Math.random() > 0.3) {
      await prisma.like.create({ data: { userId: reader1.id, comicId: comic.id, chapterId: null } });
    }
    if (Math.random() > 0.5) {
      await prisma.like.create({ data: { userId: reader2.id, comicId: comic.id, chapterId: null } });
    }
  }

  console.log('Ініціалізація базових колекцій...');
  const BASE_COLS = [
    { type: 'READING',   name: 'Читаю' },
    { type: 'COMPLETED', name: 'Прочитано' },
    { type: 'PLANNED',   name: 'В планах' },
    { type: 'FAVOURITE', name: 'Улюблене' },
  ];

  for (const u of [reader1, reader2, author, translator]) {
    for (const col of BASE_COLS) {
      await prisma.collection.upsert({
        where:  { userId_type_name: { userId: u.id, type: col.type, name: col.name } },
        update: {},
        create: { userId: u.id, type: col.type, name: col.name },
      });
    }
  }

  // Додаємо кілька коміксів у колекції читача
  const readingCol = await prisma.collection.findFirst({ where: { userId: reader1.id, type: 'READING' } });
  const favouriteCol = await prisma.collection.findFirst({ where: { userId: reader1.id, type: 'FAVOURITE' } });

  if (readingCol && createdComics[0]) {
    await prisma.collectionItem.create({
      data: { collectionId: readingCol.id, comicId: createdComics[0].id, userId: reader1.id },
    });
  }
  if (favouriteCol && createdComics[2]) {
    await prisma.collectionItem.create({
      data: { collectionId: favouriteCol.id, comicId: createdComics[2].id, userId: reader1.id },
    });
  }

  console.log('Додавання коментарів...');
  const sampleComments = [
    'Шедевр, одна з найкращих робіт у жанрі. Рекомендую всім без виключення!',
    'Читав вночі і не міг зупинитись, дуже захопливо!',
    'Гарний переклад, дякую перекладачу за роботу.',
    'Цікавий сюжет, але темп трохи повільний на початку.',
    'Artwork просто неймовірний, кожна сторінка — витвір мистецтва.',
  ];

  for (let i = 0; i < Math.min(3, createdComics.length); i++) {
    const comic = createdComics[i];
    const comment = await prisma.comment.create({
      data: {
        text:     sampleComments[i % sampleComments.length],
        userId:   reader1.id,
        comicId:  comic.id,
        chapterId: null,
        parentId:  null,
      },
    });

    // Відповідь на коментар
    await prisma.comment.create({
      data: {
        text:     sampleComments[(i + 1) % sampleComments.length],
        userId:   reader2.id,
        comicId:  comic.id,
        chapterId: null,
        parentId:  comment.id,
      },
    });
  }

  console.log('\n✓ База даних заповнена успішно!');
  console.log('\nТестові акаунти (пароль: password123):');
  console.log('  author@comicslib.ua     — Автор (mangaka)');
  console.log('  translator@comicslib.ua — Перекладач (translator_ua)');
  console.log('  reader@comicslib.ua     — Читач (reader_diana)');
  console.log('  max@comicslib.ua        — Читач (otaku_max)');
  console.log('\nПримітка: обкладинки потрібно додати вручну через форму редагування коміксу.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
