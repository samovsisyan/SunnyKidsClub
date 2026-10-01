import type { Media } from '@prisma/client';
import { fileUrl } from '../storage/index.js';
import { toDateString } from './dates.js';

export function serializeMedia(m: Media) {
  const visible = m.isPublic && m.published;
  let embedUrl: string | null = null;
  if (m.source === 'YOUTUBE' && m.externalId) embedUrl = `https://www.youtube-nocookie.com/embed/${m.externalId}?rel=0`;
  if (m.source === 'VIMEO' && m.externalId) embedUrl = `https://player.vimeo.com/video/${m.externalId}?dnt=1`;
  return {
    id: m.id,
    type: m.type,
    source: m.source,
    url: m.source === 'UPLOAD' ? fileUrl(m.key, visible) : m.externalUrl,
    thumbUrl: fileUrl(m.thumbKey, visible) ?? m.externalThumbUrl ?? null,
    embedUrl,
    mimeType: m.mimeType,
    size: m.size,
    width: m.width,
    height: m.height,
    title: m.title,
    description: m.description,
    alt: m.alt || m.title,
    category: m.category,
    takenAt: toDateString(m.takenAt),
    isPublic: m.isPublic,
    published: m.published,
    inGallery: m.inGallery,
    sortOrder: m.sortOrder,
    createdAt: m.createdAt,
  };
}
export type MediaDTO = ReturnType<typeof serializeMedia>;

/** Public variant: hides private / unpublished media and admin-only fields. */
export function publicMedia(m: Media | null | undefined) {
  if (!m || !m.isPublic || !m.published) return null;
  const { isPublic: _p, published: _pub, inGallery: _g, sortOrder: _s, size: _sz, createdAt: _c, ...rest } = serializeMedia(m);
  return rest;
}

type Linked = { media: Media; position: number }[];
export const linkedMedia = (links: Linked, pub: boolean) =>
  links
    .sort((a, b) => a.position - b.position)
    .map((l) => (pub ? publicMedia(l.media) : serializeMedia(l.media)))
    .filter(Boolean);

const MEDIA_RELATIONS = ['image', 'cover', 'photo'] as const;

/** Replaces media relations (image/cover/photo) and date columns with DTOs. */
export function serializeRecord<T extends Record<string, unknown>>(rec: T, pub = false) {
  const out: Record<string, unknown> = { ...rec };
  for (const k of MEDIA_RELATIONS) {
    if (k in out) out[k] = out[k] ? (pub ? publicMedia(out[k] as Media) : serializeMedia(out[k] as Media)) : null;
  }
  for (const k of ['date', 'startDate', 'endDate']) {
    if (out[k] instanceof Date) out[k] = toDateString(out[k] as Date);
  }
  if (Array.isArray(out.media)) out.media = linkedMedia(out.media as Linked, pub);
  return out;
}
