/**
 * Development seed: creates the admin account and realistic Armenian example content for every section.
 * Example photos are CC0 stock photos from prisma/seed-images (sources in credits.json) —
 * replace them with real photos from the Admin Panel. Missing files fall back to an abstract illustration.
 *
 *   npm run db:seed            (wipes content tables first!)
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import sharp from 'sharp';
import { PrismaClient, type MealType, type MessageType, type Prisma } from '@prisma/client';
import { config } from '../src/config.js';
import { storage } from '../src/storage/index.js';
import { SETTING_DEFAULTS } from '../src/lib/settings.js';

const prisma = new PrismaClient();
const PHOTO_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'seed-images');

if (config.isProd && process.env.SEED_FORCE !== '1') {
  console.error('Refusing to seed placeholder content in production. Set SEED_FORCE=1 to override.');
  process.exit(1);
}

const PALETTES = [
  ['#FDE9B4', '#F8CF6A', '#F6B88E', '#FFF7E8'],
  ['#DCEEFB', '#9CCBEA', '#F8D57E', '#F4FAFF'],
  ['#E2F2E4', '#A5D3AE', '#F7C59F', '#F6FBF5'],
  ['#FDE4DA', '#F5B39A', '#F3D27A', '#FFF6F1'],
  ['#FBE3EA', '#F0B0C2', '#A9D2EE', '#FFF5F8'],
  ['#EFE8FB', '#C3B3EC', '#F8D57E', '#FAF7FF'],
];

function placeholderSvg(seed: number, w = 1600, h = 1100) {
  const [bg, a, b, light] = PALETTES[seed % PALETTES.length];
  const r = (n: number) => {
    const x = Math.sin(seed * 9301 + n * 49297) * 233280;
    return x - Math.floor(x);
  };
  const sunX = 0.2 + r(1) * 0.6;
  const dots = Array.from({ length: 7 }, (_, i) => `<circle cx="${r(i + 10) * w}" cy="${r(i + 20) * h * 0.55}" r="${8 + r(i + 30) * 18}" fill="${light}" opacity="0.7"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${bg}"/></linearGradient>
    <radialGradient id="s" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${b}"/><stop offset="1" stop-color="${b}" stop-opacity="0.85"/></radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  ${dots}
  <circle cx="${sunX * w}" cy="${h * 0.34}" r="${h * 0.16}" fill="url(#s)"/>
  <circle cx="${sunX * w}" cy="${h * 0.34}" r="${h * 0.24}" fill="${b}" opacity="0.15"/>
  <path d="M0 ${h * 0.72} C ${w * 0.2} ${h * 0.6}, ${w * 0.4} ${h * 0.82}, ${w * 0.62} ${h * 0.7} S ${w * 0.9} ${h * 0.6}, ${w} ${h * 0.68} V ${h} H 0 Z" fill="${a}" opacity="0.75"/>
  <path d="M0 ${h * 0.84} C ${w * 0.25} ${h * 0.76}, ${w * 0.5} ${h * 0.92}, ${w * 0.75} ${h * 0.82} S ${w} ${h * 0.8}, ${w} ${h * 0.8} V ${h} H 0 Z" fill="${light}" opacity="0.9"/>
</svg>`;
}

/** Example photo from prisma/seed-images, or an abstract illustration when the file is missing. */
function photoSource(photo: string, n: number) {
  const file = path.join(PHOTO_DIR, `${photo}.webp`);
  return fs.existsSync(file) ? sharp(file) : sharp(Buffer.from(placeholderSvg(n)));
}

let seedCounter = 0;
async function makeImage(meta: { photo: string; title: string; category: string; takenAt?: string; inGallery?: boolean; alt?: string; description?: string }) {
  const n = seedCounter++;
  const src = photoSource(meta.photo, n).rotate();
  const base = `seed/${crypto.randomUUID()}`;
  const large = await src.clone().resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
  const thumb = await src.clone().resize({ width: 720, height: 720, fit: 'inside', withoutEnlargement: true }).webp({ quality: 76 }).toBuffer();
  await storage.putBuffer(`${base}-lg.webp`, large.data, 'image/webp');
  await storage.putBuffer(`${base}-sm.webp`, thumb, 'image/webp');
  return prisma.media.create({
    data: {
      type: 'IMAGE',
      key: `${base}-lg.webp`,
      thumbKey: `${base}-sm.webp`,
      mimeType: 'image/webp',
      size: large.data.length,
      width: large.info.width,
      height: large.info.height,
      title: meta.title,
      description: meta.description ?? '',
      alt: meta.alt ?? meta.title,
      category: meta.category,
      takenAt: new Date(`${meta.takenAt ?? '2026-09-20'}T00:00:00Z`),
      inGallery: meta.inGallery ?? true,
      sortOrder: -n,
    },
  });
}

/** Linked YouTube video (no file stored). */
function makeYoutube(meta: { id: string; title: string; category: string; takenAt: string; description?: string }) {
  const n = seedCounter++;
  return prisma.media.create({
    data: {
      type: 'VIDEO',
      source: 'YOUTUBE',
      externalId: meta.id,
      externalUrl: `https://www.youtube.com/watch?v=${meta.id}`,
      externalThumbUrl: `https://i.ytimg.com/vi/${meta.id}/hqdefault.jpg`,
      title: meta.title,
      description: meta.description ?? '',
      alt: meta.title,
      category: meta.category,
      takenAt: new Date(`${meta.takenAt}T00:00:00Z`),
      sortOrder: -n,
    },
  });
}

const d = (s: string) => new Date(`${s}T00:00:00Z`);

async function main() {
  console.log('Clearing content tables…');
  await prisma.$transaction([
    prisma.dailyActivityMedia.deleteMany(),
    prisma.eventMedia.deleteMany(),
    prisma.spaceMedia.deleteMany(),
    prisma.dailyActivity.deleteMany(),
    prisma.event.deleteMany(),
    prisma.promotion.deleteMany(),
    prisma.activity.deleteMany(),
    prisma.scheduleItem.deleteMany(),
    prisma.space.deleteMany(),
    prisma.testimonial.deleteMany(),
    prisma.faq.deleteMany(),
    prisma.meal.deleteMany(),
    prisma.menuEntry.deleteMany(),
    prisma.setting.deleteMany(),
    // only the example inbox messages created below — real submissions are kept
    prisma.contactMessage.deleteMany({ where: { email: { endsWith: '@example.com' } } }),
  ]);
  const oldMedia = await prisma.media.findMany();
  for (const m of oldMedia) {
    if (m.key) await storage.delete(m.key);
    if (m.thumbKey) await storage.delete(m.thumbKey);
  }
  await prisma.media.deleteMany();

  /* Admin */
  const email = (process.env.ADMIN_EMAIL ?? 'admin@sunnykids.am').toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? 'SunnyAdmin2026!';
  await prisma.adminUser.upsert({
    where: { email },
    create: { email, name: 'Ադմինիստրատոր', passwordHash: await bcrypt.hash(password, 12) },
    update: { passwordHash: await bcrypt.hash(password, 12) },
  });
  console.log(`Admin: ${email}`);

  /* Hero + about */
  const hero = [
    await makeImage({ photo: 'outdoor-8', title: 'Ուրախ խաղեր բացօթյա', category: 'GAMES', inGallery: false }),
    await makeImage({ photo: 'play-1', title: 'Խաղ խմբասենյակում', category: 'GAMES', inGallery: false }),
    await makeImage({ photo: 'creative-2', title: 'Ստեղծագործական ժամ', category: 'CREATIVE', inGallery: false }),
  ];
  const about = [
    await makeImage({ photo: 'play-6', title: 'Մեր խմբասենյակը', category: 'ROOMS', inGallery: false }),
    await makeImage({ photo: 'creative-3', title: 'Նկարում ենք միասին', category: 'LEARNING', inGallery: false }),
  ];
  await prisma.setting.createMany({
    data: [
      { key: 'site', value: { ...SETTING_DEFAULTS.site, heroMediaIds: hero.map((m) => m.id), ogImageMediaId: hero[0].id } },
      { key: 'about', value: { ...SETTING_DEFAULTS.about, imageMediaIds: about.map((m) => m.id) } },
      {
        key: 'contact',
        value: {
          ...SETTING_DEFAULTS.contact,
          address: 'Երևան, Արաբկիր, Կոմիտասի պողոտա 10 (օրինակ)',
          phone: '+374 99 123 456',
          phone2: '+374 10 123 456',
          email: 'info@sunnykids.am',
          instagram: 'sunnykidsclub',
          facebook: 'sunnykidsclub',
          whatsapp: '+374 99 123 456',
          workingHours: [
            { days: 'Երկուշաբթի – Ուրբաթ', hours: '08:30 – 18:30' },
            { days: 'Շաբաթ', hours: '10:00 – 14:00 (զարգացնող խմբեր)' },
            { days: 'Կիրակի', hours: 'Փակ է' },
          ],
          mapEmbedUrl: 'https://maps.google.com/maps?q=Komitas+Avenue,+Yerevan&z=15&output=embed',
          mapLink: 'https://www.google.com/maps/search/?api=1&query=Komitas+Avenue+Yerevan',
        },
      },
      { key: 'parents', value: { ...SETTING_DEFAULTS.parents } as Prisma.InputJsonObject },
      { key: 'food', value: { ...SETTING_DEFAULTS.food, notes: 'Ճաշացանկը կարող է փոփոխվել՝ կախված սեզոնային մթերքներից։ Ալերգիաների մասին խնդրում ենք նախապես տեղեկացնել դաստիարակին։' } },
      { key: 'privacy', value: { ...SETTING_DEFAULTS.privacy } as Prisma.InputJsonObject },
    ],
  });

  /* Schedule */
  const schedule = [
    ['08:30', 'Երեխաների ընդունելություն', 'Ջերմ դիմավորում, առավոտյան զրույց և հանգիստ խաղեր։'],
    ['09:00', 'Նախաճաշ', 'Առողջ և սննդարար նախաճաշ։'],
    ['09:30', 'Ուսուցողական զբաղմունք', 'Նախադպրոցական պատրաստություն, խոսքի զարգացում, մաթեմատիկա խաղի միջոցով։'],
    ['10:30', 'Խաղեր և զբոսանք', 'Բացօթյա խաղեր և զբոսանք բակում։'],
    ['12:00', 'Ճաշ', 'Տաք և հավասարակշռված ճաշ։'],
    ['13:00', 'Ցերեկային քուն', 'Հանգիստ և հարմարավետ քնելու սենյակում։'],
    ['15:30', 'Խորտիկ', 'Թեթև խորտիկ՝ մրգեր, կաթնամթերք։'],
    ['16:00', 'Ստեղծագործական զբաղմունք', 'Նկարչություն, ձեռքի աշխատանքներ, երաժշտություն։'],
    ['17:00', 'Ազատ խաղ', 'Խաղեր ըստ երեխաների նախասիրությունների։'],
    ['18:30', 'Երեխաների տուն գնալու ժամ', 'Ծնողների հետ կիսվում ենք օրվա տպավորություններով։'],
  ];
  await prisma.scheduleItem.createMany({ data: schedule.map(([time, title, description], i) => ({ time, title, description, sortOrder: i })) });

  /* Activities (program cards) */
  const activities = [
    ['palette', 'Նկարչություն', 'Գույներ, վրձիններ և երևակայություն․ երեխաները սովորում են արտահայտել իրենց զգացմունքները։', 'CREATIVE', 'creative-7'],
    ['music', 'Երաժշտություն', 'Երգեր, ռիթմ և երաժշտական գործիքներ՝ լսողության և զգացողության զարգացման համար։', 'LEARNING', 'music-1'],
    ['book', 'Հեքիաթներ և ընթերցանություն', 'Ամենօրյա ընթերցանություն, որը զարգացնում է խոսքը և սերը գրքի հանդեպ։', 'LEARNING', 'learning-6'],
    ['puzzle', 'Զարգացնող խաղեր', 'Տրամաբանական խաղեր, կոնստրուկտորներ և հանելուկներ։', 'GAMES', 'rooms-5'],
    ['ball', 'Շարժողական խաղեր', 'Ակտիվ խաղեր, որոնք ամրացնում են առողջությունը և թիմային ոգին։', 'GAMES', 'outdoor-5'],
    ['trees', 'Բացօթյա զբոսանքներ', 'Ամենօրյա զբոսանքներ և բնության բացահայտում։', 'WALKS', 'outdoor-3'],
    ['abc', 'Նախադպրոցական պատրաստություն', 'Տառեր, թվեր և դպրոցին պատրաստվելու հմտություններ՝ խաղի ձևով։', 'LEARNING', 'learning-9'],
    ['scissors', 'Ստեղծագործական աշխատանքներ', 'Ձեռքի աշխատանքներ, ծեփում և հավաքածուներ բնական նյութերից։', 'CREATIVE', 'creative-6'],
  ];
  for (const [i, [icon, title, description, category, photo]] of activities.entries()) {
    const image = await makeImage({ photo, title, category, inGallery: false });
    await prisma.activity.create({ data: { icon, title, description, imageId: image.id, sortOrder: i } });
  }

  /* Spaces: [title, description, cover photo, extra photos] */
  const spaces: [string, string, string, string[]][] = [
    ['Խմբասենյակներ', 'Լուսավոր և ընդարձակ սենյակներ՝ հարմարեցված տարբեր տարիքային խմբերին։', 'rooms-1', ['learning-7', 'rooms-11']],
    ['Խաղասենյակներ', 'Զարգացնող խաղալիքներ, կոնստրուկտորներ և հանգստի անկյուններ։', 'play-5', ['rooms-7', 'rooms-12']],
    ['Քնելու սենյակ', 'Հանգիստ, մաքուր և հարմարավետ միջավայր ցերեկային քնի համար։', 'rooms-10', ['play-9']],
    ['Բակ', 'Կանաչ, անվտանգ և պարսպապատ բակ՝ ամենօրյա զբոսանքների համար։', 'rooms-4', ['rooms-2', 'outdoor-6']],
    ['Խաղահրապարակ', 'Անվտանգ ծածկույթով խաղահրապարակ՝ ճոճանակներով և սահարաններով։', 'rooms-8', ['rooms-3', 'rooms-14']],
    ['Սննդի տարածք', 'Մաքուր և հյուրընկալ սեղանատուն, որտեղ երեխաները միասին են սնվում։', 'rooms-15', ['rooms-9']],
  ];
  for (const [i, [title, description, coverPhoto, extraPhotos]] of spaces.entries()) {
    const cover = await makeImage({ photo: coverPhoto, title, category: 'ROOMS' });
    const extra = [];
    for (const photo of extraPhotos) extra.push(await makeImage({ photo, title: `${title} — լուսանկար`, category: 'ROOMS' }));
    await prisma.space.create({
      data: { title, description, coverId: cover.id, sortOrder: i, media: { create: extra.map((m, position) => ({ mediaId: m.id, position })) } },
    });
  }

  /* Daily life: [date, title, category, description, photos, youtube video?] */
  const daily: [string, string, string, string, string[], { id: string; title: string }?][] = [
    ['2026-10-02', 'Աշնանային ստեղծագործություն', 'CREATIVE', 'Այսօր մեր փոքրիկները ստեղծեցին իրենց աշնանային պատկերները՝ օգտագործելով տերևներ, գույներ և մեծ երևակայություն։', ['creative-2', 'creative-7', 'creative-4']],
    ['2026-10-01', 'Զբոսանք այգում', 'WALKS', 'Հավաքեցինք գույնզգույն տերևներ և ծանոթացանք աշնան նշաններին։', ['outdoor-3', 'outdoor-6']],
    ['2026-09-30', 'Թվերի աշխարհում', 'LEARNING', 'Խաղի միջոցով սովորեցինք հաշվել մինչև տասը և ճանաչել երկրաչափական պատկերները։', ['learning-3', 'learning-9']],
    ['2026-09-29', 'Երաժշտական ժամ', 'GAMES', 'Երգեցինք, պարեցինք և ծանոթացանք նոր երաժշտական գործիքների հետ։', ['music-2', 'music-3'], { id: 'e_04ZrNroTo', title: 'Երգում ենք «Ավտոբուսի անիվները»' }],
    ['2026-09-26', 'Փոքրիկ խոհարարներ', 'EVENTS', 'Միասին պատրաստեցինք մրգային աղցան և խոսեցինք առողջ սննդի մասին։', ['food-7', 'food-10', 'food-3']],
    ['2026-09-25', 'Կառուցում ենք քաղաք', 'GAMES', 'Կոնստրուկտորներից կառուցեցինք մեր երազանքների քաղաքը։', ['play-8', 'rooms-12']],
    ['2026-09-24', 'Հեքիաթի ժամ', 'LEARNING', 'Կարդացինք «Շատ քաղցած թրթուրը» և դիտեցինք մուլտֆիլմը։ Հետո յուրաքանչյուրը նկարեց իր թրթուրին։', ['learning-5', 'learning-1'], { id: '75NQK-Sm1YY', title: '«Շատ քաղցած թրթուրը» մուլտֆիլմ' }],
    ['2026-09-23', 'Ընկերության օր', 'GAMES', 'Խաղացինք թիմային խաղեր և սովորեցինք օգնել միմյանց։', ['play-7', 'play-2']],
  ];
  const galleryCat: Record<string, string> = { CREATIVE: 'CREATIVE', WALKS: 'WALKS', LEARNING: 'LEARNING', GAMES: 'GAMES', EVENTS: 'EVENTS' };
  for (const [date, title, category, description, photos, video] of daily) {
    const media = [];
    for (const photo of photos) media.push(await makeImage({ photo, title, category: galleryCat[category], takenAt: date }));
    if (video) media.push(await makeYoutube({ ...video, category: 'DAILY', takenAt: date }));
    await prisma.dailyActivity.create({
      data: { title, description, category, date: d(date), status: 'PUBLISHED', media: { create: media.map((m, position) => ({ mediaId: m.id, position })) } },
    });
  }
  await prisma.dailyActivity.create({
    data: { title: 'Թատերական փորձ (սևագիր)', description: 'Սևագիր գրառում՝ կայքում չի ցուցադրվում, մինչև չհրապարակեք։', category: 'CREATIVE', date: d('2026-10-03') },
  });

  /* Events: [slug, title, date, time, status, description, cover photo, gallery photos] */
  const events: [string, string, string, string, 'UPCOMING' | 'COMPLETED', string, string, string[]][] = [
    ['ashnanayin-ton', 'Աշնանային տոն', '2026-10-10', '11:00', 'UPCOMING', 'Աշնան բերքի տոն՝ երգերով, բանաստեղծություններով և ծնողների մասնակցությամբ։ Սպասում ենք բոլոր ընտանիքներին։', 'outdoor-2', []],
    ['grqi-shabat', 'Գրքի շաբաթ', '2026-11-05', '10:30', 'UPCOMING', 'Ամբողջ շաբաթ՝ ընթերցանություն, հեքիաթների բեմադրություն և գրքերի փոխանակում։ Ծնողները կարող են գալ և կարդալ իրենց սիրած գիրքը։', 'rooms-11', []],
    ['amanoryan-nerkayacum', 'Ամանորյա ներկայացում', '2026-12-25', '12:00', 'UPCOMING', 'Ամանորյա տոնական ներկայացում, որտեղ մեր փոքրիկները կհանդես գան ծնողների առջև։', 'events-5', []],
    ['usumnakan-tari-skizb', 'Ուսումնական տարվա մեկնարկ', '2026-09-01', '10:00', 'COMPLETED', 'Ուրախ հանդիպում՝ նոր ընկերներով, խաղերով և փուչիկներով։', 'events-4', ['events-1', 'play-4']],
    ['amarayin-cnndyan-orer', 'Ամառային ծննդյան օրեր', '2026-07-15', '16:00', 'COMPLETED', 'Միասին նշեցինք ամռանը ծնված բոլոր երեխաների ծննդյան օրերը՝ տորթով, երգերով և նվերներով։', 'events-8', ['events-6', 'events-4']],
    ['amarayin-pikrnik', 'Ամառային պիկնիկ', '2026-06-20', '11:30', 'COMPLETED', 'Բացօթյա խաղեր, մրգեր և շատ ժպիտներ։', 'events-3', ['outdoor-7', 'outdoor-1']],
    ['erexaneri-pashtpanutyan-or', 'Երեխաների պաշտպանության օր', '2026-06-01', '11:00', 'COMPLETED', 'Հունիսի 1-ին կազմակերպեցինք մեծ տոն բակում՝ մրցույթներով, դիմանկարչությամբ և ընտանեկան խաղերով։', 'outdoor-9', ['play-3', 'outdoor-4']],
  ];
  for (const [slug, title, date, time, status, description, coverPhoto, galleryPhotos] of events) {
    const cover = await makeImage({ photo: coverPhoto, title, category: 'EVENTS', takenAt: date, inGallery: status === 'COMPLETED' });
    const gallery = [];
    for (const photo of galleryPhotos) gallery.push(await makeImage({ photo, title, category: 'EVENTS', takenAt: date }));
    await prisma.event.create({
      data: {
        slug,
        title,
        date: d(date),
        time,
        status,
        description,
        location: 'Sunny Kids Club',
        coverId: cover.id,
        media: { create: gallery.map((m, position) => ({ mediaId: m.id, position })) },
      },
    });
  }

  /* Promotions */
  const promoImg = await makeImage({ photo: 'creative-9', title: 'Հատուկ առաջարկ', category: 'OTHER', inGallery: false });
  const siblingImg = await makeImage({ photo: 'family-1', title: 'Եղբայր-քույրերի զեղչ', category: 'OTHER', inGallery: false });
  const campImg = await makeImage({ photo: 'outdoor-5', title: 'Ամառային ճամբար', category: 'OTHER', inGallery: false });
  await prisma.promotion.createMany({
    data: [
      {
        title: 'Հատուկ առաջարկ նոր սաների համար',
        description: 'Գրանցվեք մինչև հոկտեմբերի 15-ը և ստացեք հատուկ պայմաններ։',
        imageId: promoImg.id,
        startDate: d('2026-09-15'),
        endDate: d('2026-10-15'),
        ctaLabel: 'Գրանցվել',
        ctaUrl: '/enroll',
        sortOrder: 0,
      },
      {
        title: 'Եղբայր-քույրերի զեղչ',
        description: 'Երկրորդ երեխայի համար՝ հատուկ պայմաններ։ Մանրամասների համար կապվեք մեզ հետ։',
        imageId: siblingImg.id,
        ctaLabel: 'Կապվել մեզ հետ',
        ctaUrl: '/contact',
        sortOrder: 1,
      },
      {
        title: 'Ամառային ճամբար 2026',
        description: 'Ավարտված ակցիա (օրինակ)։ Ավարտի ամսաթվից հետո այն ավտոմատ թաքցվում է կայքից։',
        imageId: campImg.id,
        startDate: d('2026-05-01'),
        endDate: d('2026-06-30'),
        sortOrder: 2,
      },
    ],
  });

  /* Testimonials — development placeholders only (hidden in production) */
  const testimonials: [string, string, string, string | null][] = [
    ['Անի (օրինակ)', 'Ավագ խմբի սանի մայրիկ', 'Sunny Kids Club-ում մեր երեխան ամեն օր սիրով է գնում։ Մեզ համար շատ կարևոր է ջերմ ու հոգատար միջավայրը։', 'family-3'],
    ['Արմեն (օրինակ)', 'Միջին խմբի սանի հայրիկ', 'Շատ ենք գնահատում, որ ամեն օր տեսնում ենք լուսանկարներ և գիտենք, թե ինչով է զբաղվել մեր փոքրիկը։', 'family-2'],
    ['Մարիամ (օրինակ)', 'Կրտսեր խմբի սանի մայրիկ', 'Հարմարվողականության շրջանն անցավ շատ մեղմ։ Շնորհակալություն դաստիարակների համբերության համար։', 'family-1'],
    ['Դավիթ (օրինակ)', 'Նախադպրոցական խմբի սանի հայրիկ', 'Մեկ տարում որդիս սովորեց կարդալ տառերը և շատ ընկերներ ձեռք բերեց։ Դպրոցին պատրաստ ենք։', 'family-4'],
  ];
  for (const [i, [parentName, relation, comment, photo]] of testimonials.entries()) {
    const image = photo ? await makeImage({ photo, title: parentName, category: 'OTHER', inGallery: false }) : null;
    await prisma.testimonial.create({ data: { parentName, relation, comment, photoId: image?.id, published: true, isPlaceholder: true, sortOrder: i } });
  }

  /* FAQ */
  const faq = [
    ['Քանի՞ տարեկանից եք ընդունում երեխաներին', 'Մենք ընդունում ենք 2-ից 6 տարեկան երեխաների՝ տարիքային խմբերով։'],
    ['Որքա՞ն է խմբերում երեխաների թիվը', 'Մեր խմբերը փոքր են, որպեսզի յուրաքանչյուր երեխա ստանա անհատական ուշադրություն։'],
    ['Ինչպե՞ս է անցնում հարմարվողականության շրջանը', 'Առաջին օրերին երեխան կարող է մնալ կարճ ժամանակով, ծնողի հետ միասին։ Ժամանակը աստիճանաբար ավելանում է։'],
    ['Կարո՞ղ եմ տեսնել, թե ինչով է զբաղվում երեխաս', 'Այո։ «Մեր առօրյան» բաժնում մենք պարբերաբար հրապարակում ենք լուսանկարներ և տեսանյութեր։'],
    ['Ինչպե՞ս է կազմակերպված սնունդը', 'Օրական չորս անգամ՝ նախաճաշ, ճաշ, խորտիկ և ընթրիք։ Ալերգիաները և հատուկ պահանջները հաշվի են առնվում։'],
    ['Ինչպե՞ս գրանցվել', 'Լրացրեք առցանց հայտը կամ զանգահարեք մեզ։ Մենք կկապվենք Ձեզ հետ և կհրավիրենք ծանոթանալու։'],
    ['Կա՞ արդյոք բուժաշխատող', 'Այո, մանկապարտեզում ամեն օր աշխատում է բուժքույր, ով հետևում է երեխաների առողջությանը։'],
    ['Կարո՞ղ եմ վերցնել երեխային ավելի շուտ', 'Իհարկե։ Խնդրում ենք նախապես տեղեկացնել դաստիարակին, որպեսզի երեխան պատրաստ լինի։'],
  ];
  await prisma.faq.createMany({ data: faq.map(([question, answer], i) => ({ question, answer, sortOrder: i })) });

  /* Food */
  const meals: [MealType, string, string, string, string][] = [
    ['BREAKFAST', 'Նախաճաշ', '09:00', 'Շիլաներ, կաթնամթերք, ձու, թարմ հաց և մրգեր։', 'food-1'],
    ['LUNCH', 'Ճաշ', '12:00', 'Տաք ապուր, երկրորդ ուտեստ բանջարեղենով և թարմ աղցան։', 'food-9'],
    ['SNACK', 'Խորտիկ', '15:30', 'Մրգեր, յոգուրտ, տնական թխվածքներ։', 'food-3'],
    ['DINNER', 'Ընթրիք', '17:30', 'Թեթև ընթրիք՝ բանջարեղենային ուտեստներ և կաթնամթերք։', 'food-8'],
  ];
  for (const [i, [type, title, time, description, photo]] of meals.entries()) {
    const image = await makeImage({ photo, title, category: 'FOOD', inGallery: false });
    await prisma.meal.create({ data: { type, title, time, description, imageId: image.id, sortOrder: i } });
  }
  const menu: Record<number, [string, string, string, string]> = {
    1: ['Վարսակի շիլա մրգերով', 'Հավի ապուր, բրինձ բանջարեղենով', 'Խնձոր, յոգուրտ', 'Կաթնաշոռով բլիթներ'],
    2: ['Ձվածեղ, թարմ հաց', 'Ոսպով ապուր, հնդկաձավար կոտլետով', 'Բանան, կեֆիր', 'Բանջարեղենային շոգեխաշած'],
    3: ['Մանանայի շիլա', 'Բորշ, մակարոն հավով', 'Տնական թխվածք, կաթ', 'Կարտոֆիլի պյուրե, աղցան'],
    4: ['Կաթնաշոռ, մեղր, մրգեր', 'Բանջարեղենային ապուր, ձուկ բրնձով', 'Տանձ, յոգուրտ', 'Ձվածեղ բանջարեղենով'],
    5: ['Բրնձի կաթնային շիլա', 'Մսով ապուր, բուլղուր', 'Մրգային աղցան', 'Լոբով ճաշ, հաց'],
  };
  const types: MealType[] = ['BREAKFAST', 'LUNCH', 'SNACK', 'DINNER'];
  await prisma.menuEntry.createMany({ data: Object.entries(menu).flatMap(([w, dishes]) => dishes.map((dish, i) => ({ weekday: Number(w), mealType: types[i], dishes: dish }))) });

  /* Gallery-only photos */
  const galleryOnly: [string, string, string, string][] = [
    ['Խաղ բակում', 'GAMES', 'rooms-14', '2026-09-18'],
    ['Ընթերցանության անկյուն', 'ROOMS', 'learning-10', '2026-09-18'],
    ['Աշնանային զբոսանք', 'WALKS', 'outdoor-4', '2026-09-17'],
    ['Բարության դաս', 'LEARNING', 'learning-2', '2026-09-16'],
    ['Տառերից բառեր', 'LEARNING', 'learning-4', '2026-09-16'],
    ['Այբուբենի պաստառ', 'LEARNING', 'creative-1', '2026-09-15'],
    ['Մեր մատիտները', 'CREATIVE', 'creative-5', '2026-09-15'],
    ['Գունավոր մատիտներ', 'CREATIVE', 'creative-8', '2026-09-14'],
    ['Ուկուլելե', 'DAILY', 'music-5', '2026-09-12'],
    ['Թմբուկներ', 'DAILY', 'music-4', '2026-09-12'],
    ['Դաշնամուր', 'DAILY', 'music-6', '2026-09-11'],
    ['Առողջ նախաճաշ', 'FOOD', 'food-5', '2026-09-11'],
    ['Ապուր կոլոլակով', 'FOOD', 'food-2', '2026-09-10'],
    ['Թարմ աղցան', 'FOOD', 'food-4', '2026-09-10'],
    ['Ամանորյա զարդեր', 'EVENTS', 'events-2', '2025-12-24'],
    ['Նվերներ տոնածառի տակ', 'EVENTS', 'events-7', '2025-12-24'],
  ];
  for (const [title, category, photo, takenAt] of galleryOnly) await makeImage({ photo, title, category, takenAt });
  await makeImage({ photo: 'play-6', title: 'Մասնավոր լուսանկար (միայն ադմին)', category: 'DAILY', takenAt: '2026-09-19', inGallery: true }).then((m) =>
    prisma.media.update({ where: { id: m.id }, data: { isPublic: false } }),
  );

  /* Inbox (example messages) */
  const messages: { type: MessageType; name: string; phone: string; email: string; message: string; childAge?: string; startDate?: string; read?: boolean; createdAt: string }[] = [
    { type: 'ENROLLMENT', name: 'Լիլիթ Հակոբյան (օրինակ)', phone: '+374 91 111 111', email: 'lilit@example.com', message: 'Ցանկանում ենք այցելել և ծանոթանալ։', childAge: '3 տարեկան', startDate: '2026-11-01', createdAt: '2026-10-01T09:15:00Z' },
    { type: 'CONTACT', name: 'Գոռ Սարգսյան (օրինակ)', phone: '+374 77 222 222', email: 'gor@example.com', message: 'Բարև Ձեզ, ունե՞ք ազատ տեղեր կրտսեր խմբում։ Ո՞րն է ամսական վճարը։', createdAt: '2026-09-30T14:40:00Z' },
    { type: 'ENROLLMENT', name: 'Նարե Պետրոսյան (օրինակ)', phone: '+374 93 333 333', email: 'nare@example.com', message: '', childAge: '5 տարեկան', startDate: '2026-10-15', read: true, createdAt: '2026-09-27T11:05:00Z' },
    { type: 'CONTACT', name: 'Արամ Գրիգորյան (օրինակ)', phone: '+374 98 444 444', email: 'aram@example.com', message: 'Շնորհակալություն աշնանային տոնի հրավերի համար, անպայման կգանք։', read: true, createdAt: '2026-09-25T18:20:00Z' },
  ];
  await prisma.contactMessage.createMany({
    data: messages.map((m) => ({ ...m, childAge: m.childAge ?? '', startDate: m.startDate ?? '', read: m.read ?? false, createdAt: new Date(m.createdAt) })),
  });

  console.log(`Seed complete: ${seedCounter} media items created.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
