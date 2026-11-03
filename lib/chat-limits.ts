/**
 * Chat limits shared by the chat page (browser) and the server action.
 * Plain constants only, so both sides can import them. The server checks are
 * what count; the browser uses them to guide the user.
 */

/** Longest question a user can send, in characters. */
export const MESSAGE_MAX_LENGTH = 4_000;

/** How many saved messages (questions and replies) the AI remembers. */
export const HISTORY_LIMIT = 20;
