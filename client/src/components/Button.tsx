import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'sky' | 'dark';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary: 'bg-sun-400 text-ink shadow-[0_10px_24px_-10px_rgb(232_173_31/0.8)] hover:bg-sun-300 hover:-translate-y-0.5 active:translate-y-0',
  secondary: 'bg-white text-ink ring-1 ring-ink/10 shadow-soft hover:ring-ink/20 hover:-translate-y-0.5 active:translate-y-0',
  ghost: 'text-ink hover:bg-ink/5',
  sky: 'bg-sky-500 text-white shadow-[0_10px_24px_-10px_rgb(77_149_199/0.8)] hover:bg-sky-600 hover:-translate-y-0.5',
  dark: 'bg-ink text-white hover:bg-ink/90 hover:-translate-y-0.5',
};
const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm gap-1.5',
  md: 'h-11 px-5 text-[15px] gap-2',
  lg: 'h-13 px-7 text-base gap-2.5',
};

export const buttonClass = (variant: Variant = 'primary', size: Size = 'md', extra?: string) =>
  clsx(
    'inline-flex items-center justify-center rounded-full font-bold whitespace-nowrap transition duration-300 ease-out disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    sizes[size],
    extra,
  );

type Common = { variant?: Variant; size?: Size; icon?: ReactNode; iconRight?: ReactNode };

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & Common>(function Button(
  { variant, size, icon, iconRight, className, children, ...rest },
  ref,
) {
  return (
    <button ref={ref} className={buttonClass(variant, size, className)} {...rest}>
      {icon}
      {children}
      {iconRight}
    </button>
  );
});

export function LinkButton({ variant, size, icon, iconRight, className, children, ...rest }: LinkProps & Common) {
  const to = String(rest.to);
  if (/^(https?:|tel:|mailto:)/.test(to)) {
    return (
      <a href={to} className={buttonClass(variant, size, className)} target={to.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
        {icon}
        {children}
        {iconRight}
      </a>
    );
  }
  return (
    <Link className={buttonClass(variant, size, className)} {...rest}>
      {icon}
      {children}
      {iconRight}
    </Link>
  );
}
