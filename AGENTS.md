<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Recipe Box

## What the app does

Recipe Box is a small web app where each signed-in user keeps their own
private recipe collection. Users sign up and log in with email and password
(Supabase Auth), then create, edit and delete recipes with a title,
ingredients and instructions. Every user sees only their own recipes; nothing
is shared between accounts.

Built with Next.js (App Router), Supabase (Auth and Postgres with Row Level
Security), Tailwind CSS with shadcn/ui, and Playwright for tests. Deployed on
Vercel.

## What the AI feature is for

The `/chat` page is an AI cooking assistant. Users ask questions about
cooking, recipes or ingredients (for example what to cook with what they
have, substitutions, or techniques) and can follow up on earlier answers.

- Conversations are saved per user in the `chat_messages` table, so they are
  still there after a reload; "New conversation" starts a fresh one.
- The model is called through OpenRouter, on the server only
  (`app/chat/actions.ts` → `lib/ai.ts`). The API key never reaches the
  browser.
- The AI receives the last 20 saved messages of the conversation plus the new
  question. Sending is limited per user to keep costs under control.

## Where things are

- `lib/recipes.ts` and `lib/chats.ts`: the only places that query the
  `recipes` and `chat_messages` tables (server-only; a lint rule enforces it).
- `lib/auth.ts` and `proxy.ts`: server-side sign-in checks and redirects.
- `supabase/migrations/`: database schema and RLS policies.
- `tests/`: Playwright end-to-end tests.

See `README.md` for setup and how the app works, and `CLAUDE.md` for the
project rules (auth, data access, security and workflow).
