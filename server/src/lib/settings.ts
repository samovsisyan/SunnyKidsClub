import type { Media, Prisma } from '@prisma/client';
import { prisma } from './prisma.js';
import { publicMedia, serializeMedia } from './serialize.js';
import { SETTING_KEYS, type SettingKey } from './constants.js';

type Json = Record<string, unknown>;

/** Defaults are only used until the administrator saves the section for the first time. */
export const SETTING_DEFAULTS: Record<SettingKey, Json> = {
  site: {
    name: 'Sunny Kids Club',
    slogan: 'Աճում ենք միասին՝ խաղալով, սովորելով և բացահայտելով',
    heroDescription:
      'Ջերմ, անվտանգ և զարգացնող միջավայր 2–6 տարեկան երեխաների համար, որտեղ ամեն օրը լի է խաղով, ստեղծագործությամբ ու նոր բացահայտումներով։',
    heroMediaIds: [],
    highlights: [
      { value: '2–6', label: 'տարեկան երեխաներ' },
      { value: '08:30–18:30', label: 'աշխատանքային ժամեր' },
      { value: '12', label: 'երեխա խմբում' },
    ],
    ctaTitle: 'Եկեք ծանոթանանք',
    ctaText: 'Այցելեք մեզ, տեսեք մեր խմբասենյակները և զրուցեք դաստիարակների հետ։ Գրանցման հայտը կզբաղեցնի ընդամենը մեկ րոպե։',
    seoTitle: 'Sunny Kids Club — Մանկապարտեզ Երևանում',
    seoDescription: 'Sunny Kids Club՝ ջերմ, անվտանգ և զարգացնող միջավայր երեխաների համար։',
    ogImageMediaId: null,
  },
  about: {
    title: 'Մենք ստեղծել ենք մի վայր, որտեղ երեխաները երջանիկ են',
    lead: 'Sunny Kids Club-ը մասնավոր մանկապարտեզ և զարգացման կենտրոն է, որտեղ յուրաքանչյուր երեխա զգում է ջերմություն, ուշադրություն և հոգատարություն։',
    story:
      'Մեր թիմը համոզված է, որ վաղ մանկության տարիներն ամենակարևորն են։ Այդ պատճառով մենք ստեղծել ենք միջավայր, որտեղ երեխաները սովորում են խաղի միջոցով, զարգացնում են իրենց հետաքրքրասիրությունը և սովորում են ընկերանալ։',
    philosophyTitle: 'Մեր փիլիսոփայությունը',
    philosophy:
      'Յուրաքանչյուր երեխա յուրահատուկ է։ Մենք հարգում ենք նրա տեմպը, հետաքրքրությունները և զգացմունքները՝ օգնելով նրան դառնալ ինքնավստահ, բարի և ստեղծագործ անհատ։',
    approachTitle: 'Մեր մոտեցումը',
    approach:
      'Մենք համադրում ենք խաղը, ստեղծագործությունը և ուսուցումը։ Փոքր խմբերը թույլ են տալիս ուշադրություն դարձնել յուրաքանչյուր երեխայի զարգացմանը և պարբերաբար կիսվել ծնողների հետ նրա առաջընթացով։',
    values: [
      { icon: 'shield', title: 'Անվտանգ միջավայր', text: 'Հսկվող մուտք, մաքուր և հարմարավետ տարածքներ, որոնք նախագծված են հենց երեխաների համար։' },
      { icon: 'heart', title: 'Ջերմ ու հոգատար վերաբերմունք', text: 'Մեր դաստիարակները ստեղծում են տնային ջերմություն և վստահության մթնոլորտ։' },
      { icon: 'book', title: 'Զարգացնող զբաղմունքներ', text: 'Նախադպրոցական պատրաստություն, երաժշտություն, նկարչություն և շարժողական խաղեր։' },
      { icon: 'users', title: 'Պրոֆեսիոնալ թիմ', text: 'Մանկավարժական կրթությամբ և փորձով մասնագետներ, ովքեր սիրում են իրենց գործը։' },
      { icon: 'sparkles', title: 'Անհատական ուշադրություն', text: 'Փոքր խմբեր և անհատական մոտեցում յուրաքանչյուր երեխայի կարիքներին։' },
      { icon: 'sun', title: 'Ակտիվ ու ուրախ օր', text: 'Ամեն օր զբոսանքներ, խաղեր, ստեղծագործություն և նոր բացահայտումներ։' },
    ],
    imageMediaIds: [],
  },
  contact: {
    address: 'Երևան, Հայաստան (հասցեն լրացրեք ադմին վահանակից)',
    phone: '+374 00 000 000',
    phone2: '',
    email: 'info@sunnykids.am',
    instagram: '',
    facebook: '',
    whatsapp: '',
    workingHours: [
      { days: 'Երկուշաբթի – Ուրբաթ', hours: '08:30 – 18:30' },
      { days: 'Շաբաթ – Կիրակի', hours: 'Փակ է' },
    ],
    mapEmbedUrl: '',
    mapLink: '',
  },
  parents: {
    intro: 'Այստեղ հավաքել ենք այն ամենը, ինչ անհրաժեշտ է իմանալ մանկապարտեզ հաճախելուց առաջ։ Եթե հարցեր ունեք, միշտ ուրախ ենք օգնել։',
    sections: [
      { icon: 'backpack', title: 'Ինչ բերել երեխայի հետ', body: 'Փոխնորդ հագուստի հավաքածու\nՓակ, հարմարավետ փոխնորդ կոշիկներ\nՍեփական ջրի շիշ\nՍիրելի խաղալիք քնելու համար (ցանկության դեպքում)\nԱնհրաժեշտության դեպքում՝ անձեռոցիկներ և տակդիրներ' },
      { icon: 'shirt', title: 'Հագուստի պահանջներ', body: 'Հարմարավետ, շարժումները չսահմանափակող հագուստ\nԵղանակին համապատասխան արտաքին հագուստ զբոսանքների համար\nԽնդրում ենք նշել երեխայի իրերը (օրինակ՝ սկզբնատառերով)' },
      { icon: 'apple', title: 'Սննդակարգ', body: 'Օրական 4 անգամ հավասարակշռված սնունդ\nԹարմ և սեզոնային մթերքներ\nԱլերգիաների և հատուկ սննդակարգի մասին խնդրում ենք նախապես տեղեկացնել' },
      { icon: 'thermometer', title: 'Հիվանդության դեպքում', body: 'Ջերմության, հազի կամ վարակի նշանների դեպքում երեխան մնում է տանը\nԽնդրում ենք տեղեկացնել բացակայության մասին մինչև 09:00\nԱպաքինումից հետո՝ վերադարձ բժշկի թույլտվությամբ' },
      { icon: 'clipboard', title: 'Գրանցման գործընթաց', body: 'Լրացրեք առցանց հայտը կամ զանգահարեք մեզ\nԱյցելեք մանկապարտեզ և ծանոթացեք թիմին\nՆերկայացրեք անհրաժեշտ փաստաթղթերը\nՀարմարվողականության մեղմ շրջան՝ ծնողի հետ միասին' },
    ],
  },
  food: {
    title: 'Առողջ ու համեղ սնունդ',
    intro: 'Մեր խոհանոցում ամեն օր պատրաստվում են թարմ, հավասարակշռված ու երեխաների սիրած ուտեստներ։ Ճաշացանկը կազմվում է՝ հաշվի առնելով տարիքային առանձնահատկությունները։',
    principles: [
      { title: 'Թարմ մթերքներ', text: 'Օգտագործում ենք սեզոնային բանջարեղեն ու մրգեր։' },
      { title: 'Հավասարակշռված', text: 'Սպիտակուցներ, բանջարեղեն, հացահատիկներ և կաթնամթերք՝ ամեն օր։' },
      { title: 'Անհատական մոտեցում', text: 'Հաշվի ենք առնում ալերգիաներն ու բժշկական պահանջները։' },
    ],
    showWeeklyMenu: true,
    weekLabel: 'Այս շաբաթվա ճաշացանկը',
    notes: '',
  },
  privacy: {
    defaultPublic: true,
    showChildNames: false,
  },
};

const isPlainObject = (v: unknown): v is Json => !!v && typeof v === 'object' && !Array.isArray(v);

export async function getSetting(key: SettingKey): Promise<Json> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return { ...SETTING_DEFAULTS[key], ...(isPlainObject(row?.value) ? row.value : {}) };
}

export async function getAllSettings(): Promise<Record<SettingKey, Json>> {
  const rows = await prisma.setting.findMany();
  const out = {} as Record<SettingKey, Json>;
  for (const key of SETTING_KEYS) {
    const row = rows.find((r) => r.key === key);
    out[key] = { ...SETTING_DEFAULTS[key], ...(isPlainObject(row?.value) ? row.value : {}) };
  }
  return out;
}

export async function saveSetting(key: SettingKey, value: Json) {
  await prisma.setting.upsert({ where: { key }, create: { key, value: value as Prisma.InputJsonValue }, update: { value: value as Prisma.InputJsonValue } });
}

/** Collects every *MediaId / *MediaIds value inside a settings object. */
function collectIds(value: Json, ids = new Set<string>()) {
  for (const [k, v] of Object.entries(value)) {
    if (k.endsWith('MediaId') && typeof v === 'string' && v) ids.add(v);
    if (k.endsWith('MediaIds') && Array.isArray(v)) v.forEach((x) => typeof x === 'string' && ids.add(x));
  }
  return ids;
}

/** Adds resolved `xxxMedia` fields next to `xxxMediaId(s)` fields. */
export async function resolveSettingMedia(values: Json[], pub: boolean) {
  const ids = new Set<string>();
  values.forEach((v) => collectIds(v, ids));
  const media = ids.size ? await prisma.media.findMany({ where: { id: { in: [...ids] } } }) : [];
  const map = new Map<string, Media>(media.map((m) => [m.id, m]));
  const conv = (id: unknown) => {
    const m = typeof id === 'string' ? map.get(id) : undefined;
    return m ? (pub ? publicMedia(m) : serializeMedia(m)) : null;
  };
  return values.map((value) => {
    const out: Json = { ...value };
    for (const [k, v] of Object.entries(value)) {
      if (k.endsWith('MediaId')) out[k.replace(/MediaId$/, 'Media')] = conv(v);
      if (k.endsWith('MediaIds') && Array.isArray(v)) out[k.replace(/MediaIds$/, 'Media')] = v.map(conv).filter(Boolean);
    }
    return out;
  });
}
