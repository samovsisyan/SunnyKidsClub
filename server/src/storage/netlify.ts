import fs from 'node:fs/promises';
import type { Request, Response } from 'express';
import { getStore } from '@netlify/blobs';
import type { StorageDriver } from './types.js';

/**
 * Netlify Blobs (used when the API runs as a Netlify Function, where the disk is not persistent).
 * Objects are always served through the API so private media keeps its session check.
 */
export class NetlifyBlobsStorageDriver implements StorageDriver {
  readonly name = 'netlify';
  private store = getStore({ name: 'media', consistency: 'strong' });

  async putFile(key: string, localPath: string, contentType: string) {
    const data = await fs.readFile(localPath);
    await this.putBuffer(key, data, contentType);
    await fs.unlink(localPath).catch(() => {});
  }

  async putBuffer(key: string, data: Buffer, contentType: string) {
    const body = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
    await this.store.set(key, body, { metadata: { contentType } });
  }

  async delete(key: string) {
    await this.store.delete(key).catch(() => {});
  }

  publicUrl() {
    return null;
  }

  async send(key: string, _req: Request, res: Response, opts: { isPublic: boolean }) {
    const blob = await this.store.getWithMetadata(key, { type: 'arrayBuffer' });
    if (!blob) {
      res.status(404).end();
      return;
    }
    res.setHeader('Content-Type', String(blob.metadata.contentType ?? 'application/octet-stream'));
    res.setHeader('Cache-Control', opts.isPublic ? 'public, max-age=31536000, immutable' : 'private, no-store');
    res.end(Buffer.from(blob.data));
  }
}
