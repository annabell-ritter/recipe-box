# Reflection: code review of the chat feature

Branch `feature/chat-page` (PR #6), reviewed on 2026-11-03 by the
`ai-code-reviewer` agent in two rounds. This file lists the findings and
what was changed for each.

## Round 1: review of the chat feature

### The lint exception for tests was not documented
- **Finding:** the rule "query `chat_messages` only in `lib/chats.ts`" was
  switched off for `tests/chat-helpers.ts` without being mentioned in
  CLAUDE.md.
- **Fix:** CLAUDE.md now documents this one exception: the test helper may
  delete the test user's own test conversations and check they are gone. The
  comment in `eslint.config.mjs` explains why the tests cannot use
  `lib/chats.ts`.

### The recipe pages changed without mention
- **Finding:** moving the recipe pages into the shared signed-in layout
  added Recipes and Chat links to the top bar and hid the user's email on
  small screens.
- **Fix:** both changes were kept on purpose and listed in the PR
  description. `tests/recipe-list.spec.ts` now checks that the Chat link
  opens the chat page.

### The server used the conversation history sent by the browser
- **Finding:** the AI's history came from the request, so it could differ
  from what was saved.
- **Fix:** the browser now sends only the new question. The server loads the
  conversation's saved messages from Supabase through `lib/chats.ts`.

### No limit on how often a user can send
- **Finding:** a single account could send unlimited requests, each with a
  long history, and run up OpenRouter costs.
- **Fix:** per-user sending limits (20 questions per 10 minutes, 200 per 24
  hours) and a cap of 20 earlier messages sent to the model. A monthly
  spending limit on the OpenRouter API key is the hard cap on cost.

### Chat text could end up in server logs
- **Finding:** database errors were logged in full, and Postgres errors can
  quote the rejected row, i.e. the user's chat text.
- **Fix:** `lib/chats.ts` now logs only the failed action and the Postgres
  error code. Message lengths are checked before saving, so the database's
  length check is normally not reached.

## Round 2: review of the Round 1 fixes

### The AI forgot a reply that could not be saved
- **Finding:** with history loaded from the database, a reply that failed to
  save stayed on screen but was unknown to the AI on the next message. The
  notice understated this.
- **Fix:** the notice now says the AI will not remember that reply in this
  conversation and that it will be missing after a reload.

### The history cap was invisible
- **Finding:** the AI sees only the last 20 messages, while the page shows
  many more, and nothing told the user.
- **Fix:** once a conversation has more than 20 messages, the page says the
  AI only remembers the last 20 and suggests a new conversation for a new
  topic.

### An expired session showed the wrong error
- **Finding:** if the session ended mid-send, the user saw "Your chat could
  not be loaded" instead of being asked to log in again.
- **Fix:** the server action now returns "Your session has ended. Please log
  in again." in that case.

### Users could set a message's timestamp
- **Finding:** signed-in users could choose `created_at` when adding chat
  messages, and the sending limit counts by that timestamp.
- **Fix:** a new migration
  (`20261103215320_restrict_chat_messages_insert_columns.sql`) lets signed-in
  users fill in only `conversation_id`, `role` and `content`. `id`, `user_id`
  and `created_at` always come from the database. Verified against the live
  database: an insert with a chosen timestamp is rejected.

### Comments and descriptions claimed more than the code does
- **Finding:** comments described the history check and the sending limit as
  stronger guarantees than they are, and the PR description stated the limit
  as firm.
- **Fix:** comments now say the history comes from the saved history, not
  the request, and that the sending limit slows heavy use but is not a hard
  cap. The PR description says the same.

### Outdated comments
- **Finding:** comments in `lib/ai.ts` and `lib/ai-test-substitute.ts` still
  said the whole conversation is sent to the model.
- **Fix:** both now describe the recent saved history plus the new question.

### The message length limit was defined twice
- **Finding:** the 4,000-character limit existed separately in the chat page
  and the server action.
- **Fix:** it now lives once in `lib/chat-limits.ts`, together with the
  20-message history limit, and both sides import it.

### "Try again tomorrow" was inaccurate
- **Finding:** the daily limit is a rolling 24 hours, not a calendar day.
- **Fix:** the message now says "the chat limit for the last 24 hours".

---

# Reflection: code review of the redesign

Branch `design` (PR #7), reviewed on 2026-11-05 by the `ai-code-reviewer`
agent. This section lists the findings that were fixed and what was changed
for each.

### The delete button no longer said when it was busy
- **Finding:** "Delete" / "Deleting..." became an icon with a spinner, but
  the screen-reader label stayed "Delete <title>" during a delete.
- **Fix:** the label now changes to "Deleting <title>" while the delete runs
  (`components/delete-recipe-button.tsx`).

### The chat heading jumped while loading
- **Finding:** the chat's loading placeholder repeated the heading but left
  out the "Your cooking assistant." subtitle, so the title row shifted when
  the chat appeared on tablet and desktop.
- **Fix:** the placeholder now includes the subtitle (`app/chat/page.tsx`).

### Unused option on the logo component
- **Finding:** `Wordmark` accepted a `className` option that nothing used.
- **Fix:** removed (`components/wordmark.tsx`).
