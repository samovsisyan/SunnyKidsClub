import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { clearSession, readSession, requireAdmin, signSession } from '../lib/auth.js';
import { HttpError, parse } from '../lib/http.js';

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Չափազանց շատ փորձեր։ Փորձեք 15 րոպե անց։' },
});

const DUMMY_HASH = bcrypt.hashSync('timing-safe-dummy', 12);

const publicUser = (u: { id: string; email: string; name: string }) => ({ id: u.id, email: u.email, name: u.name });

authRouter.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = parse(z.object({ email: z.string().email().max(200), password: z.string().min(1).max(200) }), req.body);
  const user = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } });
  // Compare against a dummy hash when the user does not exist to keep timing uniform.
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) throw new HttpError(401, 'Սխալ էլ. հասցե կամ գաղտնաբառ');
  await prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  signSession(res, { sub: user.id, email: user.email });
  res.json({ user: publicUser(user) });
});

authRouter.post('/logout', (_req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

authRouter.get('/me', async (req, res) => {
  const claims = readSession(req);
  const user = claims ? await prisma.adminUser.findUnique({ where: { id: claims.sub } }) : null;
  if (!user) throw new HttpError(401, 'Անհրաժեշտ է մուտք գործել');
  res.json({ user: publicUser(user) });
});

authRouter.post('/password', requireAdmin, async (req, res) => {
  const { current, next } = parse(
    z.object({ current: z.string().min(1), next: z.string().min(10, 'Նոր գաղտնաբառը պետք է լինի առնվազն 10 նիշ').max(200) }),
    req.body,
  );
  const user = await prisma.adminUser.findUnique({ where: { id: req.admin!.sub } });
  if (!user || !(await bcrypt.compare(current, user.passwordHash))) throw new HttpError(400, 'Ընթացիկ գաղտնաբառը սխալ է');
  await prisma.adminUser.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(next, 12) } });
  res.json({ ok: true });
});
