import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { HttpError, notFound, parse } from '../lib/http.js';
import { config } from '../config.js';
import { today } from '../lib/dates.js';
import { publicMedia, serializeRecord } from '../lib/serialize.js';
import { getAllSettings, resolveSettingMedia } from '../lib/settings.js';
import { effectiveEventStatus } from './admin/index.js';

export const publicRouter = Router();

const visibleMedia: Prisma.MediaWhereInput = { isPublic: true, published: true };
const linkedVisible = { media: { where: { media: visibleMedia }, include: { media: true }, orderBy: { position: 'asc' } } } as const;
const pub = <T extends Record<string, unknown>>(r: T) => serializeRecord(r, true);

publicRouter.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache');
  next();
});

publicRouter.get('/site', async (_req, res) => {
  const s = await getAllSettings();
  const [site, about, contact, parents, food] = await resolveSettingMedia([s.site, s.about, s.contact, s.parents, s.food], true);
  res.json({ site, about, contact, parents, food, privacy: { showChildNames: s.privacy.showChildNames === true } });
});

/* ---------- Daily life ---------- */

const dailyWhere = (q: { category?: string; date?: string; month?: string }): Prisma.DailyActivityWhereInput => {
  const where: Prisma.DailyActivityWhereInput = { status: 'PUBLISHED' };
  if (q.category) where.category = q.category;
  if (q.date) where.date = new Date(`${q.date}T00:00:00Z`);
  else if (q.month) {
    const start = new Date(`${q.month}-01T00:00:00Z`);
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);
    where.date = { gte: start, lt: end };
  }
  return where;
};

publicRouter.get('/daily', async (req, res) => {
  const q = parse(
    z.object({
      category: z.string().max(30).optional(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(30).default(8),
    }),
    req.query,
  );
  const where = dailyWhere(q);
  const [items, total] = await Promise.all([
    prisma.dailyActivity.findMany({ where, orderBy: [{ date: 'desc' }, { createdAt: 'desc' }], skip: (q.page - 1) * q.limit, take: q.limit, include: linkedVisible }),
    prisma.dailyActivity.count({ where }),
  ]);
  res.json({
    items: items.map(({ status: _s, ...d }) => pub(d)),
    total,
    page: q.page,
    pages: Math.max(1, Math.ceil(total / q.limit)),
  });
});

/** Dates that have published activities (for browsing by date). */
publicRouter.get('/daily/dates', async (_req, res) => {
  const rows = await prisma.dailyActivity.groupBy({ by: ['date'], where: { status: 'PUBLISHED' }, _count: { _all: true }, orderBy: { date: 'desc' }, take: 120 });
  res.json({ items: rows.map((r) => ({ date: r.date.toISOString().slice(0, 10), count: r._count._all })) });
});

/* ---------- Simple lists ---------- */

publicRouter.get('/schedule', async (_req, res) => {
  const items = await prisma.scheduleItem.findMany({ where: { published: true }, orderBy: [{ sortOrder: 'asc' }, { time: 'asc' }] });
  res.json({ items: items.map(({ id, time, title, description }) => ({ id, time, title, description })) });
});

publicRouter.get('/activities', async (_req, res) => {
  const items = await prisma.activity.findMany({ where: { published: true }, orderBy: { sortOrder: 'asc' }, include: { image: true } });
  res.json({ items: items.map(pub) });
});

publicRouter.get('/spaces', async (_req, res) => {
  const items = await prisma.space.findMany({ where: { published: true }, orderBy: { sortOrder: 'asc' }, include: { cover: true, ...linkedVisible } });
  res.json({ items: items.map(pub) });
});

publicRouter.get('/testimonials', async (_req, res) => {
  const items = await prisma.testimonial.findMany({
    // Development placeholders never reach the production website.
    where: { published: true, ...(config.isProd ? { isPlaceholder: false } : {}) },
    orderBy: { sortOrder: 'asc' },
    include: { photo: true },
  });
  res.json({ items: items.map(({ id, parentName, relation, comment, photo }) => ({ id, parentName, relation, comment, photo: publicMedia(photo) })) });
});

publicRouter.get('/faq', async (_req, res) => {
  const items = await prisma.faq.findMany({ where: { published: true }, orderBy: { sortOrder: 'asc' } });
  res.json({ items: items.map(({ id, question, answer }) => ({ id, question, answer })) });
});

publicRouter.get('/food', async (_req, res) => {
  const [meals, menu] = await Promise.all([
    prisma.meal.findMany({ where: { published: true }, orderBy: { sortOrder: 'asc' }, include: { image: true } }),
    prisma.menuEntry.findMany({ orderBy: { weekday: 'asc' } }),
  ]);
  res.json({ meals: meals.map(pub), menu });
});

const activePromotionWhere = (): Prisma.PromotionWhereInput => {
  const t = today();
  return { active: true, AND: [{ OR: [{ startDate: null }, { startDate: { lte: t } }] }, { OR: [{ endDate: null }, { endDate: { gte: t } }] }] };
};

publicRouter.get('/promotions', async (_req, res) => {
  const items = await prisma.promotion.findMany({ where: activePromotionWhere(), orderBy: { sortOrder: 'asc' }, include: { image: true } });
  res.json({ items: items.map(({ active: _a, ...p }) => pub(p)) });
});

/* ---------- Events ---------- */

publicRouter.get('/events', async (req, res) => {
  const { status } = parse(z.object({ status: z.enum(['upcoming', 'completed']).optional() }), req.query);
  const t = today();
  const where: Prisma.EventWhereInput = { published: true };
  if (status === 'upcoming') Object.assign(where, { status: 'UPCOMING', date: { gte: t } });
  if (status === 'completed') where.OR = [{ status: 'COMPLETED' }, { date: { lt: t } }];
  const items = await prisma.event.findMany({
    where,
    orderBy: { date: status === 'upcoming' ? 'asc' : 'desc' },
    take: 60,
    include: { cover: true, ...linkedVisible },
  });
  res.json({ items: items.map((e) => ({ ...pub(e), status: effectiveEventStatus(e), mediaCount: e.media.length })) });
});

publicRouter.get('/events/:slug', async (req, res) => {
  const e = await prisma.event.findFirst({ where: { slug: req.params.slug, published: true }, include: { cover: true, ...linkedVisible } });
  if (!e) throw notFound('Միջոցառումը');
  res.json({ ...pub(e), status: effectiveEventStatus(e) });
});

/* ---------- Gallery ---------- */

publicRouter.get('/gallery', async (req, res) => {
  const q = parse(
    z.object({
      category: z.string().max(30).optional(),
      type: z.enum(['IMAGE', 'VIDEO']).optional(),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(60).default(24),
    }),
    req.query,
  );
  const where: Prisma.MediaWhereInput = { ...visibleMedia, inGallery: true };
  if (q.category) where.category = q.category;
  if (q.type) where.type = q.type;
  const [items, total] = await Promise.all([
    prisma.media.findMany({ where, orderBy: [{ takenAt: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }], skip: (q.page - 1) * q.limit, take: q.limit }),
    prisma.media.count({ where }),
  ]);
  res.json({ items: items.map(publicMedia), total, page: q.page, pages: Math.max(1, Math.ceil(total / q.limit)) });
});

/* ---------- Home (aggregated, one request) ---------- */

publicRouter.get('/home', async (_req, res) => {
  const t = today();
  const [daily, activities, schedule, events, promotions, testimonials, gallery] = await Promise.all([
    prisma.dailyActivity.findMany({ where: { status: 'PUBLISHED' }, orderBy: [{ date: 'desc' }, { createdAt: 'desc' }], take: 3, include: linkedVisible }),
    prisma.activity.findMany({ where: { published: true }, orderBy: { sortOrder: 'asc' }, include: { image: true } }),
    prisma.scheduleItem.findMany({ where: { published: true }, orderBy: [{ sortOrder: 'asc' }, { time: 'asc' }] }),
    prisma.event.findMany({ where: { published: true, status: 'UPCOMING', date: { gte: t } }, orderBy: { date: 'asc' }, take: 3, include: { cover: true } }),
    prisma.promotion.findMany({ where: activePromotionWhere(), orderBy: { sortOrder: 'asc' }, take: 3, include: { image: true } }),
    prisma.testimonial.findMany({ where: { published: true, ...(config.isProd ? { isPlaceholder: false } : {}) }, orderBy: { sortOrder: 'asc' }, take: 6, include: { photo: true } }),
    prisma.media.findMany({ where: { ...visibleMedia, inGallery: true }, orderBy: [{ takenAt: 'desc' }, { createdAt: 'desc' }], take: 8 }),
  ]);
  res.json({
    daily: daily.map(({ status: _s, ...d }) => pub(d)),
    activities: activities.map(pub),
    schedule: schedule.map(({ id, time, title, description }) => ({ id, time, title, description })),
    events: events.map((e) => ({ ...pub(e), status: 'UPCOMING' })),
    promotions: promotions.map(({ active: _a, ...p }) => pub(p)),
    testimonials: testimonials.map(({ id, parentName, relation, comment, photo }) => ({ id, parentName, relation, comment, photo: publicMedia(photo) })),
    gallery: gallery.map(publicMedia),
  });
});

/* ---------- Contact & enrollment ---------- */

const messageLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Չափազանց շատ հաղորդագրություններ։ Խնդրում ենք փորձել մի փոքր ուշ։' },
});

publicRouter.post('/messages', messageLimiter, async (req, res) => {
  const body = parse(
    z.object({
      type: z.enum(['CONTACT', 'ENROLLMENT']).default('CONTACT'),
      name: z.string().trim().min(2, 'Խնդրում ենք նշել Ձեր անունը').max(120),
      phone: z.string().trim().min(6, 'Խնդրում ենք նշել հեռախոսահամարը').max(40).regex(/^[+\d\s()-]+$/, 'Հեռախոսահամարը սխալ է'),
      email: z.union([z.string().trim().email('Էլ. հասցեն սխալ է').max(200), z.literal('')]).default(''),
      message: z.string().trim().max(3000).default(''),
      childAge: z.string().trim().max(40).default(''),
      startDate: z.string().trim().max(40).default(''),
      website: z.string().optional(), // honeypot
    }),
    req.body,
  );
  if (body.website) {
    res.status(201).json({ ok: true });
    return;
  }
  if (body.type === 'CONTACT' && !body.message) throw new HttpError(400, 'Խնդրում ենք գրել հաղորդագրությունը');
  const { website: _w, ...data } = body;
  await prisma.contactMessage.create({ data });
  res.status(201).json({ ok: true });
});
