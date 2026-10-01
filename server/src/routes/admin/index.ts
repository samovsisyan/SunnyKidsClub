import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { requireAdmin } from '../../lib/auth.js';
import { HttpError, parse, zDate, zIds, zOptDate, zOptId, zTime } from '../../lib/http.js';
import { DAILY_CATEGORIES, SETTING_KEYS, type SettingKey } from '../../lib/constants.js';
import { daysAgo, today } from '../../lib/dates.js';
import { slugify } from '../../lib/slug.js';
import { getSetting, resolveSettingMedia, saveSetting } from '../../lib/settings.js';
import { serializeRecord } from '../../lib/serialize.js';
import { crudRouter, mediaInclude, mediaLinks } from './crud.js';
import { mediaRouter } from './media.js';

export const adminRouter = Router();
adminRouter.use(requireAdmin);

const text = (max = 200) => z.string().trim().max(max);
const reqText = (max = 200, msg = 'Դաշտը պարտադիր է') => z.string().trim().min(1, msg).max(max);

adminRouter.use('/media', mediaRouter);

/* ---------- Simple content ---------- */

adminRouter.use(
  '/activities',
  crudRouter({
    model: 'activity',
    schema: z.object({ title: reqText(), description: text(2000).default(''), icon: text(40).default(''), imageId: zOptId, published: z.boolean().default(true) }),
    include: { image: true },
  }),
);

adminRouter.use(
  '/schedule',
  crudRouter({
    model: 'scheduleItem',
    schema: z.object({ time: zTime, title: reqText(), description: text(1000).default(''), published: z.boolean().default(true) }),
  }),
);

adminRouter.use(
  '/testimonials',
  crudRouter({
    model: 'testimonial',
    schema: z.object({
      parentName: reqText(120),
      relation: text(120).default(''),
      comment: reqText(2000),
      photoId: zOptId,
      published: z.boolean().default(false),
    }),
    include: { photo: true },
    // Editing a placeholder turns it into real content.
    toData: (i, id) => (id ? { ...i, isPlaceholder: false } : i),
  }),
);

adminRouter.use(
  '/faq',
  crudRouter({
    model: 'faq',
    schema: z.object({ question: reqText(300), answer: reqText(4000), published: z.boolean().default(true) }),
  }),
);

adminRouter.use(
  '/promotions',
  crudRouter({
    model: 'promotion',
    schema: z.object({
      title: reqText(),
      description: text(3000).default(''),
      imageId: zOptId,
      startDate: zOptDate,
      endDate: zOptDate,
      ctaLabel: text(60).default('Գրանցվել'),
      ctaUrl: text(300).regex(/^(\/|https?:\/\/|tel:|mailto:)/, 'Հղումը պետք է սկսվի «/», «https://», «tel:» կամ «mailto:»-ով').default('/enroll'),
      active: z.boolean().default(true),
    }),
    include: { image: true },
    present: (p) => {
      const t = today().toISOString().slice(0, 10);
      const expired = !!p.endDate && (p.endDate as string) < t;
      const scheduled = !!p.startDate && (p.startDate as string) > t;
      return { ...p, expired, scheduled, live: Boolean(p.active) && !expired && !scheduled };
    },
  }),
);

adminRouter.use(
  '/spaces',
  crudRouter({
    model: 'space',
    schema: z.object({ title: reqText(), description: text(2000).default(''), coverId: zOptId, published: z.boolean().default(true), mediaIds: zIds.optional() }),
    include: { cover: true, ...mediaInclude },
    toData: ({ mediaIds, ...rest }, id) => ({ ...rest, media: mediaLinks(mediaIds, !!id) }),
  }),
);

adminRouter.use(
  '/meals',
  crudRouter({
    model: 'meal',
    schema: z.object({
      type: z.enum(['BREAKFAST', 'LUNCH', 'SNACK', 'DINNER']),
      title: reqText(),
      time: text(20).default(''),
      description: text(2000).default(''),
      imageId: zOptId,
      published: z.boolean().default(true),
    }),
    include: { image: true },
  }),
);

/* ---------- Daily life ---------- */

adminRouter.use(
  '/daily',
  crudRouter({
    model: 'dailyActivity',
    reorderable: false,
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    schema: z.object({
      title: reqText(),
      description: text(5000).default(''),
      date: zDate,
      category: z.enum(DAILY_CATEGORIES),
      status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
      mediaIds: zIds.default([]),
    }),
    include: mediaInclude,
    toData: ({ mediaIds, ...rest }, id) => ({ ...rest, media: mediaLinks(mediaIds, !!id) }),
  }),
);

/* ---------- Events ---------- */

async function uniqueSlug(title: string, ignoreId?: string) {
  const base = slugify(title);
  let slug = base;
  for (let i = 2; ; i++) {
    const existing = await prisma.event.findUnique({ where: { slug } });
    if (!existing || existing.id === ignoreId) return slug;
    slug = `${base}-${i}`;
  }
}

export function effectiveEventStatus(e: { status: string; date: string | Date }) {
  const d = typeof e.date === 'string' ? e.date : e.date.toISOString().slice(0, 10);
  return e.status === 'COMPLETED' || d < today().toISOString().slice(0, 10) ? 'COMPLETED' : 'UPCOMING';
}

adminRouter.use(
  '/events',
  crudRouter({
    model: 'event',
    reorderable: false,
    orderBy: [{ date: 'desc' }],
    schema: z.object({
      title: reqText(),
      description: text(8000).default(''),
      date: zDate,
      time: z.union([zTime, z.literal('')]).default(''),
      location: text(200).default(''),
      status: z.enum(['UPCOMING', 'COMPLETED']).default('UPCOMING'),
      published: z.boolean().default(true),
      coverId: zOptId,
      mediaIds: zIds.default([]),
    }),
    include: { cover: true, ...mediaInclude },
    toData: async ({ mediaIds, ...rest }, id) => ({
      ...rest,
      ...(rest.title ? { slug: await uniqueSlug(rest.title, id) } : {}),
      media: mediaLinks(mediaIds, !!id),
    }),
    present: (e) => ({ ...e, effectiveStatus: effectiveEventStatus(e as { status: string; date: string }) }),
  }),
);

/* ---------- Weekly menu ---------- */

adminRouter.get('/menu', async (_req, res) => {
  res.json({ items: await prisma.menuEntry.findMany({ orderBy: [{ weekday: 'asc' }] }) });
});

adminRouter.put('/menu', async (req, res) => {
  const { items } = parse(
    z.object({
      items: z.array(z.object({ weekday: z.number().int().min(1).max(7), mealType: z.enum(['BREAKFAST', 'LUNCH', 'SNACK', 'DINNER']), dishes: text(500) })).max(28),
    }),
    req.body,
  );
  await prisma.$transaction([prisma.menuEntry.deleteMany({}), prisma.menuEntry.createMany({ data: items.filter((i) => i.dishes) })]);
  res.json({ items: await prisma.menuEntry.findMany() });
});

/* ---------- Settings ---------- */

const isSettingKey = (k: string): k is SettingKey => (SETTING_KEYS as readonly string[]).includes(k);

adminRouter.get('/settings/:key', async (req, res) => {
  const key = req.params.key;
  if (!isSettingKey(key)) throw new HttpError(404, 'Անհայտ բաժին');
  const value = await getSetting(key);
  const [resolved] = await resolveSettingMedia([value], false);
  res.json({ value, resolved });
});

adminRouter.put('/settings/:key', async (req, res) => {
  const key = req.params.key;
  if (!isSettingKey(key)) throw new HttpError(404, 'Անհայտ բաժին');
  const value = parse(z.record(z.string(), z.unknown()), req.body);
  if (JSON.stringify(value).length > 100_000) throw new HttpError(413, 'Բովանդակությունը չափազանց մեծ է');
  // Never persist resolved media objects, only ids.
  for (const k of Object.keys(value)) if (/Media$/.test(k)) delete value[k];
  const merged = { ...(await getSetting(key)), ...value };
  await saveSetting(key, merged);
  const [resolved] = await resolveSettingMedia([merged], false);
  res.json({ value: merged, resolved });
});

/* ---------- Messages ---------- */

adminRouter.get('/messages', async (req, res) => {
  const q = parse(z.object({ type: z.enum(['CONTACT', 'ENROLLMENT']).optional(), unread: z.enum(['true']).optional() }), req.query);
  const items = await prisma.contactMessage.findMany({
    where: { ...(q.type ? { type: q.type } : {}), ...(q.unread ? { read: false } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
  res.json({ items });
});

adminRouter.patch('/messages/:id', async (req, res) => {
  const { read } = parse(z.object({ read: z.boolean() }), req.body);
  res.json(await prisma.contactMessage.update({ where: { id: req.params.id }, data: { read } }));
});

adminRouter.delete('/messages/:id', async (req, res) => {
  await prisma.contactMessage.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

/* ---------- Dashboard ---------- */

adminRouter.get('/stats', async (_req, res) => {
  const week = daysAgo(7);
  const t = today();
  const [newPhotos, newVideos, totalPhotos, totalVideos, privateMedia, upcomingEvents, activePromotions, unreadMessages, dailyPublished, dailyDrafts, recentMessages, recentDaily, nextEvents] =
    await Promise.all([
      prisma.media.count({ where: { type: 'IMAGE', createdAt: { gte: week } } }),
      prisma.media.count({ where: { type: 'VIDEO', createdAt: { gte: week } } }),
      prisma.media.count({ where: { type: 'IMAGE' } }),
      prisma.media.count({ where: { type: 'VIDEO' } }),
      prisma.media.count({ where: { isPublic: false } }),
      prisma.event.count({ where: { status: 'UPCOMING', date: { gte: t } } }),
      prisma.promotion.count({ where: { active: true, OR: [{ endDate: null }, { endDate: { gte: t } }], AND: [{ OR: [{ startDate: null }, { startDate: { lte: t } }] }] } }),
      prisma.contactMessage.count({ where: { read: false } }),
      prisma.dailyActivity.count({ where: { status: 'PUBLISHED' } }),
      prisma.dailyActivity.count({ where: { status: 'DRAFT' } }),
      prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
      prisma.dailyActivity.findMany({ orderBy: [{ date: 'desc' }, { createdAt: 'desc' }], take: 5, include: mediaInclude }),
      prisma.event.findMany({ where: { status: 'UPCOMING', date: { gte: t } }, orderBy: { date: 'asc' }, take: 3, include: { cover: true } }),
    ]);
  res.json({
    counts: { newPhotos, newVideos, totalPhotos, totalVideos, privateMedia, upcomingEvents, activePromotions, unreadMessages, dailyPublished, dailyDrafts },
    recentMessages,
    recentDaily: recentDaily.map((d) => serializeRecord(d)),
    nextEvents: nextEvents.map((e) => serializeRecord(e)),
  });
});
