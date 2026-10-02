import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import multer from 'multer';
import { config } from '../config.js';
import { storage } from '../storage/index.js';
import { HttpError } from './http.js';

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/heic', 'image/heif'];
export const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'];

export const uploader = multer({
  storage: multer.diskStorage({ destination: os.tmpdir(), filename: (_req, _f, cb) => cb(null, `skc-${crypto.randomUUID()}`) }),
  limits: { fileSize: config.upload.maxVideoBytes, files: 2 },
  fileFilter: (_req, file, cb) => {
    if (IMAGE_TYPES.includes(file.mimetype) || VIDEO_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new HttpError(415, `Ֆայլի տեսակը չի աջակցվում (${file.mimetype})`));
  },
});

// Loaded on first use so the rest of the API starts even if the native module is unavailable.
const loadSharp = async () => (await import('sharp')).default;

function newKeyBase() {
  const d = new Date();
  return `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${crypto.randomUUID()}`;
}

/**
 * Resizes, re-encodes to WebP and strips ALL metadata (EXIF / GPS) — important for children's photos.
 */
export async function storeImage(file: Express.Multer.File) {
  try {
    if (file.size > config.upload.maxImageBytes) throw new HttpError(413, 'Լուսանկարը չափազանց մեծ է (առավելագույնը 25 ՄԲ)');
    const base = newKeyBase();
    const sharp = await loadSharp();
    const src = sharp(file.path, { failOn: 'none' }).rotate();
    const large = await src.clone().resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
    const thumb = await src.clone().resize({ width: 720, height: 720, fit: 'inside', withoutEnlargement: true }).webp({ quality: 76 }).toBuffer();
    const key = `${base}-lg.webp`;
    const thumbKey = `${base}-sm.webp`;
    await storage.putBuffer(key, large.data, 'image/webp');
    await storage.putBuffer(thumbKey, thumb, 'image/webp');
    return { key, thumbKey, mimeType: 'image/webp', size: large.data.length, width: large.info.width, height: large.info.height };
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(422, 'Չհաջողվեց մշակել լուսանկարը։ Փորձեք JPG կամ PNG ձևաչափով։');
  } finally {
    await fs.unlink(file.path).catch(() => {});
  }
}

export async function storeVideo(file: Express.Multer.File) {
  const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '') || '.mp4';
  const key = `${newKeyBase()}${ext}`;
  await storage.putFile(key, file.path, file.mimetype);
  return { key, mimeType: file.mimetype, size: file.size };
}

/** Video poster: a single resized WebP (metadata stripped). */
export async function storePoster(file: Express.Multer.File) {
  try {
    if (!IMAGE_TYPES.includes(file.mimetype)) throw new HttpError(415, 'Նկարի ֆորմատը չի աջակցվում');
    const sharp = await loadSharp();
    const out = await sharp(file.path, { failOn: 'none' })
      .rotate()
      .resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer({ resolveWithObject: true });
    const thumbKey = `${newKeyBase()}-poster.webp`;
    await storage.putBuffer(thumbKey, out.data, 'image/webp');
    return { thumbKey, width: out.info.width, height: out.info.height };
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(422, 'Չհաջողվեց մշակել նկարը');
  } finally {
    await fs.unlink(file.path).catch(() => {});
  }
}

export async function removeStoredFiles(m: { key: string | null; thumbKey: string | null }) {
  if (m.key) await storage.delete(m.key);
  if (m.thumbKey) await storage.delete(m.thumbKey);
}

export async function cleanupTemp(files: Express.Multer.File[] = []) {
  await Promise.all(files.map((f) => fs.unlink(f.path).catch(() => {})));
}

/** Parse YouTube / Vimeo URLs */
export async function parseExternalVideo(url: string) {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) {
    return { source: 'YOUTUBE' as const, externalId: yt[1], externalThumbUrl: `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg` };
  }
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) {
    let thumb: string | null = null;
    try {
      const r = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(`https://vimeo.com/${vm[1]}`)}`, { signal: AbortSignal.timeout(5000) });
      if (r.ok) thumb = ((await r.json()) as { thumbnail_url?: string }).thumbnail_url ?? null;
    } catch {
      /* thumbnail is optional */
    }
    return { source: 'VIMEO' as const, externalId: vm[1], externalThumbUrl: thumb };
  }
  throw new HttpError(400, 'Հղումը պետք է լինի YouTube կամ Vimeo տեսանյութի հղում');
}
