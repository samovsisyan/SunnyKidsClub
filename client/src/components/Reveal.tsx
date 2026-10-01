import { useEffect, useRef, type ElementType, type ReactNode } from 'react';
import clsx from 'clsx';

let observer: IntersectionObserver | null = null;
const getObserver = () =>
  (observer ??= new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          observer?.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  ));

/** Subtle fade-up when an element scrolls into view. */
export function Reveal({ as: Tag = 'div', delay = 0, className, children, ...rest }: { as?: ElementType; delay?: number; className?: string; children: ReactNode } & Record<string, unknown>) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const o = getObserver();
    o.observe(el);
    return () => o.unobserve(el);
  }, []);
  return (
    <Tag ref={ref} className={clsx('reveal', className)} style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties} {...rest}>
      {children}
    </Tag>
  );
}
