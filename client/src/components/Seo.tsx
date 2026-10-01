import { useLocation } from 'react-router-dom';

/** React 19 hoists <title>/<meta> into <head>. The server also injects these for crawlers. */
export function Seo({ title, description, image }: { title?: string; description?: string; image?: string | null }) {
  const full = title ? `${title} — Sunny Kids Club` : 'Sunny Kids Club — Մանկապարտեզ Երևանում';
  const { pathname } = useLocation();
  const desc = description ?? 'Sunny Kids Club՝ ջերմ, անվտանգ և զարգացնող միջավայր երեխաների համար։';
  return (
    <>
      <title>{full}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={`${window.location.origin}${pathname === '/' ? '' : pathname}`} />
      <meta property="og:title" content={full} />
      <meta property="og:description" content={desc} />
      {image && <meta property="og:image" content={image} />}
    </>
  );
}
