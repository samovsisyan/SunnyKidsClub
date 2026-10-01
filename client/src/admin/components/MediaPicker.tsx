import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ImagePlus, Lock, Plus, Search, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import type { Media, Paged } from '@/lib/types';
import { MEDIA_CATEGORIES } from '@/lib/constants';
import { MediaImage } from '@/components/Media';
import { useAdmin } from '../api';
import { MediaUploader, type UploadDefaults } from './MediaUploader';
import { EmptyBox, IconBtn, inputCls, LoadingBlock, Modal } from './ui';

type Kind = 'IMAGE' | 'VIDEO' | 'ANY';

/** Library browser + uploader. Returns selected media in click order. */
export function MediaPicker({
  open,
  onClose,
  onSelect,
  multiple,
  kind = 'ANY',
  uploadDefaults,
  title,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (media: Media[]) => void;
  multiple?: boolean;
  kind?: Kind;
  uploadDefaults?: UploadDefaults;
  title?: string;
}) {
  const [tab, setTab] = useState<'library' | 'upload'>('library');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Media[]>([]);

  const params = new URLSearchParams({ page: String(page), limit: '36' });
  if (kind !== 'ANY') params.set('type', kind);
  if (search) params.set('search', search);
  if (category) params.set('category', category);
  const { data, isLoading } = useAdmin<Paged<Media>>(`/media?${params}`, { enabled: open });

  const toggle = (m: Media) => {
    if (!multiple) {
      onSelect([m]);
      close();
      return;
    }
    setSelected((s) => (s.some((x) => x.id === m.id) ? s.filter((x) => x.id !== m.id) : [...s, m]));
  };
  const close = () => {
    setSelected([]);
    setTab('library');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={title ?? (multiple ? 'Ընտրել ֆայլեր' : 'Ընտրել ֆայլ')}
      size="xl"
      footer={
        multiple && (
          <>
            <span className="mr-auto text-sm font-semibold text-ink-soft">Ընտրված է՝ {selected.length}</span>
            <button onClick={close} className="rounded-full px-5 py-2.5 text-sm font-bold text-ink-soft hover:bg-ink/5">
              Չեղարկել
            </button>
            <button
              disabled={!selected.length}
              onClick={() => (onSelect(selected), close())}
              className="rounded-full bg-sun-400 px-5 py-2.5 text-sm font-bold text-ink hover:bg-sun-300 disabled:opacity-40"
            >
              Ավելացնել ({selected.length})
            </button>
          </>
        )
      }
    >
      <div className="mb-4 inline-flex rounded-full bg-white p-1 ring-1 ring-ink/8">
        {[
          ['library', 'Գրադարան'],
          ['upload', 'Վերբեռնել նոր'],
        ].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v as typeof tab)} className={clsx('rounded-full px-4 py-1.5 text-sm font-bold', tab === v ? 'bg-ink text-white' : 'text-ink-soft')}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'upload' ? (
        <MediaUploader
          accept={kind}
          defaults={uploadDefaults}
          onUploaded={(media) => {
            if (multiple) {
              setSelected((s) => [...s, ...media]);
              setTab('library');
            } else {
              onSelect([media[0]]);
              close();
            }
          }}
        />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input value={search} onChange={(e) => (setSearch(e.target.value), setPage(1))} placeholder="Որոնել ըստ վերնագրի" className={clsx(inputCls, 'pl-9')} />
            </label>
            <select value={category} onChange={(e) => (setCategory(e.target.value), setPage(1))} className={clsx(inputCls, 'sm:w-56')}>
              <option value="">Բոլոր կատեգորիաները</option>
              {Object.entries(MEDIA_CATEGORIES).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          {isLoading ? (
            <LoadingBlock />
          ) : !data?.items.length ? (
            <EmptyBox title="Ֆայլեր չեն գտնվել" text="Վերբեռնեք նոր ֆայլեր «Վերբեռնել նոր» բաժնից։" />
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {data.items.map((m) => {
                const idx = selected.findIndex((s) => s.id === m.id);
                return (
                  <button key={m.id} type="button" onClick={() => toggle(m)} className={clsx('group relative aspect-square overflow-hidden rounded-2xl ring-2 transition', idx >= 0 ? 'ring-sun-400' : 'ring-transparent hover:ring-sun-200')}>
                    <MediaImage media={m} className="absolute inset-0" />
                    {m.type === 'VIDEO' && <span className="absolute bottom-1.5 left-1.5 rounded-md bg-ink/75 px-1.5 py-0.5 text-[10px] font-bold text-white">ՏԵՍԱՆՅՈՒԹ</span>}
                    {m.isPublic === false && (
                      <span className="absolute top-1.5 left-1.5 grid h-6 w-6 place-items-center rounded-full bg-ink/75 text-white" title="Փակ">
                        <Lock className="h-3 w-3" />
                      </span>
                    )}
                    {idx >= 0 && <span className="absolute top-1.5 right-1.5 grid h-6 w-6 place-items-center rounded-full bg-sun-400 text-xs font-bold text-ink">{multiple ? idx + 1 : <Check className="h-3.5 w-3.5" />}</span>}
                  </button>
                );
              })}
            </div>
          )}
          {data && data.pages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3 text-sm">
              <IconBtn label="Նախորդ էջ" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ArrowLeft className="h-4 w-4" />
              </IconBtn>
              <span className="font-semibold">
                {page} / {data.pages}
              </span>
              <IconBtn label="Հաջորդ էջ" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>
                <ArrowRight className="h-4 w-4" />
              </IconBtn>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}

/** Single media field (cover image, photo...). */
export function MediaField({ value, onChange, kind = 'IMAGE', uploadDefaults }: { value: Media | null; onChange: (m: Media | null) => void; kind?: Kind; uploadDefaults?: UploadDefaults }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center gap-4">
      <button type="button" onClick={() => setOpen(true)} className="group relative h-24 w-32 shrink-0 overflow-hidden rounded-2xl ring-1 ring-ink/10 transition hover:ring-sun-300">
        {value ? (
          <MediaImage media={value} className="absolute inset-0" />
        ) : (
          <span className="absolute inset-0 grid place-items-center bg-cream-100 text-ink-muted">
            <ImagePlus className="h-6 w-6" />
          </span>
        )}
      </button>
      <div className="flex flex-col items-start gap-1">
        <button type="button" onClick={() => setOpen(true)} className="text-sm font-bold text-sky-600 hover:underline">
          {value ? 'Փոխել' : 'Ընտրել նկար'}
        </button>
        {value && (
          <button type="button" onClick={() => onChange(null)} className="text-sm font-bold text-peach-600 hover:underline">
            Հեռացնել
          </button>
        )}
        {value?.isPublic === false && <span className="text-xs font-semibold text-peach-600">Այս ֆայլը փակ է և չի երևա կայքում</span>}
      </div>
      <MediaPicker open={open} onClose={() => setOpen(false)} onSelect={(m) => onChange(m[0] ?? null)} kind={kind} uploadDefaults={uploadDefaults} />
    </div>
  );
}

/** Ordered list of media (photos + videos) with reorder / remove. */
export function MediaListField({ value, onChange, uploadDefaults }: { value: Media[]; onChange: (m: Media[]) => void; uploadDefaults?: UploadDefaults }) {
  const [open, setOpen] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length || from === to) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {value.map((m, i) => (
            <li
              key={m.id}
              draggable
              onDragStart={() => setDragIdx(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => (dragIdx !== null && move(dragIdx, i), setDragIdx(null))}
              className={clsx('overflow-hidden rounded-2xl bg-white ring-1 ring-ink/8', dragIdx === i && 'opacity-50')}
            >
              <div className="relative aspect-[4/3] cursor-grab active:cursor-grabbing">
                <MediaImage media={m} className="absolute inset-0" />
                <span className="absolute top-1.5 left-1.5 rounded-md bg-white/90 px-1.5 text-xs font-bold">{i + 1}</span>
                {m.type === 'VIDEO' && <span className="absolute bottom-1.5 left-1.5 rounded-md bg-ink/75 px-1.5 py-0.5 text-[10px] font-bold text-white">ՏԵՍԱՆՅՈՒԹ</span>}
                {m.isPublic === false && (
                  <span className="absolute top-1.5 right-1.5 grid h-6 w-6 place-items-center rounded-full bg-ink/75 text-white" title="Փակ — չի երևա կայքում">
                    <Lock className="h-3 w-3" />
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between px-1 py-1">
                <IconBtn label="Տեղափոխել ձախ" disabled={i === 0} onClick={() => move(i, i - 1)}>
                  <ArrowLeft className="h-4 w-4" />
                </IconBtn>
                <IconBtn label="Հեռացնել" danger onClick={() => onChange(value.filter((x) => x.id !== m.id))}>
                  <Trash2 className="h-4 w-4" />
                </IconBtn>
                <IconBtn label="Տեղափոխել աջ" disabled={i === value.length - 1} onClick={() => move(i, i + 1)}>
                  <ArrowRight className="h-4 w-4" />
                </IconBtn>
              </div>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink/12 bg-white px-4 py-5 text-sm font-bold text-ink-soft transition hover:border-sun-300 hover:bg-sun-50/50 hover:text-ink"
      >
        <Plus className="h-4 w-4" /> Ավելացնել լուսանկարներ / տեսանյութեր
      </button>
      <MediaPicker
        open={open}
        onClose={() => setOpen(false)}
        multiple
        uploadDefaults={uploadDefaults}
        onSelect={(picked) => onChange([...value, ...picked.filter((p) => !value.some((v) => v.id === p.id))])}
      />
    </div>
  );
}
