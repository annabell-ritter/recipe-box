import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const RECIPES_QUERY = {
  selector:
    "CallExpression[callee.property.name='from'][arguments.0.value='recipes']",
  message:
    "Query the recipes table only in lib/recipes.ts. Use its functions instead.",
};

const CHAT_QUERY = {
  selector:
    "CallExpression[callee.property.name='from'][arguments.0.value='chat_messages']",
  message:
    "Query the chat_messages table only in lib/chats.ts. Use its functions instead.",
};

const eslintConfig = [
  {
    // Generated output, not source code.
    ignores: [
      ".next/**",
      "node_modules/**",
      "test-results/**",
      "playwright-report/**",
      "blob-report/**",
      "next-env.d.ts",
      "lib/database.types.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Each table is queried only in its central handler: recipes in
  // lib/recipes.ts, chat_messages in lib/chats.ts. (Later config blocks
  // replace this rule's options, so each block lists every table it forbids.)
  {
    ignores: ["lib/recipes.ts", "lib/chats.ts"],
    rules: {
      "no-restricted-syntax": ["error", RECIPES_QUERY, CHAT_QUERY],
    },
  },
  {
    files: ["lib/recipes.ts"],
    rules: {
      "no-restricted-syntax": ["error", CHAT_QUERY],
    },
  },
  {
    files: ["lib/chats.ts"],
    rules: {
      "no-restricted-syntax": ["error", RECIPES_QUERY],
    },
  },
  {
    // Approved exception (see CLAUDE.md, Data section): the Playwright
    // cleanup deletes its own test conversations directly and checks they
    // are gone, signed in as the test user (RLS still applies). It cannot
    // use lib/chats.ts because that only runs inside the Next.js server.
    // Test code only; nothing in it ships with the app.
    files: ["tests/chat-helpers.ts"],
    rules: {
      "no-restricted-syntax": ["error", RECIPES_QUERY],
    },
  },
];

export default eslintConfig;
