export const DAILY_CATEGORIES: Record<string, string> = {
  GAMES: 'Խաղեր',
  CREATIVE: 'Ստեղծագործական',
  WALKS: 'Զբոսանք',
  LEARNING: 'Ուսուցում',
  EVENTS: 'Միջոցառումներ',
};

export const MEDIA_CATEGORIES: Record<string, string> = {
  DAILY: 'Մեր առօրյան',
  EVENTS: 'Միջոցառումներ',
  WALKS: 'Զբոսանքներ',
  ROOMS: 'Խմբասենյակներ',
  GAMES: 'Խաղեր',
  CREATIVE: 'Ստեղծագործական',
  LEARNING: 'Ուսուցում',
  FOOD: 'Սնունդ',
  OTHER: 'Այլ',
};

export const GALLERY_FILTERS = ['DAILY', 'EVENTS', 'WALKS', 'ROOMS', 'GAMES'];

export const MEAL_TYPES: Record<string, string> = {
  BREAKFAST: 'Նախաճաշ',
  LUNCH: 'Ճաշ',
  SNACK: 'Խորտիկ',
  DINNER: 'Ընթրիք',
};

/** Soft accent per category, used for chips and card accents. */
export const CATEGORY_TONE: Record<string, string> = {
  GAMES: 'bg-sky-100 text-sky-700',
  CREATIVE: 'bg-peach-100 text-peach-600',
  WALKS: 'bg-leaf-100 text-leaf-700',
  LEARNING: 'bg-sun-100 text-sun-700',
  EVENTS: 'bg-blush-100 text-blush-500',
  DAILY: 'bg-sun-100 text-sun-700',
  ROOMS: 'bg-sky-100 text-sky-700',
  FOOD: 'bg-leaf-100 text-leaf-700',
  OTHER: 'bg-cream-200 text-ink-soft',
};
