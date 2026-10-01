export const MEDIA_CATEGORIES = ['DAILY', 'EVENTS', 'WALKS', 'ROOMS', 'GAMES', 'CREATIVE', 'LEARNING', 'FOOD', 'OTHER'] as const;
export const DAILY_CATEGORIES = ['GAMES', 'CREATIVE', 'WALKS', 'LEARNING', 'EVENTS'] as const;
export const SETTING_KEYS = ['site', 'about', 'contact', 'parents', 'food', 'privacy'] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];
