import { useRef, useState, type DragEvent } from 'react';
import { CheckCircle2, CloudUpload, FileVideo, ImageIcon, RotateCcw, X } from 'lucide-react';
import clsx from 'clsx';
import type { Media } from '@/lib/types';
import { formatBytes } from '@/lib/format';
import { adminUpload, useRefresh } from '../api';

export interface UploadDefaults {
  category?: string;
  takenAt?: string;
  isPublic?: boolean;
  published?: boolean;
  inGallery?: boolean;
}

type Item = { id: number; file: File; progress: number; status: 'queued' | 'uploading' | 'done' | 'error'; error?: string; preview?: string; abort?: AbortController };

const ACCEPT = {
  IMAGE: 'image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif',
  VIDEO: 'video/mp4,video/webm,video/quicktime,video/x-m4v',
};
const CONCURRENCY = 3;
let seq = 1;

/**
 * Drag & drop multi-file uploader with per-file progress, retry and cancel.
 * Files are uploaded individually so one failure does not block the rest.
 */
export function MediaUploader({
  accept = 'ANY',
  defaults = {},
  onUploaded,
  compact,
}: {
  accept?: 'IMAGE' | 'VIDEO' | 'ANY';
  defaults?: UploadDefaults;
  onUploaded?: (media: Media[]) => void;
  compact?: boolean;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const refresh = useRefresh();
  const acceptAttr = accept === 'ANY' ? `${ACCEPT.IMAGE},${ACCEPT.VIDEO}` : ACCEPT[accept];

  const update = (id: number, patch: Partial<Item>) => setItems((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  async function run(queue: Item[]) {
    const done: Media[] = [];
    let cursor = 0;
    const worker = async () => {
      while (cursor < queue.length) {
        const item = queue[cursor++];
        const abort = new AbortController();
        update(item.id, { status: 'uploading', progress: 0, abort, error: undefined });
        const form = new FormData();
        form.append('file', item.file);
        form.append('title', item.file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').slice(0, 120));
        for (const [k, v] of Object.entries(defaults)) if (v !== undefined && v !== '') form.append(k, String(v));
        try {
          const media = await adminUpload<Media>('/media/upload', form, (p) => update(item.id, { progress: p }), abort.signal);
          update(item.id, { status: 'done', progress: 100 });
          done.push(media);
        } catch (e) {
          update(item.id, { status: 'error', error: e instanceof Error ? e.message : 'Սխալ' });
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker));
    if (done.length) {
      refresh();
      onUploaded?.(done);
    }
  }

  function addFiles(files: FileList | File[]) {
    const list = [...files].filter((f) => acceptAttr.split(',').includes(f.type) || (accept !== 'IMAGE' && f.type.startsWith('video/')) || (accept !== 'VIDEO' && f.type.startsWith('image/')));
    if (!list.length) return;
    const queue = list.map<Item>((file) => ({ id: seq++, file, progress: 0, status: 'queued', preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined }));
    setItems((cur) => [...cur.filter((i) => i.status !== 'done'), ...queue]);
    run(queue);
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    addFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => (e.preventDefault(), setDrag(true))}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        className={clsx(
          'flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed text-center transition',
          compact ? 'px-4 py-6' : 'px-6 py-10',
          drag ? 'border-sun-400 bg-sun-50' : 'border-ink/12 bg-white hover:border-sun-300 hover:bg-sun-50/50',
        )}
      >
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sun-100 text-sun-600">
          <CloudUpload className="h-6 w-6" />
        </span>
        <p className="mt-3 font-bold">Քաշեք ֆայլերն այստեղ կամ սեղմեք ընտրելու համար</p>
        <p className="mt-1 text-xs text-ink-muted">
          {accept === 'VIDEO' ? 'MP4, WebM, MOV — մինչև 600 ՄԲ' : accept === 'IMAGE' ? 'JPG, PNG, WebP, HEIC — կարող եք ընտրել միանգամից մի քանիսը' : 'Լուսանկարներ և տեսանյութեր (MP4) — մի քանի ֆայլ միանգամից'}
        </p>
        <input ref={inputRef} type="file" multiple accept={acceptAttr} className="hidden" onChange={(e) => (e.target.files && addFiles(e.target.files), (e.target.value = ''))} />
      </div>

      {items.length > 0 && (
        <ul className="space-y-2" aria-label="Վերբեռնումներ">
          {items.map((i) => (
            <li key={i.id} className="flex items-center gap-3 rounded-2xl bg-white p-2.5 ring-1 ring-ink/5">
              <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-cream-100 text-ink-muted">
                {i.preview ? <img src={i.preview} alt="" className="h-full w-full object-cover" /> : i.file.type.startsWith('video/') ? <FileVideo className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-semibold">{i.file.name}</span>
                  <span className="shrink-0 text-xs text-ink-muted">{formatBytes(i.file.size)}</span>
                </div>
                {i.status === 'error' ? (
                  <p className="text-xs font-semibold text-peach-600">{i.error}</p>
                ) : (
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/8" role="progressbar" aria-valuenow={i.progress} aria-valuemin={0} aria-valuemax={100}>
                    <div className={clsx('h-full rounded-full transition-all', i.status === 'done' ? 'bg-leaf-500' : 'bg-sun-400')} style={{ width: `${i.progress}%` }} />
                  </div>
                )}
                {i.status === 'uploading' && i.progress === 100 && <p className="mt-1 text-xs text-ink-muted">Մշակվում է…</p>}
              </div>
              {i.status === 'done' && <CheckCircle2 className="h-5 w-5 shrink-0 text-leaf-500" />}
              {i.status === 'error' && (
                <button type="button" onClick={() => run([i])} className="grid h-8 w-8 place-items-center rounded-lg text-ink-soft hover:bg-ink/5" aria-label="Կրկին փորձել">
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
              {(i.status === 'uploading' || i.status === 'queued' || i.status === 'error') && (
                <button
                  type="button"
                  onClick={() => (i.abort?.abort(), setItems((l) => l.filter((x) => x.id !== i.id)))}
                  className="grid h-8 w-8 place-items-center rounded-lg text-ink-soft hover:bg-ink/5"
                  aria-label="Չեղարկել"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
