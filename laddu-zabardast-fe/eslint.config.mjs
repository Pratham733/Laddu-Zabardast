import tsParser from "@typescript-eslint/parser";

export default [
  { ignores: ["dist/**", "next/**"] },
  {
    files: ["**/*.{ts,tsx,js,mjs}"],
    languageOptions: { parser: tsParser },
    rules: {
      "no-debugger": "error",
      "no-duplicate-case": "error",
      "no-unreachable": "error",
      "no-unsafe-finally": "error",
    },
  },
];
