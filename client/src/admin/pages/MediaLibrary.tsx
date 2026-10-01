import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckSquare, Eye, EyeOff, GripVertical, Link2, Lock, LockOpen, Search, Trash2, Upload } from 'lucide-react';
import clsx from 'clsx';
import type { Media, Paged } from '@/lib/types';
import { MEDIA_CATEGORIES } from '@/lib/constants';
import { formatBytes, formatDate, todayIso } from '@/lib/format';
import { MediaImage, VideoPlayer } from '@/components/Media';
import { adminApi, adminUpload, useAction, useAdmin } from '../api';
import { MediaUploader } from '../components/MediaUploader';
import { Badge, EmptyBox, ErrorBox, Field, IconBtn, inputCls, LoadingBlock, Modal, PageHeader, Switch } from '../components/ui';
import { confirm, toast } from '../store/ui';

type Mode = 'IMAGE' | 'VIDEO' | 'GALLERY';

const TEXT: Record<Mode, { title: string; description: string; empty: string }> = {
  IMAGE: {
    title: 'Լուսանկարներ',
    description: 'Բոլոր վերբեռնված լուսանկարները։ Կարող եք վերբեռնել միանգամից մի քանի ֆայլ, փոխել կատեգորիան, ամսաթիվը, հրապարակումը և գաղտնիությունը։',
    empty: 'Լուսանկարներ դեռ չկան',
  },
  VIDEO: {
    title: 'Տեսանյութեր',
    description: 'Վերբեռնեք MP4 տեսանյութեր կամ ավելացրեք YouTube / Vimeo հղումներ։ Կայքում տեսանյութերը բեռնվում են միայն դիտելիս՝ շապիկի նկարով։',
    empty: 'Տեսանյութեր դեռ չկան',
  },
  GALLERY: {
    title: 'Պատկերասրահ',
    description: 'Որոշեք, թե որ ֆայլերը ցուցադրվեն կայքի «Պատկերասրահ» բաժնում և որ կատեգորիայում։ Միայն հանրային և հրապարակված ֆայլերն են երևում կայքում։',
    empty: 'Պատկերասրահը դատարկ է',
  },
};

function MediaEditor({ media, onClose }: { media: Media | null; onClose: () => void }) {
  const run = useAction();
  const [form, setForm] = useState<Partial<Media>>({});
  const [busy, setBusy] = useState(false);
  const [posterProgress, setPosterProgress] = useState<number | null>(null);
  useEffect(() => setForm(media ?? {}), [media]);
  if (!media) return null;
  const set = <K extends keyof Media>(k: K, v: Media[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setBusy(true);
    const ok = await run(
      () =>
        adminApi(`/media/${media.id}`, {
          method: 'PATCH',
          body: { title: form.title, description: form.description, alt: form.alt, category: form.category, takenAt: form.takenAt, isPublic: form.isPublic, published: form.published, inGallery: form.inGallery },
        }),
      'Պահպանված է',
    );
    setBusy(false);
    if (ok) onClose();
  };
  const remove = async () => {
    if (!(await confirm({ title: 'Ջնջե՞լ ֆայլը', message: 'Ֆայլը կհեռացվի նաև բոլոր գրառումներից և միջոցառումներից։ Գործողությունը հնարավոր չէ հետարկել։', confirmLabel: 'Ջնջել', danger: true }))) return;
    if (await run(() => adminApi(`/media/${media.id}`, { method: 'DELETE' }), 'Ջնջված է')) onClose();
  };
  const uploadPoster = async (file: File) => {
    const fd = new FormData();
    fd.append('thumbnail', file);
    setPosterProgress(0);
    try {
      const updated = await adminUpload<Media>(`/media/${media.id}/thumbnail`, fd, setPosterProgress);
      setForm((f) => ({ ...f, thumbUrl: updated.thumbUrl }));
      await run(async () => undefined, 'Շապիկը թարմացված է');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPosterProgress(null);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={media.type === 'VIDEO' ? 'Տեսանյութ' : 'Լուսանկար'}
      size="lg"
      footer={
        <>
          <button onClick={remove} className="mr-auto inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-bold text-peach-600 hover:bg-peach-50">
            <Trash2 className="h-4 w-4" /> Ջնջել
          </button>
          <button onClick={onClose} className="rounded-full px-5 py-2.5 text-sm font-bold text-ink-soft hover:bg-ink/5">
            Չեղարկել
          </button>
          <button onClick={save} disabled={busy} className="rounded-full bg-sun-400 px-6 py-2.5 text-sm font-bold text-ink hover:bg-sun-300 disabled:opacity-50">
            Պահպանել
          </button>
        </>
      }
    >
      <div className="grid gap-6 md:grid-cols-[1.1fr_1fr]">
        <div className="space-y-3">
          {media.type === 'VIDEO' ? (
            <VideoPlayer media={{ ...media, thumbUrl: form.thumbUrl ?? media.thumbUrl }} />
          ) : (
            <MediaImage media={media} variant="full" className="aspect-[4/3] rounded-2xl" imgClassName="!object-contain bg-ink/5" />
          )}
          {media.type === 'VIDEO' && media.source === 'UPLOAD' && (
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl bg-white p-3 text-sm ring-1 ring-ink/8 hover:ring-sun-300">
              <span>
                <span className="block font-bold">Շապիկի նկար (poster)</span>
                <span className="text-xs text-ink-muted">{posterProgress !== null ? `Վերբեռնվում է… ${posterProgress}%` : 'Ցուցադրվում է մինչև տեսանյութը միացնելը'}</span>
              </span>
              <span className="rounded-full bg-sun-100 px-3 py-1.5 text-xs font-bold text-sun-700">{media.thumbUrl ? 'Փոխել' : 'Վերբեռնել'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadPoster(e.target.files[0])} />
            </label>
          )}
          <p className="text-xs text-ink-muted">
            {media.source !== 'UPLOAD' ? `${media.source === 'YOUTUBE' ? 'YouTube' : 'Vimeo'} · ${media.url}` : [media.width && `${media.width}×${media.height}`, formatBytes(media.size)].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="space-y-4">
          <Field label="Վերնագիր">
            <input className={inputCls} value={form.title ?? ''} onChange={(e) => set('title', e.target.value)} />
          </Field>
          <Field label="Նկարագրություն" help="Մի՛ նշեք երեխաների անուն-ազգանունները։">
            <textarea className={inputCls} rows={3} value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Կատեգորիա">
              <select className={inputCls} value={form.category ?? 'DAILY'} onChange={(e) => set('category', e.target.value)}>
                {Object.entries(MEDIA_CATEGORIES).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Ամսաթիվ">
              <input type="date" className={inputCls} value={form.takenAt ?? ''} onChange={(e) => set('takenAt', e.target.value)} />
            </Field>
          </div>
          <Field label="Alt տեքստ" help="Կարճ նկարագրություն տեսողության խնդիրներ ունեցողների և SEO-ի համար։">
            <input className={inputCls} value={form.alt ?? ''} onChange={(e) => set('alt', e.target.value)} />
          </Field>
          <div className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-ink/8">
            <Switch checked={!!form.isPublic} onChange={(v) => set('isPublic', v)} label="Հանրային" description="Անջատված՝ ֆայլը տեսանելի է միայն ադմինիստրատորին" />
            <Switch checked={!!form.published} onChange={(v) => set('published', v)} label="Հրապարակված" />
            <Switch checked={!!form.inGallery} onChange={(v) => set('inGallery', v)} label="Ցուցադրել Պատկերասրահում" />
          </div>
        </div>
      </div>
    </Modal>
  );
}

function ExternalVideoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const run = useAction();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('DAILY');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    const ok = await run(() => adminApi('/media/external', { method: 'POST', body: { url: url.trim(), title, category, takenAt: todayIso() } }), 'Տեսանյութը ավելացված է');
    setBusy(false);
    if (ok) {
      setUrl('');
      setTitle('');
      onClose();
    }
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="YouTube / Vimeo տեսանյութ"
      size="sm"
      footer={
        <button onClick={submit} disabled={busy || !url} className="rounded-full bg-sun-400 px-6 py-2.5 text-sm font-bold text-ink hover:bg-sun-300 disabled:opacity-40">
          Ավելացնել
        </button>
      }
    >
      <div className="space-y-4">
        <Field label="Հղում" required help="Օր.՝ https://youtu.be/… կամ https://vimeo.com/…">
          <input className={inputCls} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" autoFocus />
        </Field>
        <Field label="Վերնագիր">
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Կատեգորիա">
          <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
            {Object.entries(MEDIA_CATEGORIES).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </Modal>
  );
}

export function MediaLibrary({ mode }: { mode: Mode }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [visibility, setVisibility] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Media | null>(null);
  const [uploading, setUploading] = useState(false);
  const [external, setExternal] = useState(false);
  const [reorder, setReorder] = useState<Media[] | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const run = useAction();

  useEffect(() => {
    setPage(1);
    setSelected(new Set());
    setReorder(null);
  }, [mode]);

  const params = new URLSearchParams({ page: String(page), limit: '48' });
  if (mode !== 'GALLERY') params.set('type', mode);
  if (mode === 'GALLERY') params.set('inGallery', visibility === 'hidden' ? 'false' : 'true');
  if (search) params.set('search', search);
  if (category) params.set('category', category);
  if (visibility === 'public' || visibility === 'private') params.set('visibility', visibility);
  if (visibility === 'draft') params.set('status', 'draft');
  const { data, isLoading, isError, refetch } = useAdmin<Paged<Media>>(`/media?${params}`);
  const items = reorder ?? data?.items ?? [];
  const t = TEXT[mode];

  const toggleSel = (id: string) => setSelected((s) => (s.has(id) ? (s.delete(id), new Set(s)) : new Set(s.add(id))));
  const bulk = async (action: string, label: string) => {
    if (action === 'delete' && !(await confirm({ title: `Ջնջե՞լ ${selected.size} ֆայլ`, message: 'Ֆայլերը կհեռացվեն նաև բոլոր գրառումներից։ Գործողությունը հնարավոր չէ հետարկել։', confirmLabel: 'Ջնջել', danger: true }))) return;
    if (await run(() => adminApi('/media/bulk', { method: 'POST', body: { ids: [...selected], action } }), label)) setSelected(new Set());
  };
  const moveItem = (from: number, to: number) => {
    if (!reorder || to < 0 || to >= reorder.length) return;
    const next = [...reorder];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    setReorder(next);
  };
  const saveOrder = async () => {
    if (reorder && (await run(() => adminApi('/media/reorder', { method: 'POST', body: { ids: reorder.map((m) => m.id) } }), 'Հերթականությունը պահպանված է'))) setReorder(null);
  };

  return (
    <div>
      <PageHeader
        title={t.title}
        description={t.description}
        actions={
          reorder ? (
            <>
              <button onClick={() => setReorder(null)} className="rounded-full bg-white px-5 py-2.5 text-sm font-bold ring-1 ring-ink/10">
                Չեղարկել
              </button>
              <button onClick={saveOrder} className="rounded-full bg-sun-400 px-5 py-2.5 text-sm font-bold text-ink">
                Պահպանել հերթականությունը
              </button>
            </>
          ) : (
            <>
              {mode !== 'GALLERY' && data && data.items.length > 1 && (
                <button onClick={() => setReorder(data.items)} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold ring-1 ring-ink/10 hover:ring-ink/20">
                  <GripVertical className="h-4 w-4" /> Դասավորել
                </button>
              )}
              {mode === 'VIDEO' && (
                <button onClick={() => setExternal(true)} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold ring-1 ring-ink/10 hover:ring-ink/20">
                  <Link2 className="h-4 w-4" /> YouTube / Vimeo
                </button>
              )}
              <button onClick={() => setUploading((u) => !u)} className="inline-flex items-center gap-2 rounded-full bg-sun-400 px-5 py-2.5 text-sm font-bold text-ink shadow-soft hover:bg-sun-300">
                <Upload className="h-4 w-4" /> Վերբեռնել
              </button>
            </>
          )
        }
      />

      {uploading && !reorder && (
        <div className="mb-6 rounded-3xl bg-white p-4 shadow-soft ring-1 ring-ink/5 sm:p-5">
          <MediaUploader accept={mode === 'GALLERY' ? 'ANY' : mode} defaults={{ category: category || 'DAILY', takenAt: todayIso() }} />
        </div>
      )}

      {!reorder && (
        <div className="mb-4 flex flex-col gap-2 lg:flex-row">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input value={search} onChange={(e) => (setSearch(e.target.value), setPage(1))} placeholder="Որոնել" className={clsx(inputCls, 'pl-9')} />
          </label>
          <select value={category} onChange={(e) => (setCategory(e.target.value), setPage(1))} className={clsx(inputCls, 'lg:w-52')} aria-label="Կատեգորիա">
            <option value="">Բոլոր կատեգորիաները</option>
            {Object.entries(MEDIA_CATEGORIES).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
          <select value={visibility} onChange={(e) => (setVisibility(e.target.value), setPage(1))} className={clsx(inputCls, 'lg:w-52')} aria-label="Կարգավիճակ">
            {mode === 'GALLERY' ? (
              <>
                <option value="">Ցուցադրվող պատկերասրահում</option>
                <option value="hidden">Թաքցված պատկերասրահից</option>
              </>
            ) : (
              <>
                <option value="">Բոլորը</option>
                <option value="public">Հանրային</option>
                <option value="private">Փակ</option>
                <option value="draft">Չհրապարակված</option>
              </>
            )}
          </select>
        </div>
      )}

      {selected.size > 0 && !reorder && (
        <div className="sticky top-2 z-20 mb-4 flex flex-wrap items-center gap-2 rounded-2xl bg-ink p-2 pl-4 text-sm text-white shadow-lift">
          <span className="mr-2 font-bold">Ընտրված է՝ {selected.size}</span>
          {[
            ['publish', 'Հրապարակել', Eye],
            ['unpublish', 'Թաքցնել', EyeOff],
            ['public', 'Հանրային', LockOpen],
            ['private', 'Փակ', Lock],
            ...(mode === 'GALLERY' ? [['gallery-off', 'Հանել պատկերասրահից', EyeOff]] : [['gallery-on', 'Պատկերասրահում', Eye]]),
          ].map(([a, l, I]) => {
            const Ico = I as typeof Eye;
            return (
              <button key={a as string} onClick={() => bulk(a as string, 'Թարմացված է')} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 font-semibold hover:bg-white/10">
                <Ico className="h-4 w-4" /> {l as string}
              </button>
            );
          })}
          <button onClick={() => bulk('delete', 'Ջնջված է')} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 font-semibold text-peach-300 hover:bg-white/10">
            <Trash2 className="h-4 w-4" /> Ջնջել
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto rounded-xl px-3 py-2 font-semibold text-white/70 hover:bg-white/10">
            Չեղարկել
          </button>
        </div>
      )}

      {reorder && <p className="mb-4 rounded-2xl bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700 ring-1 ring-sky-200">Քաշեք նկարները կամ օգտագործեք սլաքները՝ հերթականությունը փոխելու համար։</p>}

      {isLoading && <LoadingBlock />}
      {isError && <ErrorBox onRetry={() => refetch()} />}
      {data && !items.length && <EmptyBox title={t.empty} text="Սեղմեք «Վերբեռնել»՝ առաջին ֆայլերն ավելացնելու համար։" icon={<Upload className="h-6 w-6" />} />}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {items.map((m, i) => {
          const sel = selected.has(m.id);
          return (
            <li
              key={m.id}
              draggable={!!reorder}
              onDragStart={() => setDragIdx(i)}
              onDragOver={(e) => reorder && e.preventDefault()}
              onDrop={() => (dragIdx !== null && moveItem(dragIdx, i), setDragIdx(null))}
              className={clsx('group overflow-hidden rounded-2xl bg-white shadow-soft ring-2 transition', sel ? 'ring-sun-400' : 'ring-transparent', dragIdx === i && 'opacity-40')}
            >
              <div className={clsx('relative aspect-square', reorder && 'cursor-grab')}>
                <button className="absolute inset-0" onClick={() => (reorder ? undefined : selected.size ? toggleSel(m.id) : setEditing(m))} aria-label={`Խմբագրել ${m.title}`}>
                  <MediaImage media={m} className="absolute inset-0" imgClassName={clsx(!m.published && 'opacity-50')} />
                </button>
                {!reorder && (
                  <button
                    onClick={() => toggleSel(m.id)}
                    aria-label="Ընտրել"
                    aria-pressed={sel}
                    className={clsx(
                      'absolute top-2 right-2 grid h-7 w-7 place-items-center rounded-lg ring-2 ring-white transition',
                      sel ? 'bg-sun-400 text-ink' : 'bg-ink/30 text-transparent opacity-0 group-hover:opacity-100 focus:opacity-100',
                      selected.size > 0 && 'opacity-100',
                    )}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
                <div className="pointer-events-none absolute top-2 left-2 flex flex-col items-start gap-1">
                  {!m.isPublic && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-ink/80 px-2 py-0.5 text-[11px] font-bold text-white">
                      <Lock className="h-3 w-3" /> Փակ
                    </span>
                  )}
                  {!m.published && <span className="rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold">Չհրապարակված</span>}
                </div>
                {m.type === 'VIDEO' && <span className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-ink/75 px-1.5 py-0.5 text-[10px] font-bold text-white">{m.source === 'UPLOAD' ? 'MP4' : m.source}</span>}
              </div>
              {reorder ? (
                <div className="flex items-center justify-between p-1">
                  <IconBtn label="Ձախ" disabled={i === 0} onClick={() => moveItem(i, i - 1)}>
                    <ArrowLeft className="h-4 w-4" />
                  </IconBtn>
                  <span className="text-xs font-bold text-ink-muted">{i + 1}</span>
                  <IconBtn label="Աջ" disabled={i === items.length - 1} onClick={() => moveItem(i, i + 1)}>
                    <ArrowRight className="h-4 w-4" />
                  </IconBtn>
                </div>
              ) : (
                <div className="px-3 py-2">
                  <p className="truncate text-sm font-bold">{m.title || 'Առանց վերնագրի'}</p>
                  <p className="flex items-center justify-between gap-2 text-xs text-ink-muted">
                    <span className="truncate">{MEDIA_CATEGORIES[m.category] ?? m.category}</span>
                    <span className="shrink-0">{formatDate(m.takenAt).replace(/, \d{4}$/, '')}</span>
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {data && data.pages > 1 && !reorder && (
        <div className="mt-6 flex items-center justify-center gap-3 text-sm">
          <IconBtn label="Նախորդ" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ArrowLeft className="h-4 w-4" />
          </IconBtn>
          <span className="font-semibold">
            {page} / {data.pages} <span className="text-ink-muted">({data.total})</span>
          </span>
          <IconBtn label="Հաջորդ" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>
            <ArrowRight className="h-4 w-4" />
          </IconBtn>
        </div>
      )}
      {data && data.items.length > 0 && !reorder && selected.size === 0 && (
        <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-muted">
          <CheckSquare className="h-3.5 w-3.5" /> Մի քանի ֆայլ միաժամանակ փոփոխելու համար սեղմեք նկարի անկյունում գտնվող քառակուսին։ <Badge>{data.total} ֆայլ</Badge>
        </p>
      )}

      <MediaEditor media={editing} onClose={() => setEditing(null)} />
      <ExternalVideoModal open={external} onClose={() => setExternal(false)} />
    </div>
  );
}
