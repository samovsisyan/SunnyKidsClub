import fs from 'node:fs';
import path from 'node:path';
import { Router, type Request } from 'express';
import { config } from './config.js';
import { prisma } from './lib/prisma.js';
import { getSetting, resolveSettingMedia } from './lib/settings.js';

/** Armenian metadata per public route (used for server-side meta injection + sitemap). */
export const PAGES: { path: string; title: string; description?: string; priority: number }[] = [
  { path: '/', title: '', priority: 1 },
  { path: '/about', title: 'Մեր մասին', description: 'Ծանոթացեք Sunny Kids Club մանկապարտեզին՝ մեր փիլիսոփայությանը, մոտեցմանը և թիմին։', priority: 0.8 },
  { path: '/daily-life', title: 'Մեր առօրյան', description: 'Տեսեք, թե ինչով են զբաղվում մեր փոքրիկներն ամեն օր՝ լուսանկարներ և տեսանյութեր։', priority: 0.9 },
  { path: '/schedule', title: 'Օրվա ռեժիմ', description: 'Sunny Kids Club մանկապարտեզի օրվա ռեժիմը։', priority: 0.6 },
  { path: '/activities', title: 'Մեր զբաղմունքները', description: 'Նկարչություն, երաժշտություն, զարգացնող խաղեր, նախադպրոցական պատրաստություն և ավելին։', priority: 0.7 },
  { path: '/environment', title: 'Մեր միջավայրը', description: 'Խմբասենյակներ, խաղասենյակներ, բակ և խաղահրապարակ։', priority: 0.6 },
  { path: '/events', title: 'Միջոցառումներ', description: 'Առաջիկա և անցկացված միջոցառումներ Sunny Kids Club-ում։', priority: 0.7 },
  { path: '/promotions', title: 'Ակցիաներ', description: 'Հատուկ առաջարկներ նոր սաների համար։', priority: 0.5 },
  { path: '/gallery', title: 'Պատկերասրահ', description: 'Լուսանկարներ և տեսանյութեր մեր մանկապարտեզի կյանքից։', priority: 0.7 },
  { path: '/parents', title: 'Ծնողների համար', description: 'Օգտակար տեղեկություններ ծնողների համար և հաճախ տրվող հարցեր։', priority: 0.6 },
  { path: '/food', title: 'Սնունդ', description: 'Առողջ և հավասարակշռված սնունդ մեր փոքրիկների համար։', priority: 0.5 },
  { path: '/contact', title: 'Կապ մեզ հետ', description: 'Հասցե, հեռախոս, աշխատանքային ժամեր և հետադարձ կապի ձև։', priority: 0.7 },
  { path: '/enroll', title: 'Գրանցել երեխային', description: 'Լրացրեք հայտը, և մենք կկապվենք Ձեզ հետ։', priority: 0.8 },
];

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const seoRouter = Router();

seoRouter.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${config.siteUrl}/sitemap.xml\n`);
});

seoRouter.get('/sitemap.xml', async (_req, res) => {
  const events = await prisma.event.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } });
  const urls = [
    ...PAGES.map((p) => `<url><loc>${config.siteUrl}${p.path}</loc><priority>${p.priority}</priority></url>`),
    ...events.map((e) => `<url><loc>${config.siteUrl}/events/${e.slug}</loc><lastmod>${e.updatedAt.toISOString()}</lastmod><priority>0.5</priority></url>`),
  ];
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`);
});

let template: string | null = null;
const indexHtml = () => (template ??= fs.readFileSync(path.join(config.clientDist, 'index.html'), 'utf8'));

/** Production: serve the SPA shell with route-specific Armenian meta tags (for crawlers & link previews). */
export async function renderIndex(req: Request) {
  const site = await getSetting('site');
  const [resolved] = await resolveSettingMedia([site], true);
  const baseTitle = String(site.seoTitle);
  let title = baseTitle;
  let description = String(site.seoDescription);
  let image = (resolved.ogImageMedia as { url?: string } | null)?.url ?? '/og-image.png';

  const page = PAGES.find((p) => p.path === req.path);
  if (page?.title) {
    title = `${page.title} — Sunny Kids Club`;
    description = page.description ?? description;
  }
  const ev = req.path.match(/^\/events\/([\w-]+)$/);
  if (ev) {
    const e = await prisma.event.findFirst({ where: { slug: ev[1], published: true }, include: { cover: true } });
    if (e) {
      title = `${e.title} — Sunny Kids Club`;
      description = e.description.slice(0, 160) || description;
      if (e.cover?.isPublic && e.cover.published && e.cover.thumbKey) image = `/media/${e.cover.thumbKey}`;
    }
  }
  const abs = (u: string) => (u.startsWith('http') ? u : `${config.siteUrl}${u}`);
  const url = `${config.siteUrl}${req.path === '/' ? '' : req.path}`;
  const meta = [
    `<title data-ssr>${esc(title)}</title>`,
    `<meta data-ssr name="description" content="${esc(description)}" />`,
    `<link data-ssr rel="canonical" href="${esc(url)}" />`,
    `<meta data-ssr property="og:type" content="website" />`,
    `<meta data-ssr property="og:locale" content="hy_AM" />`,
    `<meta data-ssr property="og:site_name" content="Sunny Kids Club" />`,
    `<meta data-ssr property="og:title" content="${esc(title)}" />`,
    `<meta data-ssr property="og:description" content="${esc(description)}" />`,
    `<meta data-ssr property="og:url" content="${esc(url)}" />`,
    `<meta data-ssr property="og:image" content="${esc(abs(image))}" />`,
    `<meta data-ssr name="twitter:card" content="summary_large_image" />`,
  ].join('\n    ');
  return indexHtml().replace(/<!--seo-->[\s\S]*?<!--\/seo-->/, meta);
}
