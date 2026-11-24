# Peoples Little Theatre

A React, TypeScript, Vite, and Tailwind CSS website with a Render-hosted Express API, Supabase Postgres/Storage, and a protected content admin at `/admin`.

## What the admin manages

The admin edits shared website content: the automatic/manual hero image slider and order; productions and their order; show dates, venue, ticket details, and WhatsApp number; founder profiles and display order; YouTube play embeds and written play stories; gallery albums/images; About content; footer copy and navigation links; and public contact and social details. Shows remain listed after their date, but the booking button closes automatically when the date has passed.

## Local setup

1. Copy `.env.example` to `.env` and fill in the Supabase project URL, anon key, service-role key, and local CORS origin. Keep the service-role key private; it is only read by the API and must never use a `VITE_` prefix.
2. In the Supabase SQL editor, run [`supabase/schema.sql`](./supabase/schema.sql).
3. The project-coded admin credentials are used for `/admin`; no Supabase user or public registration is required.
4. Run `npm install`, then start the API and site in separate terminals:

   ```sh
   npm run dev:server
   npm run dev
   ```

5. Visit `/admin` and sign in with the project-coded admin credentials.

The API listens on port `3000` by default. `npm run build` type-checks both the frontend and API and creates `dist/`. `npm run typecheck:server` checks only the API.

## Free deployment

### Supabase

Create a free Supabase project and run [`supabase/schema.sql`](./supabase/schema.sql). This creates the singleton JSONB content table and the public-read-only `site-assets` image bucket. The database and bucket are accessed only by the API service role, which is not exposed to website visitors.

### Render API

Create a Render Web Service from this repository (or use [`render.yaml`](./render.yaml)). Select the **Free** plan, set:

- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — private Supabase service-role key
- `CLIENT_ORIGINS` — exact public website origins, separated by commas (for example `https://your-site.example`)

The health check is `/api/health`; the service starts with `npm start`. Do not add a periodic ping/keep-alive to evade the free-tier sleep policy. Render may take about 50 seconds to wake after inactivity; frontend API requests allow up to 75 seconds and display a clear message if the server still does not respond.

### Frontend hosting

Set these variables in the frontend build environment and rebuild/redeploy the static site:

- `VITE_API_URL` — the Render service origin, without a trailing slash (for example `https://plt-content-api.onrender.com`)
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/publishable key (safe for browser use; never use the service-role key here)
- `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, and `VITE_EMAILJS_PUBLIC_KEY` if using the contact form

If frontend variables change, a new static build is required. The public website loads content from the API; if the API is unreachable it retains the last locally cached/default site content and logs the connection problem. Admin saves display explicit success/in-progress/failure status and are never reported as successful before Supabase confirms the write.

## Image and video handling

Admin image uploads are resized/compressed in the browser and stored in Supabase Storage; the database stores only their public image URLs. Direct image URLs may also be entered. Keep uploads under the API's 8 MB input limit. Plays accept YouTube watch, short, and embed URLs; videos remain hosted by YouTube and are embedded on the plays page. Play stories are plain text and display with their original line breaks.

Replace sample show/contact data and placeholder imagery before launch. The included stage photography, temporary theatre mark, founder nameplates, and production title designs are placeholders; use theatre-owned or properly licensed media.

## Pages

Home, About Us, Productions, Tickets, Founders, Plays, Gallery, Contact Us, and a custom 404 page are available. Page titles and meta descriptions update per route.
