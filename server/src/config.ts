import 'dotenv/config';
import path from 'node:path';

const required = (name: string, fallback?: string) => {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === '') throw new Error(`Missing environment variable ${name}`);
  return v;
};

// Netlify Database exposes the connection string as NETLIFY_DB_URL.
process.env.DATABASE_URL ||= process.env.NETLIFY_DB_URL || process.env.NETLIFY_DATABASE_URL;

const isProd = process.env.NODE_ENV === 'production';
const jwtSecret = required('JWT_SECRET');
if (isProd && jwtSecret.length < 32) throw new Error('JWT_SECRET must be at least 32 characters in production');

export const config = {
  isProd,
  port: Number(process.env.PORT ?? 4600),
  jwtSecret,
  siteUrl: (process.env.PUBLIC_SITE_URL ?? 'http://localhost:5180').replace(/\/$/, ''),
  corsOrigin: process.env.CORS_ORIGIN?.split(',').map((s) => s.trim()).filter(Boolean) ?? [],
  timezone: process.env.SITE_TIMEZONE ?? 'Asia/Yerevan',
  storage: {
    driver: (process.env.STORAGE_DRIVER ?? 'local') as 'local' | 's3' | 'netlify',
    uploadDir: path.resolve(process.env.UPLOAD_DIR ?? './uploads'),
    s3: {
      bucket: process.env.S3_BUCKET ?? '',
      region: process.env.S3_REGION ?? 'auto',
      endpoint: process.env.S3_ENDPOINT || undefined,
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
      publicUrl: process.env.S3_PUBLIC_URL?.replace(/\/$/, '') || undefined,
    },
  },
  upload: {
    maxImageBytes: 25 * 1024 * 1024,
    maxVideoBytes: 600 * 1024 * 1024,
  },
  clientDist: path.resolve(process.env.CLIENT_DIST ?? '../client/dist'),
};
