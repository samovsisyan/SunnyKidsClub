import fs from 'node:fs';
import express from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config.js';
import { errorHandler } from './lib/http.js';
import { authRouter } from './routes/auth.js';
import { publicRouter } from './routes/public.js';
import { adminRouter } from './routes/admin/index.js';
import { filesRouter } from './routes/files.js';
import { renderIndex, seoRouter } from './seo.js';

export const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https://i.ytimg.com', 'https://i.vimeocdn.com', ...(config.storage.s3.publicUrl ? [config.storage.s3.publicUrl] : [])],
        mediaSrc: ["'self'", 'blob:', ...(config.storage.s3.publicUrl ? [config.storage.s3.publicUrl] : [])],
        frameSrc: ['https://www.youtube-nocookie.com', 'https://player.vimeo.com', 'https://www.google.com', 'https://maps.google.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
        upgradeInsecureRequests: config.isProd ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(compression());
app.use(morgan(config.isProd ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

if (config.corsOrigin.length) {
  app.use('/api', (req, res, next) => {
    const origin = req.headers.origin;
    if (origin && config.corsOrigin.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
      res.setHeader('Vary', 'Origin');
    }
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});
app.use('/api/auth', authRouter);
app.use('/api/public', publicRouter);
app.use('/api/admin', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
}, adminRouter);
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Չգտնված հարցում' });
});
app.use('/media', filesRouter);
app.use(seoRouter);

// Production: serve the built React app with per-route meta tags.
if (fs.existsSync(config.clientDist)) {
  app.use(express.static(config.clientDist, { index: false, maxAge: '1y', setHeaders: (res, p) => p.endsWith('.html') && res.setHeader('Cache-Control', 'no-cache') }));
  app.get('/*splat', async (req, res, next) => {
    try {
      res.setHeader('Cache-Control', 'no-cache');
      if (req.path.startsWith('/admin')) res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      res.type('html').send(await renderIndex(req));
    } catch (e) {
      next(e);
    }
  });
}

app.use(errorHandler);
