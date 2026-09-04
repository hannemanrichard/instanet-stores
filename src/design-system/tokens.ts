/**
 * Typed / JS-facing config (DESIGN.md structure + Grab colors).
 * Visual colors live in tokens.css.
 */

export const layout = {
  /** Matches --sidebar-width in tokens.css */
  sidebarWidth: "16rem",
  /** Matches --sidebar-width-icon in tokens.css */
  sidebarWidthIcon: "3.25rem",
  sidebarWidthMobile: "18rem",
  /** Matches --header-height in tokens.css */
  headerHeight: "3.5rem",
} as const;

export const radii = {
  /** Matches --radius (8px) */
  control: "0.5rem",
} as const;

export const fonts = {
  /** Inter — non-Arabic UI face */
  sansVar: "--font-inter",
  displayVar: "--font-inter",
  /** Playfair Display — optional editorial serif */
  serifVar: "--font-playfair",
  /** IBM Plex Mono — code */
  monoVar: "--font-ibm-plex-mono",
  arabicVar: "--font-cairo",
} as const;

/**
 * Hex for Clerk / APIs. Matches --primary / --brand in tokens.css (Grab green).
 */
export const brand = {
  primaryHex: "#00B14F",
  accentHex: "#E6F8EF",
} as const;

export const zIndex = {
  sidebar: 10,
  header: 40,
  overlay: 50,
} as const;

export const designTokens = {
  layout,
  radii,
  fonts,
  brand,
  zIndex,
} as const;

export type DesignTokens = typeof designTokens;
