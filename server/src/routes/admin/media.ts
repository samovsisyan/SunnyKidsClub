import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { HttpError, notFound, parse, zDate, zIds } from '../../lib/http.js';
import { serializeMedia } from '../../lib/serialize.js';
import { IMAGE_TYPES, VIDEO_TYPES, cleanupTemp, parseExternalVideo, removeStoredFiles, storeImage, storePoster, storeVideo, uploader } from '../../lib/upload.js';
import { MEDIA_CATEGORIES } from '../../lib/constants.js';
import { getSetting } from '../../lib/settings.js';
import { today } from '../../lib/dates.js';

export const mediaRouter = Router();

const bool = z.union([z.boolean(), z.enum(['true', 'false']).transform((v) => v === 'true')]);

const metaSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(4000).optional(),
  alt: z.string().max(300).optional(),
  category: z.enum(MEDIA_CATEGORIES).optional(),
  takenAt: zDate.optional(),
  isPublic: bool.optional(),
  published: bool.optional(),
  inGallery: bool.optional(),
});

async function nextSortOrder() {
  const agg = await prisma.media.aggregate({ _min: { sortOrder: true } });
  return (agg._min.sortOrder ?? 0) - 1;
}

async function defaults() {
  const privacy = await getSetting('privacy');
  return { isPublic: privacy.defaultPublic !== false };
}

mediaRouter.get('/', async (req, res) => {
  const q = parse(
    z.object({
      type: z.enum(['IMAGE', 'VIDEO']).optional(),
      category: z.string().optional(),
      visibility: z.enum(['public', 'private']).optional(),
      status: z.enum(['published', 'draft']).optional(),
      inGallery: z.enum(['true', 'false']).optional(),
      search: z.string().max(100).optional(),
      ids: z.string().optional(),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(200).default(48),
    }),
    req.query,
  );
  const where: Prisma.MediaWhereInput = {};
  if (q.type) where.type = q.type;
  if (q.category) where.category = q.category;
  if (q.visibility) where.isPublic = q.visibility === 'public';
  if (q.status) where.published = q.status === 'published';
  if (q.inGallery) where.inGallery = q.inGallery === 'true';
  if (q.ids) where.id = { in: q.ids.split(',') };
  if (q.search) where.OR = [{ title: { contains: q.search, mode: 'insensitive' } }, { description: { contains: q.search, mode: 'insensitive' } }];
  const [items, total] = await Promise.all([
    prisma.media.findMany({ where, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }], skip: (q.page - 1) * q.limit, take: q.limit }),
    prisma.media.count({ where }),
  ]);
  res.json({ items: items.map(serializeMedia), total, page: q.page, pages: Math.max(1, Math.ceil(total / q.limit)) });
});

/** Upload one file per request (the client uploads in parallel with per-file progress). */
mediaRouter.post(
  '/upload',
  uploader.fields([
    { name: 'file', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  async (req, res) => {
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const file = files?.file?.[0];
    const thumb = files?.thumbnail?.[0];
    try {
      if (!file) throw new HttpError(400, 'Ֆայլը ընտրված չէ');
      const meta = parse(metaSchema, req.body);
      const base = {
        ...(await defaults()),
        ...meta,
        title: meta.title ?? '',
        takenAt: meta.takenAt ?? today(),
        sortOrder: await nextSortOrder(),
      };
      let data: Prisma.MediaCreateInput;
      if (IMAGE_TYPES.includes(file.mimetype)) {
        if (thumb) await cleanupTemp([thumb]);
        data = { ...base, type: 'IMAGE', ...(await storeImage(file)) };
      } else if (VIDEO_TYPES.includes(file.mimetype)) {
        const video = await storeVideo(file);
        const poster = thumb ? await storePoster(thumb) : {};
        data = { ...base, type: 'VIDEO', ...video, ...poster };
      } else {
        throw new HttpError(415, 'Ֆայլի տեսակը չի աջակցվում');
      }
      const media = await prisma.media.create({ data });
      res.status(201).json(serializeMedia(media));
    } catch (e) {
      await cleanupTemp([file, thumb].filter(Boolean) as Express.Multer.File[]);
      throw e;
    }
  },
);

mediaRouter.post('/external', async (req, res) => {
  const body = parse(metaSchema.extend({ url: z.string().url().max(500) }), req.body);
  const ext = await parseExternalVideo(body.url);
  const { url, ...meta } = body;
  const media = await prisma.media.create({
    data: { ...(await defaults()), ...meta, title: meta.title ?? '', takenAt: meta.takenAt ?? today(), type: 'VIDEO', externalUrl: url, ...ext, sortOrder: await nextSortOrder() },
  });
  res.status(201).json(serializeMedia(media));
});

mediaRouter.patch('/:id', async (req, res) => {
  const data = parse(metaSchema, req.body);
  const media = await prisma.media.update({ where: { id: req.params.id }, data });
  res.json(serializeMedia(media));
});

mediaRouter.post('/:id/thumbnail', uploader.single('thumbnail'), async (req, res) => {
  const current = await prisma.media.findUnique({ where: { id: req.params.id as string } });
  if (!current) {
    if (req.file) await cleanupTemp([req.file]);
    throw notFound('Ֆայլը');
  }
  if (!req.file) throw new HttpError(400, 'Նկարը ընտրված չէ');
  if (current.type !== 'VIDEO') {
    await cleanupTemp([req.file]);
    throw new HttpError(400, 'Շապիկ կարելի է ավելացնել միայն տեսանյութին');
  }
  const poster = await storePoster(req.file);
  if (current.thumbKey) await removeStoredFiles({ key: null, thumbKey: current.thumbKey });
  const media = await prisma.media.update({ where: { id: current.id }, data: { thumbKey: poster.thumbKey } });
  res.json(serializeMedia(media));
});

mediaRouter.delete('/:id', async (req, res) => {
  const media = await prisma.media.delete({ where: { id: req.params.id } });
  await removeStoredFiles(media);
  res.json({ ok: true });
});

mediaRouter.post('/bulk', async (req, res) => {
  const { ids, action } = parse(
    z.object({ ids: zIds.min(1), action: z.enum(['publish', 'unpublish', 'public', 'private', 'gallery-on', 'gallery-off', 'delete']) }),
    req.body,
  );
  if (action === 'delete') {
    const items = await prisma.media.findMany({ where: { id: { in: ids } } });
    await prisma.media.deleteMany({ where: { id: { in: ids } } });
    await Promise.all(items.map(removeStoredFiles));
  } else {
    const data: Prisma.MediaUpdateManyMutationInput = {
      publish: { published: true },
      unpublish: { published: false },
      public: { isPublic: true },
      private: { isPublic: false },
      'gallery-on': { inGallery: true },
      'gallery-off': { inGallery: false },
    }[action];
    await prisma.media.updateMany({ where: { id: { in: ids } }, data });
  }
  res.json({ ok: true });
});

mediaRouter.post('/reorder', async (req, res) => {
  const { ids } = parse(z.object({ ids: zIds }), req.body);
  // Re-use the slots currently held by these items so ordering relative to other pages is preserved.
  const current = await prisma.media.findMany({ where: { id: { in: ids } }, select: { sortOrder: true } });
  const slots = current.map((m) => m.sortOrder).sort((a, b) => a - b);
  for (let i = 1; i < slots.length; i++) if (slots[i] <= slots[i - 1]) slots[i] = slots[i - 1] + 1;
  await prisma.$transaction(ids.slice(0, slots.length).map((id, i) => prisma.media.update({ where: { id }, data: { sortOrder: slots[i] } })));
  res.json({ ok: true });
});
