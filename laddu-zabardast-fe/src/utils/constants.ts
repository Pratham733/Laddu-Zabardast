export type Theme = (typeof THEMES)[keyof typeof THEMES];

export const THEMES = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
} as const;
