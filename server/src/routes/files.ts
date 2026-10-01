import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { readSession } from '../lib/auth.js';
import { storage } from '../storage/index.js';

/**
 * Serves stored media through the API so that private / unpublished
 * children's photos and videos are only accessible with an admin session.
 */
export const filesRouter = Router();

filesRouter.get('/*key', async (req, res) => {
  const raw = (req.params as { key: string | string[] }).key;
  const key = Array.isArray(raw) ? raw.join('/') : raw;
  if (!/^[\w/.-]+$/.test(key) || key.includes('..')) {
    res.status(400).end();
    return;
  }
  const media = await prisma.media.findFirst({ where: { OR: [{ key }, { thumbKey: key }] }, select: { isPublic: true, published: true } });
  if (!media) {
    res.status(404).end();
    return;
  }
  const isPublic = media.isPublic && media.published;
  if (!isPublic && !readSession(req)) {
    res.status(403).end();
    return;
  }
  await storage.send(key, req, res, { isPublic });
});
