import crypto from 'node:crypto';
import serverless from 'serverless-http';
import { getStore } from '@netlify/blobs';
import type { Config, Context } from '@netlify/functions';

declare const Netlify: { env: { get(key: string): string | undefined } };

// Runtime defaults for the Netlify Function (the disk is read-only / ephemeral here).
process.env.NODE_ENV ||= 'production';
process.env.STORAGE_DRIVER ||= 'netlify';
process.env.CLIENT_DIST ||= '/nonexistent';

type LambdaHandler = (event: unknown, context: unknown) => Promise<{
  statusCode: number;
  headers?: Record<string, string>;
  multiValueHeaders?: Record<string, string[]>;
  body?: string;
  isBase64Encoded?: boolean;
}>;

let handlerPromise: Promise<LambdaHandler> | undefined;

/** Without a JWT_SECRET env var, use a random key generated once and kept in Netlify Blobs. */
async function ensureJwtSecret() {
  if (process.env.JWT_SECRET) return;
  const store = getStore('config');
  let secret = await store.get('jwt-secret', { type: 'text' });
  if (!secret) {
    const fresh = crypto.randomBytes(48).toString('hex');
    await store.set('jwt-secret', fresh, { onlyIfNew: true });
    secret = (await store.get('jwt-secret', { type: 'text' })) ?? fresh;
  }
  process.env.JWT_SECRET = secret;
}

async function init() {
  // Netlify Database only exposes its connection string through Netlify.env.
  const dbUrl = Netlify.env.get('NETLIFY_DB_URL');
  if (dbUrl) process.env.DATABASE_URL ||= dbUrl;
  await ensureJwtSecret();
  const { app } = await import('../../server/src/app.js');
  const { ensureAdmin } = await import('../../server/src/lib/bootstrap.js');
  await ensureAdmin().catch((e) => console.error('ensureAdmin failed', e));
  return serverless(app, { binary: ['image/*', 'video/*', 'application/octet-stream'] }) as unknown as LambdaHandler;
}

export default async (req: Request, context: Context) => {
  handlerPromise ??= init().catch((e) => {
    handlerPromise = undefined;
    throw e;
  });
  const handler = await handlerPromise;

  // Translate the Fetch request into the API Gateway event serverless-http expects.
  const url = new URL(req.url);
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => (headers[k] = v));
  headers['x-forwarded-for'] ||= context.ip;
  const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : Buffer.from(await req.arrayBuffer());
  const multiValueQueryStringParameters: Record<string, string[]> = {};
  url.searchParams.forEach((v, k) => (multiValueQueryStringParameters[k] ??= []).push(v));

  const res = await handler(
    {
      httpMethod: req.method,
      path: url.pathname,
      headers,
      multiValueQueryStringParameters,
      body: body?.toString('base64'),
      isBase64Encoded: Boolean(body),
      requestContext: { identity: { sourceIp: context.ip } },
    },
    {},
  );

  const out = new Headers();
  for (const [k, v] of Object.entries(res.headers ?? {})) out.set(k, String(v));
  for (const [k, vs] of Object.entries(res.multiValueHeaders ?? {})) for (const v of vs) out.append(k, String(v));
  const payload = res.body ? (res.isBase64Encoded ? Buffer.from(res.body, 'base64') : res.body) : null;
  return new Response(res.statusCode === 204 || res.statusCode === 304 ? null : payload, { status: res.statusCode, headers: out });
};

export const config: Config = {
  path: ['/api/*', '/media/*', '/sitemap.xml', '/robots.txt'],
};
