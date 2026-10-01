import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import type { Media } from '@/lib/types';
import { MediaImage } from '@/components/Media';
import { Icon, ICON_LABELS } from '@/lib/icons';
import { adminApi, useAction, useAdmin } from '../api';
import { confirm } from '../store/ui';
import { MediaField, MediaListField } from './MediaPicker';
import type { UploadDefaults } from './MediaUploader';
import { Badge, EmptyBox, ErrorBox, Field, IconBtn, inputCls, LoadingBlock, Modal, PageHeader, Switch } from './ui';

type FieldType = 'text' | 'textarea' | 'date' | 'time' | 'select' | 'toggle' | 'media' | 'mediaList' | 'icon' | 'url';

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  help?: ReactNode;
  placeholder?: string;
  options?: Record<string, string>;
  rows?: number;
  half?: boolean;
  uploadDefaults?: (form: Record<string, unknown>) => UploadDefaults;
  mediaKind?: 'IMAGE' | 'VIDEO' | 'ANY';
}

type Row = Record<string, unknown> & { id: string };

export interface CrudConfig {
  endpoint: string;
  title: string;
  description?: ReactNode;
  singular: string;
  addLabel?: string;
  fields: FieldDef[];
  defaults: () => Record<string, unknown>;
  reorderable?: boolean;
  /** Field that controls visibility on the website. */
  toggleField?: 'published' | 'active';
  /** How a row is shown in the list. */
  row: (item: Row) => { title: string; subtitle?: ReactNode; media?: Media | null; badges?: ReactNode; icon?: string; extra?: ReactNode };
  emptyTitle?: string;
  emptyText?: string;
  filters?: { label: string; value: string; test: (i: Row) => boolean }[];
  modalSize?: 'md' | 'lg';
  headerExtra?: ReactNode;
}

/** Converts an item into editable form state (media fields stay as objects). */
function toForm(item: Row, fields: FieldDef[]) {
  const form: Record<string, unknown> = {};
  for (const f of fields) form[f.name] = item[f.name] ?? (f.type === 'mediaList' ? [] : f.type === 'toggle' ? false : f.type === 'media' ? null : '');
  return form;
}

/** media field `image` → `imageId`, list field `media` → `mediaIds`. */
function toPayload(form: Record<string, unknown>, fields: FieldDef[]) {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const v = form[f.name];
    if (f.type === 'media') out[`${f.name}Id`] = (v as Media | null)?.id ?? null;
    else if (f.type === 'mediaList') out.mediaIds = ((v as Media[]) ?? []).map((m) => m.id);
    else if (typeof v === 'string') out[f.name] = v.trim();
    else out[f.name] = v;
  }
  return out;
}

export function FormField({ def, form, set, error }: { def: FieldDef; form: Record<string, unknown>; set: (k: string, v: unknown) => void; error?: string }) {
  const v = form[def.name];
  const common = { id: `f-${def.name}`, 'aria-invalid': !!error, className: inputCls, placeholder: def.placeholder };
  let control: ReactNode;
  switch (def.type) {
    case 'textarea':
      control = <textarea {...common} rows={def.rows ?? 4} value={(v as string) ?? ''} onChange={(e) => set(def.name, e.target.value)} />;
      break;
    case 'date':
    case 'time':
      control = <input {...common} type={def.type} value={(v as string) ?? ''} onChange={(e) => set(def.name, e.target.value)} />;
      break;
    case 'select':
      control = (
        <select {...common} value={(v as string) ?? ''} onChange={(e) => set(def.name, e.target.value)}>
          {Object.entries(def.options ?? {}).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
      );
      break;
    case 'icon':
      control = (
        <div className="flex flex-wrap gap-1.5">
          {Object.keys(ICON_LABELS).map((k) => (
            <button
              key={k}
              type="button"
              title={ICON_LABELS[k]}
              aria-label={ICON_LABELS[k]}
              aria-pressed={v === k}
              onClick={() => set(def.name, k)}
              className={clsx('grid h-10 w-10 place-items-center rounded-xl ring-1 transition', v === k ? 'bg-sun-100 text-sun-700 ring-sun-400' : 'bg-white text-ink-soft ring-ink/10 hover:ring-ink/25')}
            >
              <Icon name={k} className="h-5 w-5" />
            </button>
          ))}
        </div>
      );
      break;
    case 'toggle':
      return <Switch checked={!!v} onChange={(x) => set(def.name, x)} label={def.label} description={typeof def.help === 'string' ? def.help : undefined} />;
    case 'media':
      control = <MediaField value={(v as Media) ?? null} onChange={(m) => set(def.name, m)} kind={def.mediaKind} uploadDefaults={def.uploadDefaults?.(form)} />;
      break;
    case 'mediaList':
      control = <MediaListField value={(v as Media[]) ?? []} onChange={(m) => set(def.name, m)} uploadDefaults={def.uploadDefaults?.(form)} />;
      break;
    default:
      control = <input {...common} type={def.type === 'url' ? 'text' : 'text'} value={(v as string) ?? ''} onChange={(e) => set(def.name, e.target.value)} />;
  }
  return (
    <Field label={def.label} help={def.help} error={error} required={def.required}>
      {control}
    </Field>
  );
}

export function CrudPage({ config }: { config: CrudConfig }) {
  const { data, isLoading, isError, error, refetch } = useAdmin<{ items: Row[] }>(config.endpoint);
  const run = useAction();
  const [editing, setEditing] = useState<{ id?: string; form: Record<string, unknown> } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('');
  const [order, setOrder] = useState<Row[] | null>(null);

  const items = useMemo(() => {
    const list = order ?? data?.items ?? [];
    const f = config.filters?.find((x) => x.value === filter);
    return f ? list.filter(f.test) : list;
  }, [data, order, filter, config.filters]);

  const openNew = () => {
    setErrors({});
    setEditing({ form: { ...toForm({ id: '' }, config.fields), ...config.defaults() } });
  };
  // Quick action links (e.g. from the dashboard) open the "new" form directly.
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    if (params.get('new') === '1') {
      openNew();
      setParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);
  const openEdit = (item: Row) => {
    setErrors({});
    setEditing({ id: item.id, form: toForm(item, config.fields) });
  };
  const set = (k: string, v: unknown) => setEditing((e) => (e ? { ...e, form: { ...e.form, [k]: v } } : e));

  async function save() {
    if (!editing) return;
    const missing = config.fields.filter((f) => f.required && !String(editing.form[f.name] ?? '').trim());
    if (missing.length) {
      setErrors(Object.fromEntries(missing.map((f) => [f.name, 'Դաշտը պարտադիր է'])));
      return;
    }
    setSaving(true);
    const body = toPayload(editing.form, config.fields);
    try {
      await adminApi(editing.id ? `${config.endpoint.replace('/admin', '')}/${editing.id}` : config.endpoint.replace('/admin', ''), { method: editing.id ? 'PUT' : 'POST', body });
      setEditing(null);
      setOrder(null);
      await run(async () => undefined, editing.id ? 'Փոփոխությունները պահպանված են' : 'Ավելացված է');
    } catch (e) {
      const details = (e as { details?: { path: string; message: string }[] }).details;
      if (details) setErrors(Object.fromEntries(details.map((d) => [d.path.replace(/Id$/, ''), d.message])));
      await run(async () => {
        throw e;
      });
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: Row) {
    const { title } = config.row(item);
    if (!(await confirm({ title: `Ջնջե՞լ ${config.singular}ը`, message: `«${title}» — այս գործողությունը հնարավոր չէ հետարկել։`, confirmLabel: 'Ջնջել', danger: true }))) return;
    await run(() => adminApi(`${config.endpoint.replace('/admin', '')}/${item.id}`, { method: 'DELETE' }), 'Ջնջված է');
    setOrder(null);
  }

  async function toggle(item: Row) {
    const key = config.toggleField!;
    await run(() => adminApi(`${config.endpoint.replace('/admin', '')}/${item.id}`, { method: 'PUT', body: { [key]: !item[key] } }), !item[key] ? 'Հրապարակված է' : 'Թաքցված է');
  }

  async function move(index: number, dir: -1 | 1) {
    const list = [...(order ?? data?.items ?? [])];
    const j = index + dir;
    if (j < 0 || j >= list.length) return;
    [list[index], list[j]] = [list[j], list[index]];
    setOrder(list);
    await run(() => adminApi(`${config.endpoint.replace('/admin', '')}/reorder`, { method: 'POST', body: { ids: list.map((i) => i.id) } }));
  }

  return (
    <div>
      <PageHeader
        title={config.title}
        description={config.description}
        actions={
          <button onClick={openNew} className="inline-flex items-center gap-2 rounded-full bg-sun-400 px-5 py-2.5 text-sm font-bold text-ink shadow-soft transition hover:bg-sun-300">
            <Plus className="h-4 w-4" /> {config.addLabel ?? 'Ավելացնել'}
          </button>
        }
      />
      {config.headerExtra}
      {config.filters && (
        <div className="mb-4 flex flex-wrap gap-2">
          {[{ label: 'Բոլորը', value: '' }, ...config.filters].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={clsx('rounded-full px-4 py-1.5 text-sm font-bold transition', filter === f.value ? 'bg-ink text-white' : 'bg-white text-ink-soft ring-1 ring-ink/10 hover:text-ink')}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {isLoading && <LoadingBlock />}
      {isError && <ErrorBox message={(error as Error)?.message} onRetry={() => refetch()} />}
      {data && items.length === 0 && (
        <EmptyBox
          title={config.emptyTitle ?? 'Դեռ ոչինչ ավելացված չէ'}
          text={config.emptyText}
          icon={<Plus className="h-6 w-6" />}
          action={
            <button onClick={openNew} className="rounded-full bg-sun-400 px-5 py-2.5 text-sm font-bold text-ink hover:bg-sun-300">
              {config.addLabel ?? 'Ավելացնել'}
            </button>
          }
        />
      )}

      <ul className="space-y-2.5">
        {items.map((item, i) => {
          const r = config.row(item);
          const visible = config.toggleField ? Boolean(item[config.toggleField]) : true;
          return (
            <li key={item.id} className={clsx('flex items-center gap-3 rounded-2xl bg-white p-2.5 pr-3 shadow-soft ring-1 ring-ink/5 transition sm:gap-4', !visible && 'opacity-70')}>
              {config.reorderable && !filter && (
                <div className="flex flex-col">
                  <IconBtn label="Վեր" className="h-7 w-7" disabled={i === 0} onClick={() => move(i, -1)}>
                    <ArrowUp className="h-4 w-4" />
                  </IconBtn>
                  <IconBtn label="Վար" className="h-7 w-7" disabled={i === items.length - 1} onClick={() => move(i, 1)}>
                    <ArrowDown className="h-4 w-4" />
                  </IconBtn>
                </div>
              )}
              {r.media !== undefined && <MediaImage media={r.media} className="hidden h-16 w-20 shrink-0 rounded-xl sm:block" />}
              {r.icon && (
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sun-100 text-sun-700">
                  <Icon name={r.icon} className="h-5 w-5" />
                </span>
              )}
              {r.extra}
              <button className="min-w-0 flex-1 text-left" onClick={() => openEdit(item)}>
                <span className="block truncate font-bold">{r.title}</span>
                {r.subtitle && <span className="mt-0.5 block truncate text-sm text-ink-muted">{r.subtitle}</span>}
                {r.badges && <span className="mt-1.5 flex flex-wrap gap-1.5">{r.badges}</span>}
              </button>
              <div className="flex shrink-0 items-center">
                {config.toggleField && (
                  <IconBtn label={visible ? 'Թաքցնել կայքից' : 'Հրապարակել'} onClick={() => toggle(item)}>
                    {visible ? <Eye className="h-4.5 w-4.5 text-leaf-600" /> : <EyeOff className="h-4.5 w-4.5" />}
                  </IconBtn>
                )}
                <IconBtn label="Խմբագրել" onClick={() => openEdit(item)}>
                  <Pencil className="h-4 w-4" />
                </IconBtn>
                <IconBtn label="Ջնջել" danger onClick={() => remove(item)}>
                  <Trash2 className="h-4 w-4" />
                </IconBtn>
              </div>
            </li>
          );
        })}
      </ul>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? `Խմբագրել ${config.singular}ը` : `Նոր ${config.singular}`}
        size={config.modalSize ?? 'md'}
        footer={
          <>
            <button onClick={() => setEditing(null)} className="rounded-full px-5 py-2.5 text-sm font-bold text-ink-soft hover:bg-ink/5">
              Չեղարկել
            </button>
            <button onClick={save} disabled={saving} className="rounded-full bg-sun-400 px-6 py-2.5 text-sm font-bold text-ink hover:bg-sun-300 disabled:opacity-50">
              {saving ? 'Պահպանվում է…' : 'Պահպանել'}
            </button>
          </>
        }
      >
        {editing && (
          <form
            onSubmit={(e) => (e.preventDefault(), save())}
            className="grid gap-4 sm:grid-cols-2"
          >
            {config.fields.map((f) => (
              <div key={f.name} className={clsx(f.half ? 'sm:col-span-1' : 'sm:col-span-2')}>
                <FormField def={f} form={editing.form} set={set} error={errors[f.name]} />
              </div>
            ))}
            <button type="submit" className="hidden" />
          </form>
        )}
      </Modal>
    </div>
  );
}

export const publishedBadge = (on: unknown, onLabel = 'Հրապարակված', offLabel = 'Թաքցված') =>
  on ? <Badge tone="green">{onLabel}</Badge> : <Badge tone="gray">{offLabel}</Badge>;
