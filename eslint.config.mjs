import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const supabaseClientBan = {
  name: "@/infrastructure/supabase/client",
  message:
    "Do not use the browser Supabase client. Hooks/UI must use apiFetch → /api; server data must use @/infrastructure/supabase/server.",
};

const supabaseServerBan = {
  name: "@/infrastructure/supabase/server",
  message:
    "Do not import supabaseServer from client/UI code. Keep DB access in Route Handlers + feature data services.",
};

const applicationServicePatternBan = {
  group: [
    "**/application/services/**",
    "**/services/*ApplicationService*",
    "@/features/*/application/services/**",
    "@/features/*/data",
    "@/features/*/data/**",
  ],
  allowTypeImports: true,
  message:
    "Do not import application services or data repositories from hooks/UI. Use apiFetch → Clerk-protected /api routes instead (type-only imports are allowed).",
};

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-var": "off",
      "prefer-rest-params": "off",
      "@typescript-eslint/no-unused-expressions": "off",
    },
  },
  // Feature data + app code must never use the anon browser client
  {
    files: ["src/features/**/*.{ts,tsx}", "src/shared/**/*.{ts,tsx}"],
    ignores: [
      "**/__tests__/**",
      "**/*.test.ts",
      "**/*.test.tsx",
      "src/infrastructure/supabase/client.ts",
    ],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          paths: [supabaseClientBan],
        },
      ],
    },
  },
  // Hooks, presentation, and app UI: no Supabase + no application service value imports
  {
    files: [
      "src/features/**/presentation/**/*.{ts,tsx}",
      "src/features/**/application/use*.{ts,tsx}",
      "src/app/**/page.tsx",
      "src/app/**/layout.tsx",
      "src/app/**/loading.tsx",
      "src/app/**/error.tsx",
      "src/app/**/template.tsx",
      "src/app/**/default.tsx",
      "src/app/**/not-found.tsx",
      "src/shared/components/**/*.{ts,tsx}",
    ],
    ignores: ["**/__tests__/**", "**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          paths: [supabaseClientBan, supabaseServerBan],
          patterns: [applicationServicePatternBan],
        },
      ],
    },
  },
  {
    files: ["**/__tests__/**/*", "**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "react/display-name": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-restricted-imports": "off",
    },
  },
];

export default eslintConfig;
