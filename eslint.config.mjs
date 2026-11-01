import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

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
  {
    // All recipe data goes through the central handler in lib/recipes.ts.
    ignores: ["lib/recipes.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.property.name='from'][arguments.0.value='recipes']",
          message:
            "Query the recipes table only in lib/recipes.ts. Use its functions instead.",
        },
      ],
    },
  },
];

export default eslintConfig;
