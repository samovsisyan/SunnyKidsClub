import {
  Apple, Backpack, Baby, BookOpen, Brush, CalendarHeart, ClipboardList, Flower2, Heart, HeartHandshake, Leaf, Music, Palette,
  Puzzle, Scissors, Shield, Shirt, Smile, Sparkles, Star, Sun, Thermometer, TreePine, Trophy, Users, Volleyball, type LucideIcon,
} from 'lucide-react';

export const ICONS: Record<string, LucideIcon> = {
  palette: Palette,
  music: Music,
  book: BookOpen,
  puzzle: Puzzle,
  ball: Volleyball,
  trees: TreePine,
  abc: Baby,
  scissors: Scissors,
  brush: Brush,
  shield: Shield,
  heart: Heart,
  users: Users,
  sparkles: Sparkles,
  sun: Sun,
  backpack: Backpack,
  shirt: Shirt,
  apple: Apple,
  thermometer: Thermometer,
  clipboard: ClipboardList,
  leaf: Leaf,
  flower: Flower2,
  smile: Smile,
  star: Star,
  trophy: Trophy,
  calendar: CalendarHeart,
  handshake: HeartHandshake,
};

export const ICON_LABELS: Record<string, string> = {
  palette: 'Ներկապնակ', music: 'Երաժշտություն', book: 'Գիրք', puzzle: 'Փազլ', ball: 'Գնդակ', trees: 'Ծառեր', abc: 'Փոքրիկ',
  scissors: 'Մկրատ', brush: 'Վրձին', shield: 'Վահան', heart: 'Սիրտ', users: 'Մարդիկ', sparkles: 'Փայլ', sun: 'Արև',
  backpack: 'Պայուսակ', shirt: 'Հագուստ', apple: 'Խնձոր', thermometer: 'Ջերմաչափ', clipboard: 'Ցուցակ', leaf: 'Տերև',
  flower: 'Ծաղիկ', smile: 'Ժպիտ', star: 'Աստղ', trophy: 'Գավաթ', calendar: 'Օրացույց', handshake: 'Հոգատարություն',
};

export function Icon({ name, className }: { name: string; className?: string }) {
  const C = ICONS[name] ?? Sparkles;
  return <C className={className} strokeWidth={1.8} aria-hidden />;
}

/** Rotating soft tones so cards feel varied but harmonious. */
export const TONES = [
  { bg: 'bg-sun-100', fg: 'text-sun-700', ring: 'ring-sun-200' },
  { bg: 'bg-sky-100', fg: 'text-sky-700', ring: 'ring-sky-200' },
  { bg: 'bg-leaf-100', fg: 'text-leaf-700', ring: 'ring-leaf-200' },
  { bg: 'bg-peach-100', fg: 'text-peach-600', ring: 'ring-peach-200' },
  { bg: 'bg-blush-100', fg: 'text-blush-500', ring: 'ring-blush-200' },
];
export const tone = (i: number) => TONES[i % TONES.length];
