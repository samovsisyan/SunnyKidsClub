import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

export const notFound = (what = 'Գրառումը') => new HttpError(404, `${what} չի գտնվել`);

export function parse<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new HttpError(400, 'Տվյալները սխալ են լրացված', result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })));
  }
  return result.data;
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }
  const anyErr = err as { code?: string; type?: string; message?: string };
  if (anyErr?.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({ error: 'Ֆայլը չափազանց մեծ է' });
    return;
  }
  if (anyErr?.code === 'P2025') {
    res.status(404).json({ error: 'Գրառումը չի գտնվել' });
    return;
  }
  if (anyErr?.code === 'P2002') {
    res.status(409).json({ error: 'Նման գրառում արդեն գոյություն ունի' });
    return;
  }
  if (anyErr?.type === 'entity.too.large') {
    res.status(413).json({ error: 'Հարցումը չափազանց մեծ է' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Սերվերի սխալ։ Խնդրում ենք փորձել կրկին։' });
}

/** Common zod helpers */
export const zDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ամսաթիվը պետք է լինի YYYY-MM-DD ձևաչափով')
  .transform((s) => new Date(`${s}T00:00:00.000Z`));
export const zOptDate = z.union([zDate, z.literal(''), z.null()]).optional().transform((v) => (v ? v : null));
export const zTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Ժամը պետք է լինի ՀՀ:ՐՐ ձևաչափով');
export const zId = z.string().min(1).max(64);
export const zOptId = z.union([zId, z.literal(''), z.null()]).optional().transform((v) => (v ? v : null));
export const zIds = z.array(zId).max(500);
