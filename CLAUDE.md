# Recipe Box

A small web app where each signed-in user keeps their own private recipes (title, ingredients, instructions). Built with Next.js and Supabase (auth + database), deployed on Vercel.

## Tech stack
- Next.js
- Supabase (Auth and Postgres with Row Level Security)
- Playwright
- Vercel

## Running the app
- Locally: `http://localhost:3000` (start with `npm run dev`).
- After deploying, the app also runs on Vercel.
- Both environments use the same Supabase project, so test data created locally also appears on the deployed app.
- Playwright tests run against `http://localhost:3000`.

## Ground rules
- Authentication comes first. No data feature is built before sign-up, log-in, and log-out work.
- Authentication uses Supabase Auth (email and password) only. Do not build custom auth, store passwords, or handle sessions manually. The signed-in user's id from Supabase Auth is what RLS policies and the data handler rely on.
- Email confirmation is turned off. New users are signed in right after sign-up.
- A signed-out visitor must not reach any protected page or data, including via direct URLs.
- All data access goes through one central data handler. Pages and components never call Supabase for recipe data directly. The handler checks the signed-in user on every operation.
- Every table has Row Level Security enabled and at least one owner-scoped policy (based on the signed-in user's id).
- All schema changes are migration files. Never change the schema only in the dashboard.
- Use the Supabase CLI for all Supabase work (linking the project, creating and applying migrations). Never use the Supabase MCP server.
- The app uses only the Supabase project URL and the publishable key, for sign-in and per-user data access. Security comes from authentication and RLS.
- Do not use or add a Supabase secret or service role key. If one ever seems necessary, stop and ask first.
- `.env.local` must be git-ignored and never appear in repository history.

## Data
- One table: `recipes` (`id`, `user_id`, `title`, `ingredients`, `instructions`, `created_at`).
- Ingredients and instructions are plain text fields. Do not add extra tables (no ingredients, tags, or collections tables).

## Pages
- Public: login/sign-up.
- Protected: recipe list, recipe form (create/edit).
- The home route redirects based on sign-in status: signed-out visitors go to login, signed-in users go to their recipe list.

## Workflow
- One feature branch per build step, merged into `main` before the next one starts. Never merge a branch without being asked.
- Add a Playwright happy-path test after each feature.
- Deploy to Vercel after the first working feature, then check the deployed app in an incognito window as a brand-new, signed-out visitor.
- Finish with a full `/security-scan`, fix critical and high findings, then rescan in a fresh Claude Code session.
- Commit messages must be descriptive. Never "updates" or "fix stuff".
