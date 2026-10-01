import type { Request, Response } from 'express';

/**
 * Storage abstraction. Implement this interface to plug in another provider
 * (Cloudinary, Google Cloud Storage, ...). Files are addressed by an opaque key
 * such as "2026/10/3f9c...-lg.webp"; the database only stores keys, never binaries.
 */
export interface StorageDriver {
  readonly name: string;
  putFile(key: string, localPath: string, contentType: string): Promise<void>;
  putBuffer(key: string, data: Buffer, contentType: string): Promise<void>;
  delete(key: string): Promise<void>;
  /** Direct (CDN) URL for a public object, or null when files must be served through the API. */
  publicUrl(key: string): string | null;
  /** Stream / redirect the object to the client. Must support HTTP Range for video. */
  send(key: string, req: Request, res: Response, opts: { isPublic: boolean }): Promise<void>;
}
