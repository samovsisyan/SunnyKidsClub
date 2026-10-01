# Sunny Kids Club

Public Armenian website + CMS / Admin Panel for the Sunny Kids Club kindergarten.

- **client/** — React 19, TypeScript, Vite, Tailwind CSS 4, React Router, TanStack Query, Zustand
- **server/** — Node.js, Express 5, REST API, Prisma 6, PostgreSQL, JWT (httpOnly cookie)

## Quick start (development)

```bash
npm install                      # installs both workspaces
cp server/.env.example server/.env   # then edit DATABASE_URL, JWT_SECRET, ADMIN_*
createdb sunnykids
npm run db:migrate               # creates tables
npm run db:seed                  # admin account + Armenian placeholder content (WIPES content!)
npm run dev                      # API http://localhost:4600, site http://localhost:5180
```

- Website: http://localhost:5180
- Admin panel: http://localhost:5180/admin (credentials = `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `server/.env`)

The seed creates **placeholder** content only (soft abstract images, example texts). Replace everything
from the Admin Panel. Seeded testimonials are flagged `isPlaceholder` and are **never** shown when `NODE_ENV=production`.

## Production

```bash
npm run build
cd server && npx prisma migrate deploy
NODE_ENV=production PUBLIC_SITE_URL=https://your-domain.am node dist/index.js
```

In production Express serves `client/dist` and injects route-specific Armenian `<title>`, description,
Open Graph and canonical tags into the HTML (also for `/events/:slug`), plus `/sitemap.xml` and `/robots.txt`.
Put it behind HTTPS (nginx / Caddy / a PaaS). `JWT_SECRET` must be ≥ 32 chars.
Do not run the seed in production (it refuses unless `SEED_FORCE=1`).

## Media storage

Binary files are never stored in PostgreSQL — only storage keys. The storage layer is an interface
(`server/src/storage/types.ts`) with two drivers:

| `STORAGE_DRIVER` | Description |
| --- | --- |
| `local` (default) | Files in `UPLOAD_DIR` (default `server/uploads`) |
| `s3` | AWS S3 or any S3-compatible service: Cloudflare R2, Supabase Storage (S3 API), DigitalOcean Spaces, MinIO… Configure `S3_*` variables. Set `S3_PUBLIC_URL` to serve public files from a CDN; private files are delivered via short-lived signed URLs. |

Adding Cloudinary or another provider = implementing `StorageDriver` and registering it in `server/src/storage/index.ts`.

Upload processing:
- Photos are auto-rotated, resized (2000px + 720px thumbnail), converted to WebP and **all EXIF/GPS metadata is stripped**.
- Videos (MP4/WebM/MOV, up to 600 MB) are stored as-is, served with HTTP Range support; posters can be uploaded. YouTube/Vimeo links are supported (privacy-enhanced embeds).
- Public pages never autoplay video with sound; only `preload="metadata"` + posters are loaded.

## Privacy

- Every media item has **Public / Private** and **Published** flags. Private or unpublished media is excluded from all public APIs, and its file URLs return `403` unless an admin session is present (`/media/*` is served through an access check).
- Default visibility for new uploads and the "children's names" policy are in *Կայքի կարգավորումներ → Գաղտնիություն*.
- Contact/enrollment forms collect only parent name, phone, optional email, child's age — no child names.

## Security

bcrypt password hashing, JWT in an httpOnly `SameSite=Strict` cookie, rate limiting on login and forms,
zod validation on every endpoint, Helmet + Content-Security-Policy, honeypot spam protection, `noindex` on `/admin`.

## Content model (all editable in the Admin Panel)

| Admin page | Data |
| --- | --- |
| Մեր մասին, Կապ, Կայքի կարգավորումներ, FAQ → Տեղեկատվություն, Սնունդ → Տեքստեր | `Setting` (JSON per section) |
| Մեր առօրյան | `DailyActivity` + ordered media |
| Լուսանկարներ / Տեսանյութեր / Պատկերասրահ | `Media` |
| Զբաղմունքներ, Օրվա ռեժիմ, Ակցիաներ, Ծնողների կարծիքներ, FAQ, Մեր միջավայրը, Սնունդ | `Activity`, `ScheduleItem`, `Promotion`, `Testimonial`, `Faq`, `Space`, `Meal`, `MenuEntry` |
| Միջոցառումներ | `Event` + cover + ordered media (past dates automatically show as «Ավարտված») |
| Հաղորդագրություններ | `ContactMessage` (contact form + enrollment requests) |

Promotions are shown only while active and within their start/end dates — expired ones hide automatically.
