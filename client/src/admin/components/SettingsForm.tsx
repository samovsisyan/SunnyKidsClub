import { useEffect, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from 'lucide-react';
import type { Media } from '@/lib/types';
import { adminApi, useAction, useAdmin } from '../api';
import { ErrorBox, Field, IconBtn, inputCls, LoadingBlock } from './ui';

type Json = Record<string, unknown>;
interface SettingResponse {
  value: Json;
  resolved: Json;
}

/**
 * Loads a settings section into local form state.
 * Media fields: `xxxMediaId(s)` are edited through `xxxMedia` objects (resolved by the API).
 */
export function useSettingForm(key: string) {
  const query = useAdmin<SettingResponse>(`/settings/${key}`);
  const run = useAction();
  const [form, setForm] = useState<Json | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (query.data && !dirty) setForm(query.data.resolved);
  }, [query.data, dirty]);

  const set = (k: string, v: unknown) => {
    setForm((f) => ({ ...(f ?? {}), [k]: v }));
    setDirty(true);
  };

  async function save() {
    if (!form) return;
    setSaving(true);
    const body: Json = {};
    for (const [k, v] of Object.entries(form)) {
      if (k.endsWith('MediaId') || k.endsWith('MediaIds')) continue;
      if (k.endsWith('Media')) {
        const base = k.slice(0, -'Media'.length);
        if (Array.isArray(v)) body[`${base}MediaIds`] = (v as Media[]).map((m) => m.id);
        else body[`${base}MediaId`] = (v as Media | null)?.id ?? null;
      } else body[k] = v;
    }
    const ok = await run(() => adminApi(`/settings/${key}`, { method: 'PUT', body }), 'Պահպանված է');
    setSaving(false);
    if (ok) setDirty(false);
  }

  return { form, set, save, saving, dirty, query };
}

export function SettingsShell({ state, children }: { state: ReturnType<typeof useSettingForm>; children: (form: Json) => ReactNode }) {
  if (state.query.isLoading || (!state.form && !state.query.isError)) return <LoadingBlock />;
  if (state.query.isError) return <ErrorBox onRetry={() => state.query.refetch()} />;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        state.save();
      }}
      className="space-y-6 pb-24"
    >
      {children(state.form!)}
      <div className="fixed right-4 bottom-4 z-30 sm:right-8 sm:bottom-6">
        <button
          type="submit"
          disabled={state.saving || !state.dirty}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-bold text-white shadow-lift transition hover:bg-ink/90 disabled:bg-ink/30 disabled:shadow-none"
        >
          <Save className="h-4 w-4" />
          {state.saving ? 'Պահպանվում է…' : state.dirty ? 'Պահպանել փոփոխությունները' : 'Պահպանված է'}
        </button>
      </div>
    </form>
  );
}

export function TextInput({ label, value, onChange, help, placeholder, textarea, rows = 3 }: { label: string; value: unknown; onChange: (v: string) => void; help?: string; placeholder?: string; textarea?: boolean; rows?: number }) {
  return (
    <Field label={label} help={help}>
      {textarea ? (
        <textarea className={inputCls} rows={rows} value={(value as string) ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={inputCls} value={(value as string) ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </Field>
  );
}

/** Editable list of small objects (values, working hours, highlights…). */
export function Repeater<T extends Json>({
  items,
  onChange,
  blank,
  render,
  addLabel = 'Ավելացնել',
}: {
  items: T[];
  onChange: (items: T[]) => void;
  blank: () => T;
  render: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode;
  addLabel?: string;
}) {
  const update = (i: number, patch: Partial<T>) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 rounded-2xl bg-cream-100/70 p-3 ring-1 ring-ink/5">
          <div className="min-w-0 flex-1">{render(item, (p) => update(i, p), i)}</div>
          <div className="flex flex-col">
            <IconBtn label="Վեր" className="h-8 w-8" disabled={i === 0} onClick={() => move(i, -1)}>
              <ArrowUp className="h-4 w-4" />
            </IconBtn>
            <IconBtn label="Վար" className="h-8 w-8" disabled={i === items.length - 1} onClick={() => move(i, 1)}>
              <ArrowDown className="h-4 w-4" />
            </IconBtn>
            <IconBtn label="Հեռացնել" className="h-8 w-8" danger onClick={() => onChange(items.filter((_, j) => j !== i))}>
              <Trash2 className="h-4 w-4" />
            </IconBtn>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, blank()])}
        className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-ink-soft ring-1 ring-ink/10 hover:text-ink hover:ring-ink/20"
      >
        <Plus className="h-4 w-4" /> {addLabel}
      </button>
    </div>
  );
}
