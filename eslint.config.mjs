import js from "@eslint/js";
import typescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";

export default [
  // Ignore dist and node_modules
  {
    ignores: ["dist/**", "node_modules/**"],
  },

  js.configs.recommended,

  // TypeScript files
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        // Browser globals
        window: "readonly",
        document: "readonly",
        console: "readonly",
        fetch: "readonly",
        File: "readonly",
        FileReader: "readonly",
        DOMParser: "readonly",
        SVGElement: "readonly",
        Element: "readonly",
        Event: "readonly",
        URL: "readonly",
        MutationObserver: "readonly",
        Document: "readonly",
        HTMLInputElement: "readonly",

        // Game engine globals
        Phaser: "readonly",
        MatterJS: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": typescript,
    },
    rules: {
      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",

      // General rules
      "no-console": "off", // Allow console for game development
      "no-debugger": "error",
      "prefer-const": "error",
      "no-var": "error",
      "no-unused-vars": "off", // Use TypeScript version instead
      "no-case-declarations": "off", // Allow case declarations

      // Disable rules that conflict with Prettier
      indent: "off",
      quotes: "off",
      semi: "off",
    },
  },

  // JavaScript/Module files
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        // Node.js globals
        process: "readonly",
        global: "readonly",
        console: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-console": "off",
      "no-debugger": "error",
      "prefer-const": "error",
      "no-var": "error",
    },
  },

  // Test files
  {
    files: ["tests/**/*.ts"],
    languageOptions: {
      globals: {
        // Vitest globals
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        vi: "readonly",
        global: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // Allow any in tests for mocking
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^(_|vi$)" },
      ], // Allow unused vi import
    },
  },
];
