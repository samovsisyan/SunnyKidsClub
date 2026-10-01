import { LinkButton } from '@/components/Button';
import { SunMark } from '@/components/Logo';
import { Seo } from '@/components/Seo';

export default function NotFound() {
  return (
    <section className="container-x flex min-h-[70vh] flex-col items-center justify-center pt-32 text-center">
      <Seo title="Էջը չի գտնվել" />
      <SunMark className="h-24 w-24 animate-float" />
      <h1 className="mt-6 text-4xl font-semibold sm:text-5xl">Էջը չի գտնվել</h1>
      <p className="mt-3 max-w-md text-ink-soft">Հնարավոր է՝ էջը տեղափոխվել է կամ այլևս գոյություն չունի։</p>
      <LinkButton to="/" className="mt-8" size="lg">
        Գլխավոր էջ
      </LinkButton>
    </section>
  );
}
