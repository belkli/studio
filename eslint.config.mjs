import nextConfig from "eslint-config-next";
import coreWebVitals from "eslint-config-next/core-web-vitals";

/** @type {import("eslint").Linter.Config[]} */
const eslintConfig = [
  ...nextConfig,
  ...coreWebVitals,
  {
    rules: {
      // Allow unused vars prefixed with underscore
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      // Allow explicit any in action stubs during migration
      "@typescript-eslint/no-explicit-any": "warn",
      // React Compiler informational rules — downgrade to warnings.
      // These are guidance for React Compiler adoption, not correctness issues.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/use-memo": "warn",
      "react-hooks/static-components": "warn",
      // Pre-existing hooks violations in legacy code — tracked for manual fix
      "react-hooks/rules-of-hooks": "warn",
      // Unescaped quotes in JSX — legacy hardcoded strings being replaced by i18n
      "react/no-unescaped-entities": "warn",
    },
  },
];

export default eslintConfig;
