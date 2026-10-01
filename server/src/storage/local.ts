import fs from 'node:fs/promises';
import path from 'node:path';
import type { Request, Response } from 'express';
import type { StorageDriver } from './types.js';

export class LocalStorageDriver implements StorageDriver {
  readonly name = 'local';
  constructor(private root: string) {}

  private resolve(key: string) {
    const full = path.resolve(this.root, key);
    if (!full.startsWith(this.root + path.sep)) throw new Error('Invalid storage key');
    return full;
  }

  async putFile(key: string, localPath: string) {
    const dest = this.resolve(key);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    try {
      await fs.rename(localPath, dest);
    } catch {
      await fs.copyFile(localPath, dest);
      await fs.unlink(localPath).catch(() => {});
    }
  }

  async putBuffer(key: string, data: Buffer) {
    const dest = this.resolve(key);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, data);
  }

  async delete(key: string) {
    await fs.unlink(this.resolve(key)).catch(() => {});
  }

  publicUrl() {
    return null;
  }

  async send(key: string, _req: Request, res: Response, opts: { isPublic: boolean }) {
    const file = this.resolve(key);
    await new Promise<void>((resolve, reject) => {
      res.sendFile(
        file,
        {
          headers: { 'Cache-Control': opts.isPublic ? 'public, max-age=31536000, immutable' : 'private, no-store' },
          acceptRanges: true,
        },
        (err) => (err && !res.headersSent ? reject(err) : resolve()),
      );
    });
  }
}
