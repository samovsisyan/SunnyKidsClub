export type MediaType = 'IMAGE' | 'VIDEO';

export interface Media {
  id: string;
  type: MediaType;
  source: 'UPLOAD' | 'YOUTUBE' | 'VIMEO';
  url: string | null;
  thumbUrl: string | null;
  embedUrl: string | null;
  mimeType?: string | null;
  size?: number | null;
  width: number | null;
  height: number | null;
  title: string;
  description: string;
  alt: string;
  category: string;
  takenAt: string | null;
  isPublic?: boolean;
  published?: boolean;
  inGallery?: boolean;
  sortOrder?: number;
  createdAt?: string;
}

export interface DailyActivity {
  id: string;
  title: string;
  description: string;
  date: string;
  category: string;
  status?: 'DRAFT' | 'PUBLISHED';
  media: Media[];
  createdAt?: string;
}

export interface EventItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  status: 'UPCOMING' | 'COMPLETED';
  effectiveStatus?: 'UPCOMING' | 'COMPLETED';
  published?: boolean;
  coverId?: string | null;
  cover: Media | null;
  media: Media[];
  mediaCount?: number;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  imageId?: string | null;
  image: Media | null;
  startDate: string | null;
  endDate: string | null;
  ctaLabel: string;
  ctaUrl: string;
  active?: boolean;
  expired?: boolean;
  scheduled?: boolean;
  live?: boolean;
  sortOrder?: number;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  icon: string;
  imageId?: string | null;
  image: Media | null;
  published?: boolean;
}

export interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  description: string;
  published?: boolean;
}

export interface Space {
  id: string;
  title: string;
  description: string;
  coverId?: string | null;
  cover: Media | null;
  media: Media[];
  published?: boolean;
}

export interface Testimonial {
  id: string;
  parentName: string;
  relation: string;
  comment: string;
  photoId?: string | null;
  photo: Media | null;
  published?: boolean;
  isPlaceholder?: boolean;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  published?: boolean;
}

export type MealType = 'BREAKFAST' | 'LUNCH' | 'SNACK' | 'DINNER';

export interface Meal {
  id: string;
  type: MealType;
  title: string;
  time: string;
  description: string;
  imageId?: string | null;
  image: Media | null;
  published?: boolean;
}

export interface MenuEntry {
  id?: string;
  weekday: number;
  mealType: MealType;
  dishes: string;
}

export interface Highlight {
  value: string;
  label: string;
}

export interface SiteSettings {
  name: string;
  slogan: string;
  heroDescription: string;
  heroMediaIds: string[];
  heroMedia?: Media[];
  highlights: Highlight[];
  ctaTitle: string;
  ctaText: string;
  seoTitle: string;
  seoDescription: string;
  ogImageMediaId: string | null;
  ogImageMedia?: Media | null;
}

export interface AboutSettings {
  title: string;
  lead: string;
  story: string;
  philosophyTitle: string;
  philosophy: string;
  approachTitle: string;
  approach: string;
  values: { icon: string; title: string; text: string }[];
  imageMediaIds: string[];
  imageMedia?: Media[];
}

export interface ContactSettings {
  address: string;
  phone: string;
  phone2: string;
  email: string;
  instagram: string;
  facebook: string;
  whatsapp: string;
  workingHours: { days: string; hours: string }[];
  mapEmbedUrl: string;
  mapLink: string;
}

export interface ParentsSettings {
  intro: string;
  sections: { icon: string; title: string; body: string }[];
}

export interface FoodSettings {
  title: string;
  intro: string;
  principles: { title: string; text: string }[];
  showWeeklyMenu: boolean;
  weekLabel: string;
  notes: string;
}

export interface PrivacySettings {
  defaultPublic: boolean;
  showChildNames: boolean;
}

export interface SiteData {
  site: SiteSettings;
  about: AboutSettings;
  contact: ContactSettings;
  parents: ParentsSettings;
  food: FoodSettings;
  privacy: { showChildNames: boolean };
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

export interface ContactMessage {
  id: string;
  type: 'CONTACT' | 'ENROLLMENT';
  name: string;
  phone: string;
  email: string;
  message: string;
  childAge: string;
  startDate: string;
  read: boolean;
  createdAt: string;
}
