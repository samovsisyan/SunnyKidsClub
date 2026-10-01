import fs from 'node:fs';
import type { Request, Response } from 'express';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { StorageDriver } from './types.js';

export interface S3Options {
  bucket: string;
  region: string;
  endpoint?: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** Public base URL (CDN / public bucket). When set, public objects are linked directly. */
  publicUrl?: string;
}

/**
 * Works with AWS S3 and any S3-compatible service: Cloudflare R2, Supabase Storage (S3 API),
 * DigitalOcean Spaces, MinIO, Backblaze B2...
 * Keep the bucket private; private media is delivered through short-lived signed URLs.
 */
export class S3StorageDriver implements StorageDriver {
  readonly name = 's3';
  private client: S3Client;

  constructor(private opts: S3Options) {
    if (!opts.bucket) throw new Error('S3_BUCKET is required for the s3 storage driver');
    this.client = new S3Client({
      region: opts.region,
      endpoint: opts.endpoint,
      forcePathStyle: Boolean(opts.endpoint),
      credentials: { accessKeyId: opts.accessKeyId, secretAccessKey: opts.secretAccessKey },
    });
  }

  async putFile(key: string, localPath: string, contentType: string) {
    const stat = await fs.promises.stat(localPath);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.opts.bucket,
        Key: key,
        Body: fs.createReadStream(localPath),
        ContentLength: stat.size,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
    await fs.promises.unlink(localPath).catch(() => {});
  }

  async putBuffer(key: string, data: Buffer, contentType: string) {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.opts.bucket, Key: key, Body: data, ContentType: contentType, CacheControl: 'public, max-age=31536000, immutable' }),
    );
  }

  async delete(key: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.opts.bucket, Key: key })).catch(() => {});
  }

  publicUrl(key: string) {
    return this.opts.publicUrl ? `${this.opts.publicUrl}/${key}` : null;
  }

  async send(key: string, _req: Request, res: Response, opts: { isPublic: boolean }) {
    const direct = opts.isPublic ? this.publicUrl(key) : null;
    const url = direct ?? (await getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.opts.bucket, Key: key }), { expiresIn: 600 }));
    res.setHeader('Cache-Control', opts.isPublic ? 'public, max-age=300' : 'private, no-store');
    res.redirect(302, url);
  }
}
