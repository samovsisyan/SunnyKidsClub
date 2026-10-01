import { useState } from 'react';
import { Mail, MailOpen, Phone, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import type { ContactMessage } from '@/lib/types';
import { formatDateTime, telHref } from '@/lib/format';
import { adminApi, useAction, useAdmin } from '../api';
import { Badge, EmptyBox, ErrorBox, IconBtn, LoadingBlock, PageHeader } from '../components/ui';
import { confirm } from '../store/ui';

export default function Messages() {
  const [filter, setFilter] = useState('');
  const q = filter === 'unread' ? '?unread=true' : filter ? `?type=${filter}` : '';
  const { data, isLoading, isError, refetch } = useAdmin<{ items: ContactMessage[] }>(`/messages${q}`);
  const run = useAction();
  const [open, setOpen] = useState<string | null>(null);

  const markRead = (m: ContactMessage, read = true) => m.read !== read && run(() => adminApi(`/messages/${m.id}`, { method: 'PATCH', body: { read } }));
  const remove = async (m: ContactMessage) => {
    if (await confirm({ title: 'Ջնջե՞լ հաղորդագրությունը', message: `${m.name} — ${formatDateTime(m.createdAt)}`, confirmLabel: 'Ջնջել', danger: true }))
      run(() => adminApi(`/messages/${m.id}`, { method: 'DELETE' }), 'Ջնջված է');
  };

  return (
    <div>
      <PageHeader title="Հաղորդագրություններ" description="Կայքի կապի ձևից և գրանցման հայտերից ստացված հաղորդագրությունները։" />
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          ['', 'Բոլորը'],
          ['unread', 'Չկարդացված'],
          ['ENROLLMENT', 'Գրանցման հայտեր'],
          ['CONTACT', 'Հաղորդագրություններ'],
        ].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} className={clsx('rounded-full px-4 py-1.5 text-sm font-bold', filter === v ? 'bg-ink text-white' : 'bg-white text-ink-soft ring-1 ring-ink/10')}>
            {l}
          </button>
        ))}
      </div>
      {isLoading && <LoadingBlock />}
      {isError && <ErrorBox onRetry={() => refetch()} />}
      {data && !data.items.length && <EmptyBox title="Հաղորդագրություններ չկան" text="Երբ ծնողները լրացնեն կայքի ձևը, հաղորդագրությունները կհայտնվեն այստեղ։" icon={<Mail className="h-6 w-6" />} />}
      <ul className="space-y-2.5">
        {data?.items.map((m) => {
          const expanded = open === m.id;
          return (
            <li key={m.id} className={clsx('rounded-2xl bg-white shadow-soft ring-1 transition', m.read ? 'ring-ink/5' : 'ring-leaf-300')}>
              <div className="flex items-start gap-3 p-4">
                <span className={clsx('mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl', m.read ? 'bg-ink/5 text-ink-muted' : 'bg-leaf-100 text-leaf-700')}>
                  {m.read ? <MailOpen className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
                </span>
                <button
                  className="min-w-0 flex-1 text-left"
                  onClick={() => {
                    setOpen(expanded ? null : m.id);
                    markRead(m);
                  }}
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">{m.name}</span>
                    {m.type === 'ENROLLMENT' ? <Badge tone="yellow">Գրանցման հայտ</Badge> : <Badge tone="blue">Հաղորդագրություն</Badge>}
                    {!m.read && <Badge tone="green">Նոր</Badge>}
                  </span>
                  <span className={clsx('mt-1 block text-sm text-ink-soft', !expanded && 'truncate')}>{m.message || '—'}</span>
                  <span className="mt-1 block text-xs text-ink-muted">{formatDateTime(m.createdAt)}</span>
                </button>
                <div className="flex shrink-0">
                  <IconBtn label={m.read ? 'Նշել որպես չկարդացված' : 'Նշել որպես կարդացված'} onClick={() => markRead(m, !m.read)}>
                    {m.read ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                  </IconBtn>
                  <IconBtn label="Ջնջել" danger onClick={() => remove(m)}>
                    <Trash2 className="h-4 w-4" />
                  </IconBtn>
                </div>
              </div>
              {expanded && (
                <dl className="grid gap-3 border-t border-ink/5 px-4 py-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="text-xs font-bold text-ink-muted">Հեռախոս</dt>
                    <dd>
                      <a href={telHref(m.phone)} className="inline-flex items-center gap-1 font-bold text-sky-600">
                        <Phone className="h-3.5 w-3.5" /> {m.phone}
                      </a>
                    </dd>
                  </div>
                  {m.email && (
                    <div>
                      <dt className="text-xs font-bold text-ink-muted">Email</dt>
                      <dd>
                        <a href={`mailto:${m.email}`} className="font-bold text-sky-600">
                          {m.email}
                        </a>
                      </dd>
                    </div>
                  )}
                  {m.childAge && (
                    <div>
                      <dt className="text-xs font-bold text-ink-muted">Երեխայի տարիքը</dt>
                      <dd className="font-bold">{m.childAge}</dd>
                    </div>
                  )}
                  {m.startDate && (
                    <div>
                      <dt className="text-xs font-bold text-ink-muted">Ցանկալի մեկնարկ</dt>
                      <dd className="font-bold">{m.startDate}</dd>
                    </div>
                  )}
                </dl>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
