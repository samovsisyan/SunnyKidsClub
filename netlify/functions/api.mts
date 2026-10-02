import serverless from 'serverless-http';
import { connectLambda } from '@netlify/blobs';

// Runtime defaults for the Netlify Function (the disk is read-only / ephemeral here).
process.env.NODE_ENV ||= 'production';
process.env.STORAGE_DRIVER ||= 'netlify';
process.env.CLIENT_DIST ||= '/nonexistent';

let handlerPromise: Promise<serverless.Handler> | undefined;

async function init() {
  const { app } = await import('../../server/src/app.js');
  const { ensureAdmin } = await import('../../server/src/lib/bootstrap.js');
  await ensureAdmin().catch((e) => console.error('ensureAdmin failed', e));
  return serverless(app, { basePath: '/.netlify/functions/api', binary: ['image/*', 'video/*', 'application/octet-stream'] });
}

export const handler = async (event: Parameters<serverless.Handler>[0], context: Parameters<serverless.Handler>[1]) => {
  if ((event as { blobs?: string }).blobs) connectLambda(event as never);
  handlerPromise ??= init();
  return (await handlerPromise)(event, context);
};
