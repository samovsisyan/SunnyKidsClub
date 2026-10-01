import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { notFound, parse, zIds } from '../../lib/http.js';
import { serializeRecord } from '../../lib/serialize.js';

// Prisma delegates share the same method signatures; a loose type keeps the factory generic.
type Delegate = {
  findMany(args: unknown): Promise<Record<string, unknown>[]>;
  findUnique(args: unknown): Promise<Record<string, unknown> | null>;
  create(args: unknown): Promise<Record<string, unknown>>;
  update(args: unknown): Promise<Record<string, unknown>>;
  delete(args: unknown): Promise<unknown>;
};

export interface CrudOptions<S extends z.ZodObject> {
  model: 'activity' | 'scheduleItem' | 'testimonial' | 'faq' | 'promotion' | 'space' | 'meal' | 'dailyActivity' | 'event';
  schema: S;
  include?: Record<string, unknown>;
  orderBy?: unknown;
  /** Map validated input to Prisma data (e.g. linked media). `id` is set on update. */
  toData?: (input: Partial<z.infer<S>>, id?: string) => Promise<Record<string, unknown>> | Record<string, unknown>;
  /** Extra transform applied to each serialized record. */
  present?: (rec: Record<string, unknown>) => Record<string, unknown>;
  reorderable?: boolean;
}

/** Builds media join-table writes for ordered `mediaIds`. */
export const mediaLinks = (mediaIds: string[] | undefined, isUpdate: boolean) =>
  mediaIds === undefined
    ? undefined
    : { ...(isUpdate ? { deleteMany: {} } : {}), create: [...new Set(mediaIds)].map((mediaId, position) => ({ mediaId, position })) };

export const mediaInclude = { media: { include: { media: true }, orderBy: { position: 'asc' } } } as const;

export function crudRouter<S extends z.ZodObject>(opts: CrudOptions<S>) {
  const router = Router();
  const db = (prisma as unknown as Record<string, Delegate>)[opts.model];
  const orderBy = opts.orderBy ?? [{ sortOrder: 'asc' }, { createdAt: 'asc' }];
  const toData = opts.toData ?? ((i) => i as Record<string, unknown>);
  const present = (rec: Record<string, unknown>) => {
    const out = serializeRecord(rec);
    return opts.present ? opts.present(out) : out;
  };

  router.get('/', async (_req, res) => {
    const items = await db.findMany({ include: opts.include, orderBy });
    res.json({ items: items.map(present) });
  });

  router.get('/:id', async (req, res) => {
    const item = await db.findUnique({ where: { id: req.params.id }, include: opts.include });
    if (!item) throw notFound();
    res.json(present(item));
  });

  router.post('/', async (req, res) => {
    const input = parse(opts.schema, req.body);
    const data = await toData(input);
    if (opts.reorderable !== false) {
      const last = await db.findMany({ orderBy: { sortOrder: 'desc' }, take: 1 });
      data.sortOrder ??= ((last[0]?.sortOrder as number | undefined) ?? -1) + 1;
    }
    const item = await db.create({ data, include: opts.include });
    res.status(201).json(present(item));
  });

  router.put('/:id', async (req, res) => {
    const parsed = parse(opts.schema.partial(), req.body) as Record<string, unknown>;
    // Only touch fields the client actually sent (schema defaults must not overwrite stored values).
    const sent = new Set(Object.keys(req.body ?? {}));
    const input = Object.fromEntries(Object.entries(parsed).filter(([k]) => sent.has(k))) as Partial<z.infer<S>>;
    const data = await toData(input, req.params.id);
    const item = await db.update({ where: { id: req.params.id }, data, include: opts.include });
    res.json(present(item));
  });

  router.delete('/:id', async (req, res) => {
    await db.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  });

  if (opts.reorderable !== false) {
    router.post('/reorder', async (req, res) => {
      const { ids } = parse(z.object({ ids: zIds }), req.body);
      await prisma.$transaction(ids.map((id, i) => db.update({ where: { id }, data: { sortOrder: i } }) as never));
      res.json({ ok: true });
    });
  }

  return router;
}
