import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Media } from '@/lib/types';
import { formatDate } from '@/lib/format';
import { VideoPlayer } from './Media';

export function Lightbox({ items, index, onClose, onIndex }: { items: Media[]; index: number | null; onClose: () => void; onIndex: (i: number) => void }) {
  const touch = useRef<number | null>(null);
  const open = index !== null && items[index];
  const go = useCallback((d: number) => index !== null && onIndex((index + d + items.length) % items.length), [index, items.length, onIndex]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, go, onClose]);

  if (!open || index === null) return null;
  const m = items[index];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={m.title || 'Դիտում'}
      className="fixed inset-0 z-[100] flex flex-col bg-ink/92 backdrop-blur-sm animate-fade-up [animation-duration:.3s]"
      onClick={onClose}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touch.current = null;
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 text-white/80 sm:px-6">
        <span className="text-sm font-semibold">
          {index + 1} / {items.length}
        </span>
        <button onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20" aria-label="Փակել">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-20" onClick={(e) => e.stopPropagation()}>
        {m.type === 'VIDEO' ? (
          <div key={m.id} className="w-full max-w-5xl">
            <VideoPlayer media={m} className="max-h-[75vh]" />
          </div>
        ) : (
          <img key={m.id} src={m.url ?? m.thumbUrl ?? ''} alt={m.alt || m.title} className="max-h-full max-w-full rounded-2xl object-contain shadow-lift" />
        )}
        {items.length > 1 && (
          <>
            <button onClick={() => go(-1)} className="absolute left-2 hidden h-12 w-12 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/25 sm:left-6 sm:grid" aria-label="Նախորդը">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button onClick={() => go(1)} className="absolute right-2 hidden h-12 w-12 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/25 sm:right-6 sm:grid" aria-label="Հաջորդը">
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>
      <div className="min-h-20 px-4 py-4 text-center text-white sm:px-6" onClick={(e) => e.stopPropagation()}>
        {m.title && <p className="font-display text-lg font-semibold">{m.title}</p>}
        {m.description && <p className="mx-auto mt-1 max-w-2xl text-sm text-white/70">{m.description}</p>}
        {m.takenAt && <p className="mt-1 text-xs text-white/50">{formatDate(m.takenAt)}</p>}
      </div>
    </div>,
    document.body,
  );
}
