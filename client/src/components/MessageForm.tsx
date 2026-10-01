import { useState, type FormEvent } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import clsx from 'clsx';
import { api, ApiError } from '@/lib/api';
import { Button } from './Button';

type Kind = 'CONTACT' | 'ENROLLMENT';

const input =
  'w-full rounded-2xl border-0 bg-cream-100 px-4 py-3.5 text-ink ring-1 ring-ink/8 transition placeholder:text-ink-muted/70 focus:bg-white focus:ring-2 focus:ring-sun-400 focus:outline-none aria-[invalid=true]:ring-peach-400';

function Field({ label, error, children, required }: { label: string; error?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-ink-soft">
        {label}
        {required && <span className="text-peach-500"> *</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-sm font-semibold text-peach-600">{error}</span>}
    </label>
  );
}

export function MessageForm({ kind = 'CONTACT' }: { kind?: Kind }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    setError('');
    setFieldErrors({});
    setState('sending');
    try {
      await api('/public/messages', { method: 'POST', body: { ...data, type: kind } });
      setState('sent');
      form.reset();
    } catch (err) {
      setState('idle');
      if (err instanceof ApiError && err.details) {
        setFieldErrors(Object.fromEntries(err.details.map((d) => [d.path, d.message])));
      }
      setError(err instanceof Error ? err.message : 'Սխալ տեղի ունեցավ');
    }
  }

  if (state === 'sent') {
    return (
      <div role="status" className="flex flex-col items-center rounded-4xl bg-leaf-50 px-6 py-14 text-center ring-1 ring-leaf-200">
        <CheckCircle2 className="h-14 w-14 text-leaf-500" strokeWidth={1.6} />
        <h3 className="mt-4 text-2xl font-semibold">{kind === 'ENROLLMENT' ? 'Հայտը ստացվել է' : 'Շնորհակալություն'}</h3>
        <p className="mt-2 max-w-sm text-ink-soft">{kind === 'ENROLLMENT' ? 'Մենք կկապվենք Ձեզ հետ մոտակա աշխատանքային օրվա ընթացքում՝ ծանոթության այց պայմանավորվելու համար։' : 'Ձեր հաղորդագրությունն ուղարկված է։ Շուտով կպատասխանենք։'}</p>
        <Button variant="secondary" className="mt-6" onClick={() => setState('idle')}>
          Ուղարկել ևս մեկը
        </Button>
      </div>
    );
  }

  const fe = (k: string) => fieldErrors[k];
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={kind === 'ENROLLMENT' ? 'Ծնողի անունը' : 'Անուն'} error={fe('name')} required>
          <input name="name" required autoComplete="name" className={input} aria-invalid={!!fe('name')} placeholder="Ձեր անունը" />
        </Field>
        <Field label="Հեռախոս" error={fe('phone')} required>
          <input name="phone" type="tel" required autoComplete="tel" inputMode="tel" className={input} aria-invalid={!!fe('phone')} placeholder="+374 __ ___ ___" />
        </Field>
      </div>
      <Field label="Email" error={fe('email')}>
        <input name="email" type="email" autoComplete="email" className={input} aria-invalid={!!fe('email')} placeholder="example@mail.com" />
      </Field>
      {kind === 'ENROLLMENT' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Երեխայի տարիքը" error={fe('childAge')}>
            <select name="childAge" className={input} defaultValue="">
              <option value="">Ընտրեք</option>
              {['1.5–2 տարեկան', '2–3 տարեկան', '3–4 տարեկան', '4–5 տարեկան', '5–6 տարեկան'].map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </Field>
          <Field label="Ցանկալի մեկնարկ" error={fe('startDate')}>
            <input name="startDate" className={input} placeholder="Օր.՝ նոյեմբեր" />
          </Field>
        </div>
      )}
      <Field label="Հաղորդագրություն" error={fe('message')} required={kind === 'CONTACT'}>
        <textarea name="message" rows={4} className={clsx(input, 'resize-y')} aria-invalid={!!fe('message')} placeholder={kind === 'ENROLLMENT' ? 'Հարցեր կամ լրացուցիչ տեղեկություններ (ոչ պարտադիր)' : 'Ինչո՞վ կարող ենք օգնել'} />
      </Field>
      {/* Honeypot (hidden from people) */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {error && (
        <p role="alert" className="rounded-2xl bg-peach-50 px-4 py-3 text-sm font-semibold text-peach-600">
          {error}
        </p>
      )}
      <div className="flex flex-col items-start gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-muted">Ձեր տվյալները օգտագործվում են միայն Ձեզ հետ կապ հաստատելու համար։</p>
        <Button type="submit" size="lg" disabled={state === 'sending'} icon={state === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}>
          {kind === 'ENROLLMENT' ? 'Ուղարկել հայտը' : 'Ուղարկել'}
        </Button>
      </div>
    </form>
  );
}
