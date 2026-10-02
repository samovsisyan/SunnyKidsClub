/**
 * Copies local server/uploads/* into the Netlify Blobs "media" store (same keys).
 * Usage: NETLIFY_SITE_ID=... NETLIFY_AUTH_TOKEN=... npx tsx scripts/push-uploads-to-netlify.ts
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { getStore } from '@netlify/blobs';

const TYPES: Record<string, string> = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.m4v': 'video/x-m4v' };

const root = path.resolve(process.env.UPLOAD_DIR ?? './uploads');
const store = getStore({ name: 'media', siteID: process.env.NETLIFY_SITE_ID!, token: process.env.NETLIFY_AUTH_TOKEN! });

let n = 0;
for (const rel of await fs.readdir(root, { recursive: true })) {
  const full = path.join(root, rel);
  if (!(await fs.stat(full)).isFile() || path.basename(rel).startsWith('.')) continue;
  const key = rel.split(path.sep).join('/');
  const data = await fs.readFile(full);
  await store.set(key, data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer, {
    metadata: { contentType: TYPES[path.extname(rel).toLowerCase()] ?? 'application/octet-stream' },
  });
  n++;
}
console.log(`Uploaded ${n} files to Netlify Blobs`);
