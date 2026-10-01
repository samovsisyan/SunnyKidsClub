import { useState } from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';
import type { Media, MealType, MenuEntry } from '@/lib/types';
import { MEAL_TYPES } from '@/lib/constants';
import { WEEKDAYS } from '@/lib/format';
import { Icon, ICON_LABELS } from '@/lib/icons';
import { api } from '@/lib/api';
import { adminApi, useAction, useAdmin } from '../api';
import { MediaField, MediaListField } from '../components/MediaPicker';
import { Repeater, SettingsShell, TextInput, useSettingForm } from '../components/SettingsForm';
import { Field, inputCls, LoadingBlock, PageHeader, Panel, Switch } from '../components/ui';
import { toast } from '../store/ui';
import { FaqAdmin, MealsCrud } from './content';

type Json = Record<string, unknown>;
const arr = <T,>(v: unknown) => (Array.isArray(v) ? (v as T[]) : []);

function IconSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sun-100 text-sun-700">
        <Icon name={value} className="h-5 w-5" />
      </span>
      <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} aria-label="Պատկերակ">
        {Object.entries(ICON_LABELS).map(([k, l]) => (
          <option key={k} value={k}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ---------------- About ---------------- */

export function AboutAdmin() {
  const s = useSettingForm('about');
  return (
    <div>
      <PageHeader title="Մեր մասին" description="«Մեր մասին» էջի և գլխավոր էջի համապատասխան բաժնի բովանդակությունը։" />
      <SettingsShell state={s}>
        {(f) => (
          <>
            <Panel title="Ներածություն">
              <div className="space-y-4">
                <TextInput label="Վերնագիր" value={f.title} onChange={(v) => s.set('title', v)} />
                <TextInput label="Կարճ նկարագրություն" textarea rows={2} value={f.lead} onChange={(v) => s.set('lead', v)} />
                <TextInput label="Ով ենք մենք" textarea rows={5} value={f.story} onChange={(v) => s.set('story', v)} />
              </div>
            </Panel>
            <Panel title="Լուսանկարներ" description="Առաջին 3 նկարները ցուցադրվում են «Մեր մասին» էջում, առաջին 2-ը՝ գլխավոր էջում։">
              <MediaListField value={arr<Media>(f.imageMedia)} onChange={(m) => s.set('imageMedia', m)} uploadDefaults={{ category: 'ROOMS', inGallery: false }} />
            </Panel>
            <div className="grid gap-6 lg:grid-cols-2">
              <Panel title="Փիլիսոփայություն">
                <div className="space-y-4">
                  <TextInput label="Վերնագիր" value={f.philosophyTitle} onChange={(v) => s.set('philosophyTitle', v)} />
                  <TextInput label="Տեքստ" textarea rows={5} value={f.philosophy} onChange={(v) => s.set('philosophy', v)} />
                </div>
              </Panel>
              <Panel title="Մոտեցում երեխայի զարգացմանը">
                <div className="space-y-4">
                  <TextInput label="Վերնագիր" value={f.approachTitle} onChange={(v) => s.set('approachTitle', v)} />
                  <TextInput label="Տեքստ" textarea rows={5} value={f.approach} onChange={(v) => s.set('approach', v)} />
                </div>
              </Panel>
            </div>
            <Panel title="Մեր արժեքները" description="Անվտանգ միջավայր, պրոֆեսիոնալ թիմ, անհատական ուշադրություն և այլն։">
              <Repeater
                items={arr<Json>(f.values)}
                onChange={(v) => s.set('values', v)}
                blank={() => ({ icon: 'heart', title: '', text: '' })}
                render={(item, up) => (
                  <div className="grid gap-3 md:grid-cols-[14rem_1fr]">
                    <IconSelect value={item.icon as string} onChange={(icon) => up({ icon })} />
                    <input className={inputCls} placeholder="Վերնագիր" value={item.title as string} onChange={(e) => up({ title: e.target.value })} />
                    <textarea className={clsx(inputCls, 'md:col-span-2')} rows={2} placeholder="Տեքստ" value={item.text as string} onChange={(e) => up({ text: e.target.value })} />
                  </div>
                )}
              />
            </Panel>
          </>
        )}
      </SettingsShell>
    </div>
  );
}

/* ---------------- Contact ---------------- */

export function ContactAdmin() {
  const s = useSettingForm('contact');
  return (
    <div>
      <PageHeader title="Կապ" description="Կոնտակտային տվյալներ, սոցիալական ցանցեր, աշխատանքային ժամեր և քարտեզ։ Ցուցադրվում են «Կապ» էջում և կայքի ներքևի հատվածում։" />
      <SettingsShell state={s}>
        {(f) => (
          <>
            <Panel title="Կոնտակտներ">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <TextInput label="Հասցե" value={f.address} onChange={(v) => s.set('address', v)} />
                </div>
                <TextInput label="Հեռախոս" value={f.phone} onChange={(v) => s.set('phone', v)} placeholder="+374 xx xxx xxx" />
                <TextInput label="Լրացուցիչ հեռախոս" value={f.phone2} onChange={(v) => s.set('phone2', v)} />
                <TextInput label="Email" value={f.email} onChange={(v) => s.set('email', v)} />
              </div>
            </Panel>
            <Panel title="Սոցիալական ցանցեր" description="Դատարկ դաշտերը չեն ցուցադրվում կայքում։">
              <div className="grid gap-4 md:grid-cols-3">
                <TextInput label="Instagram" value={f.instagram} onChange={(v) => s.set('instagram', v)} placeholder="https://instagram.com/…" />
                <TextInput label="Facebook" value={f.facebook} onChange={(v) => s.set('facebook', v)} placeholder="https://facebook.com/…" />
                <TextInput label="WhatsApp" value={f.whatsapp} onChange={(v) => s.set('whatsapp', v)} placeholder="+374…" help="Հեռախոսահամար կամ wa.me հղում" />
              </div>
            </Panel>
            <Panel title="Աշխատանքային ժամեր">
              <Repeater
                items={arr<Json>(f.workingHours)}
                onChange={(v) => s.set('workingHours', v)}
                blank={() => ({ days: '', hours: '' })}
                render={(item, up) => (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input className={inputCls} placeholder="Օր.՝ Երկուշաբթի – Ուրբաթ" value={item.days as string} onChange={(e) => up({ days: e.target.value })} />
                    <input className={inputCls} placeholder="08:30 – 18:30" value={item.hours as string} onChange={(e) => up({ hours: e.target.value })} />
                  </div>
                )}
              />
            </Panel>
            <Panel title="Google Maps">
              <div className="space-y-4">
                <TextInput
                  label="Քարտեզի embed հղում"
                  value={f.mapEmbedUrl}
                  onChange={(v) => s.set('mapEmbedUrl', (v.match(/src="([^"]+)"/)?.[1] ?? v).trim())}
                  help="Google Maps → Share → Embed a map → պատճենեք կոդը և տեղադրեք այստեղ (հղումը ավտոմատ կառանձնացվի)։"
                />
                <TextInput label="Քարտեզի հղում (հասցեի վրա սեղմելիս)" value={f.mapLink} onChange={(v) => s.set('mapLink', v)} placeholder="https://maps.app.goo.gl/…" />
              </div>
            </Panel>
          </>
        )}
      </SettingsShell>
    </div>
  );
}

/* ---------------- Parents info (inside FAQ page) ---------------- */

function ParentsInfo() {
  const s = useSettingForm('parents');
  return (
    <SettingsShell state={s}>
      {(f) => (
        <>
          <Panel title="Ներածություն">
            <TextInput label="Տեքստ" textarea rows={3} value={f.intro} onChange={(v) => s.set('intro', v)} />
          </Panel>
          <Panel title="Տեղեկատվական բաժիններ" description="Յուրաքանչյուր տող ցուցադրվում է որպես առանձին կետ։">
            <Repeater
              items={arr<Json>(f.sections)}
              onChange={(v) => s.set('sections', v)}
              blank={() => ({ icon: 'clipboard', title: '', body: '' })}
              addLabel="Ավելացնել բաժին"
              render={(item, up) => (
                <div className="grid gap-3 md:grid-cols-[14rem_1fr]">
                  <IconSelect value={item.icon as string} onChange={(icon) => up({ icon })} />
                  <input className={inputCls} placeholder="Վերնագիր" value={item.title as string} onChange={(e) => up({ title: e.target.value })} />
                  <textarea className={clsx(inputCls, 'md:col-span-2')} rows={4} placeholder="Ամեն կետ՝ նոր տողից" value={item.body as string} onChange={(e) => up({ body: e.target.value })} />
                </div>
              )}
            />
          </Panel>
        </>
      )}
    </SettingsShell>
  );
}

export function FaqPage() {
  const [tab, setTab] = useState<'faq' | 'info'>('faq');
  return (
    <div>
      <div className="mb-6 inline-flex rounded-full bg-white p-1 shadow-soft ring-1 ring-ink/5">
        {[
          ['faq', 'Հաճախ տրվող հարցեր'],
          ['info', 'Տեղեկատվություն ծնողներին'],
        ].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v as typeof tab)} className={clsx('rounded-full px-4 py-2 text-sm font-bold', tab === v ? 'bg-ink text-white' : 'text-ink-soft')}>
            {l}
          </button>
        ))}
      </div>
      {tab === 'faq' ? (
        <FaqAdmin />
      ) : (
        <>
          <PageHeader title="Տեղեկատվություն ծնողներին" description="«Ծնողների համար» էջի բաժինները՝ ինչ բերել, հագուստ, սննդակարգ, հիվանդության կանոններ, գրանցում։" />
          <ParentsInfo />
        </>
      )}
    </div>
  );
}

/* ---------------- Food ---------------- */

const MEALS: MealType[] = ['BREAKFAST', 'LUNCH', 'SNACK', 'DINNER'];

function WeeklyMenu() {
  const { data, isLoading } = useAdmin<{ items: MenuEntry[] }>('/menu');
  const run = useAction();
  const [grid, setGrid] = useState<Record<string, string> | null>(null);
  const current = grid ?? Object.fromEntries((data?.items ?? []).map((e) => [`${e.weekday}-${e.mealType}`, e.dishes]));
  if (isLoading) return <LoadingBlock />;
  const save = async () => {
    const items = Object.entries(current)
      .filter(([, v]) => v.trim())
      .map(([k, dishes]) => {
        const [w, mealType] = k.split('-');
        return { weekday: Number(w), mealType, dishes: dishes.trim() };
      });
    if (await run(() => adminApi('/menu', { method: 'PUT', body: { items } }), 'Ճաշացանկը պահպանված է')) setGrid(null);
  };
  return (
    <Panel
      title="Շաբաթվա ճաշացանկ"
      description="Լրացրեք ուտեստները ըստ օրերի։ Դատարկ օրերը չեն ցուցադրվում։"
      actions={
        <button onClick={save} disabled={!grid} className="rounded-full bg-sun-400 px-5 py-2 text-sm font-bold text-ink hover:bg-sun-300 disabled:opacity-40">
          Պահպանել
        </button>
      }
    >
      <div className="-mx-2 overflow-x-auto px-2">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr>
              <th className="w-32 pb-2" />
              {MEALS.map((m) => (
                <th key={m} className="pb-2 font-bold text-ink-soft">
                  {MEAL_TYPES[m]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6].map((w) => (
              <tr key={w}>
                <th className="py-1 pr-2 font-bold">{WEEKDAYS[w]}</th>
                {MEALS.map((m) => (
                  <td key={m} className="p-1">
                    <input
                      className={clsx(inputCls, 'py-2 text-sm')}
                      value={current[`${w}-${m}`] ?? ''}
                      onChange={(e) => setGrid({ ...current, [`${w}-${m}`]: e.target.value })}
                      aria-label={`${WEEKDAYS[w]} — ${MEAL_TYPES[m]}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function FoodTexts() {
  const s = useSettingForm('food');
  return (
    <SettingsShell state={s}>
      {(f) => (
        <Panel title="Բաժնի տեքստեր">
          <div className="space-y-4">
            <TextInput label="Վերնագիր" value={f.title} onChange={(v) => s.set('title', v)} />
            <TextInput label="Ներածություն" textarea value={f.intro} onChange={(v) => s.set('intro', v)} />
            <Field label="Սկզբունքներ">
              <Repeater
                items={arr<Json>(f.principles)}
                onChange={(v) => s.set('principles', v)}
                blank={() => ({ title: '', text: '' })}
                render={(item, up) => (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input className={inputCls} placeholder="Վերնագիր" value={item.title as string} onChange={(e) => up({ title: e.target.value })} />
                    <input className={inputCls} placeholder="Տեքստ" value={item.text as string} onChange={(e) => up({ text: e.target.value })} />
                  </div>
                )}
              />
            </Field>
            <Switch checked={!!f.showWeeklyMenu} onChange={(v) => s.set('showWeeklyMenu', v)} label="Ցուցադրել շաբաթվա ճաշացանկը կայքում" />
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label="Ճաշացանկի վերնագիր" value={f.weekLabel} onChange={(v) => s.set('weekLabel', v)} placeholder="Օր.՝ Ճաշացանկ 6–10 հոկտեմբեր" />
              <TextInput label="Նշում" value={f.notes} onChange={(v) => s.set('notes', v)} placeholder="Օր.՝ Ճաշացանկը կարող է փոփոխվել" />
            </div>
          </div>
        </Panel>
      )}
    </SettingsShell>
  );
}

export function FoodAdmin() {
  const [tab, setTab] = useState<'meals' | 'menu' | 'texts'>('meals');
  return (
    <div>
      <div className="mb-6 inline-flex flex-wrap rounded-full bg-white p-1 shadow-soft ring-1 ring-ink/5">
        {[
          ['meals', 'Սննդի քարտեր'],
          ['menu', 'Շաբաթվա ճաշացանկ'],
          ['texts', 'Տեքստեր'],
        ].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v as typeof tab)} className={clsx('rounded-full px-4 py-2 text-sm font-bold', tab === v ? 'bg-ink text-white' : 'text-ink-soft')}>
            {l}
          </button>
        ))}
      </div>
      {tab === 'meals' && <MealsCrud />}
      {tab === 'menu' && (
        <>
          <PageHeader title="Շաբաթվա ճաշացանկ" />
          <WeeklyMenu />
        </>
      )}
      {tab === 'texts' && (
        <>
          <PageHeader title="Սնունդ — տեքստեր" />
          <FoodTexts />
        </>
      )}
    </div>
  );
}

/* ---------------- Site settings ---------------- */

function PasswordPanel() {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      await api('/auth/password', { method: 'POST', body: { current: cur, next } });
      toast.success('Գաղտնաբառը փոխված է');
      setCur('');
      setNext('');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Panel title="Գաղտնաբառ" description="Նոր գաղտնաբառը պետք է լինի առնվազն 10 նիշ։">
      <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <Field label="Ընթացիկ գաղտնաբառ">
          <input type="password" autoComplete="current-password" className={inputCls} value={cur} onChange={(e) => setCur(e.target.value)} />
        </Field>
        <Field label="Նոր գաղտնաբառ">
          <input type="password" autoComplete="new-password" className={inputCls} value={next} onChange={(e) => setNext(e.target.value)} />
        </Field>
        <button type="button" disabled={busy || !cur || next.length < 10} onClick={submit} className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-white disabled:opacity-40">
          <KeyRound className="h-4 w-4" /> Փոխել
        </button>
      </div>
    </Panel>
  );
}

function PrivacyPanel() {
  const s = useSettingForm('privacy');
  return (
    <SettingsShell state={s}>
      {(f) => (
        <Panel title="Գաղտնիություն" description="Երեխաների լուսանկարների և տեսանյութերի պաշտպանություն։">
          <div className="space-y-5">
            <div className="flex gap-3 rounded-2xl bg-leaf-50 p-4 text-sm text-leaf-700 ring-1 ring-leaf-200">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              <p>
                Վերբեռնված լուսանկարներից ավտոմատ հեռացվում են EXIF/GPS տվյալները։ «Փակ» ֆայլերը երբեք չեն ցուցադրվում կայքում, և դրանց հղումները հասանելի են միայն ադմինիստրատորին։
              </p>
            </div>
            <Switch
              checked={f.defaultPublic !== false}
              onChange={(v) => s.set('defaultPublic', v)}
              label="Նոր վերբեռնված ֆայլերը լինեն հանրային"
              description="Անջատելու դեպքում յուրաքանչյուր նոր ֆայլ կլինի «Փակ», մինչև այն ձեռքով չհրապարակեք։"
            />
            <Switch
              checked={!!f.showChildNames}
              onChange={(v) => s.set('showChildNames', v)}
              label="Թույլատրել երեխաների անունները նկարագրություններում"
              description="Անջատված վիճակում ադմին վահանակը կհիշեցնի չնշել երեխաների անուն-ազգանունները։ Միացրեք միայն ծնողների գրավոր համաձայնության դեպքում։"
            />
          </div>
        </Panel>
      )}
    </SettingsShell>
  );
}

export function SiteSettingsAdmin() {
  const s = useSettingForm('site');
  const [tab, setTab] = useState<'site' | 'privacy' | 'account'>('site');
  return (
    <div>
      <PageHeader title="Կայքի կարգավորումներ" description="Գլխավոր էջ, SEO, գաղտնիություն և հաշվի անվտանգություն։" />
      <div className="mb-6 inline-flex flex-wrap rounded-full bg-white p-1 shadow-soft ring-1 ring-ink/5">
        {[
          ['site', 'Գլխավոր էջ և SEO'],
          ['privacy', 'Գաղտնիություն'],
          ['account', 'Հաշիվ'],
        ].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v as typeof tab)} className={clsx('rounded-full px-4 py-2 text-sm font-bold', tab === v ? 'bg-ink text-white' : 'text-ink-soft')}>
            {l}
          </button>
        ))}
      </div>
      {tab === 'privacy' && <PrivacyPanel />}
      {tab === 'account' && <PasswordPanel />}
      {tab === 'site' && (
        <SettingsShell state={s}>
          {(f) => (
            <>
              <Panel title="Գլխավոր էջի վերնամաս (Hero)">
                <div className="space-y-4">
                  <TextInput label="Կարգախոս" value={f.slogan} onChange={(v) => s.set('slogan', v)} />
                  <TextInput label="Կարճ նկարագրություն" textarea rows={3} value={f.heroDescription} onChange={(v) => s.set('heroDescription', v)} />
                  <Field label="Լուսանկարներ / տեսանյութ" help="Առաջինը ցուցադրվում է մեծ չափսով (կարող է լինել MP4 տեսանյութ՝ առանց ձայնի), հաջորդ երկուսը՝ փոքր։">
                    <MediaListField value={arr<Media>(f.heroMedia)} onChange={(m) => s.set('heroMedia', m.slice(0, 3))} uploadDefaults={{ inGallery: false }} />
                  </Field>
                  <Field label="Արագ փաստեր">
                    <Repeater
                      items={arr<Json>(f.highlights)}
                      onChange={(v) => s.set('highlights', v.slice(0, 4))}
                      blank={() => ({ value: '', label: '' })}
                      render={(item, up) => (
                        <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
                          <input className={inputCls} placeholder="2–6" value={item.value as string} onChange={(e) => up({ value: e.target.value })} />
                          <input className={inputCls} placeholder="տարեկան երեխաներ" value={item.label as string} onChange={(e) => up({ label: e.target.value })} />
                        </div>
                      )}
                    />
                  </Field>
                </div>
              </Panel>
              <Panel title="Գրանցման բաժին (CTA)">
                <div className="space-y-4">
                  <TextInput label="Վերնագիր" value={f.ctaTitle} onChange={(v) => s.set('ctaTitle', v)} />
                  <TextInput label="Տեքստ" textarea rows={2} value={f.ctaText} onChange={(v) => s.set('ctaText', v)} />
                </div>
              </Panel>
              <Panel title="SEO" description="Որոնողական համակարգերի և սոցիալական ցանցերում տարածման համար։">
                <div className="space-y-4">
                  <TextInput label="Կայքի վերնագիր (title)" value={f.seoTitle} onChange={(v) => s.set('seoTitle', v)} help={`${String(f.seoTitle ?? '').length}/60 նիշ`} />
                  <TextInput label="Նկարագրություն (description)" textarea rows={2} value={f.seoDescription} onChange={(v) => s.set('seoDescription', v)} help={`${String(f.seoDescription ?? '').length}/160 նիշ`} />
                  <Field label="Open Graph նկար" help="Ցուցադրվում է Facebook-ում, Telegram-ում և այլուր հղումը կիսվելիս (1200×630)։">
                    <MediaField value={(f.ogImageMedia as Media) ?? null} onChange={(m) => s.set('ogImageMedia', m)} uploadDefaults={{ inGallery: false }} />
                  </Field>
                </div>
              </Panel>
            </>
          )}
        </SettingsShell>
      )}
    </div>
  );
}
