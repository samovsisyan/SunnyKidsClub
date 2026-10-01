import { useState } from 'react';
import { ImageIcon, Lock, Play } from 'lucide-react';
import clsx from 'clsx';
import type { Media } from '@/lib/types';

/** Lazy, fading image with a soft placeholder background. */
export function MediaImage({
  media,
  variant = 'thumb',
  className,
  imgClassName,
  eager,
  sizes,
}: {
  media?: Media | null;
  variant?: 'thumb' | 'full';
  className?: string;
  imgClassName?: string;
  eager?: boolean;
  sizes?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const src = media ? (media.type === 'IMAGE' ? (variant === 'full' ? media.url : media.thumbUrl ?? media.url) : media.thumbUrl) : null;
  return (
    <div className={clsx(!/\b(absolute|fixed)\b/.test(className ?? '') && 'relative', 'overflow-hidden bg-gradient-to-br from-sun-50 via-cream-100 to-sky-50', className)}>
      {src && !failed ? (
        <img
          ref={(el) => {
            // Cached images may finish loading before React attaches onLoad.
            if (el?.complete && el.naturalWidth && !loaded) setLoaded(true);
          }}
          src={src}
          srcSet={sizes && media?.type === 'IMAGE' && media.thumbUrl && media.url && variant === 'thumb' ? `${media.thumbUrl} 720w, ${media.url} 2000w` : undefined}
          sizes={sizes}
          alt={media?.alt || media?.title || ''}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : undefined}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={clsx('h-full w-full object-cover transition duration-700', loaded ? 'scale-100 opacity-100' : 'scale-[1.02] opacity-0', imgClassName)}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-sun-300">
          {media?.type === 'VIDEO' ? <Play className="h-10 w-10" /> : <ImageIcon className="h-10 w-10" strokeWidth={1.5} />}
        </div>
      )}
    </div>
  );
}

/** Clickable tile for galleries — shows a poster + play badge for videos. */
export function MediaTile({ media, onOpen, className, aspect = 'aspect-[4/3]', showCaption, admin, style }: { media: Media; onOpen?: () => void; className?: string; aspect?: string; showCaption?: boolean; admin?: boolean; style?: React.CSSProperties }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      style={style}
      className={clsx('group relative block w-full overflow-hidden rounded-3xl text-left focus-visible:outline-sky-500', aspect, className)}
      aria-label={media.title || (media.type === 'VIDEO' ? 'Դիտել տեսանյութը' : 'Դիտել լուսանկարը')}
    >
      <MediaImage media={media} className="absolute inset-0" imgClassName="group-hover:scale-[1.04] transition-transform duration-700" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
      {media.type === 'VIDEO' && (
        <span className="absolute top-1/2 left-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-lift backdrop-blur transition duration-300 group-hover:scale-110">
          <Play className="ml-0.5 h-6 w-6 fill-current" />
        </span>
      )}
      {admin && media.isPublic === false && (
        <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-ink/80 px-2 py-0.5 text-[11px] font-bold text-white">
          <Lock className="h-3 w-3" /> Փակ
        </span>
      )}
      {showCaption && media.title && (
        <span className="absolute inset-x-3 bottom-3 translate-y-2 truncate text-sm font-semibold text-white opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          {media.title}
        </span>
      )}
    </button>
  );
}

/** Inline video player — never autoplays with sound, only loads metadata until played. */
export function VideoPlayer({ media, className, autoPlay }: { media: Media; className?: string; autoPlay?: boolean }) {
  if (media.embedUrl) {
    return (
      <iframe
        src={`${media.embedUrl}${autoPlay ? '&autoplay=1' : ''}`}
        title={media.title || 'Տեսանյութ'}
        className={clsx('aspect-video w-full rounded-2xl bg-ink', className)}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        loading="lazy"
      />
    );
  }
  return (
    <video
      src={media.url ?? undefined}
      poster={media.thumbUrl ?? undefined}
      controls
      playsInline
      preload="metadata"
      autoPlay={autoPlay}
      className={clsx('max-h-full w-full rounded-2xl bg-ink', className)}
    >
      Ձեր դիտարկիչը չի աջակցում տեսանյութերի դիտումը։
    </video>
  );
}
