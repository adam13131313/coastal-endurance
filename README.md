# Coastal Endurance

Storefront for Field Oil — a daily barrier maintenance face oil. Vite + React + TypeScript single-page app, with Shopify for products/checkout and Supabase for auth, profiles, and orders.

## Stack

- **Frontend:** Vite, React, TypeScript, shadcn/ui, Tailwind CSS
- **Commerce:** Shopify Storefront API (cart + checkout)
- **Backend:** Supabase (Postgres + RLS, Auth with Google/Apple OAuth, Edge Functions)
- **Email:** Supabase native auth emails over Resend SMTP; transactional email sent via the Resend API from edge functions
- **Hosting:** Vercel (frontend), Supabase (backend)

## Local development

Requires Node.js & npm.

```sh
npm install
npm run dev      # dev server on http://localhost:8080
npm run build    # production build to dist/
npm run lint
npm test
```

### Environment

Copy the Supabase project values into a local `.env` (git-ignored):

```sh
VITE_SUPABASE_URL="https://<project-ref>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<anon key>"
VITE_SUPABASE_PROJECT_ID="<project-ref>"
```

## Deployment

- **Frontend:** pushes to the connected Vercel project build and deploy automatically. Set the `VITE_SUPABASE_*` variables in the Vercel project settings.
- **Backend:** edge functions and migrations deploy via the Supabase CLI:

  ```sh
  npx supabase link --project-ref <project-ref>
  npx supabase db push                                   # apply migrations
  npx supabase functions deploy verify-field-team-member # deploy functions
  ```

  Edge function secrets (e.g. `RESEND_API_KEY`) are set with `npx supabase secrets set`.
  Auth emails are sent by Supabase directly — configure custom SMTP (Resend) and
  the email templates in the Supabase dashboard under Authentication → Emails.
