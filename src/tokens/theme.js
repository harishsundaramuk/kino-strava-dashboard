// ─────────────────────────────────────────────────────────────────────────────
// KINŌ Design Tokens — v2
// DARK: WHOOP-inspired pure black with clear card separation
// LIGHT: Clean warm white with crisp contrast — Apple Notes meets Notion
// ─────────────────────────────────────────────────────────────────────────────

export const DARK = {
  // Base
  bg:        "#0A0A0A",              // Pure near-black — no purple tint
  sidebar:   "#0F0F0F",              // Sidebar slightly lifted from bg
  card:      "#161616",              // Cards clearly visible — solid not transparent
  cardSolid: "#161616",
  faint:     "#1F1F1F",              // Inner tiles / inputs — clear depth layer
  border:    "rgba(255,255,255,.12)",// Visible but not harsh card edges
  // Text
  text:      "#F5F5F5",              // Slightly warm white — easier on eyes than #FFF
  textSub:   "#A0A0A0",              // Secondary text — clear but stepped back
  muted:     "#666666",              // Muted labels — clean neutral grey
  // Brand
  primary:   "#E8603E",
  pLight:    "#F07050",
  // Accent
  lime:      "#84CC16",
  rose:      "#F43F5E",
  cyan:      "#38BDF8",              // True cyan — pops on dark
  amber:     "#F59E0B",
  // Background decorations
  blob1:     "rgba(232,96,62,.10)",
  blob2:     "rgba(56,189,248,.06)",
  // UI
  scrollbar: "#2A2A2A",
  tooltipBg: "#1F1F1F",
  heatOff:   "#1F1F1F",
  navHover:  "rgba(255,255,255,.05)",
  tabActive: "#1F1F1F",
};

export const LIGHT = {
  // Base — warm white, not cold blue-white
  bg:        "#F7F7F5",              // Warm off-white — not harsh pure white
  sidebar:   "#FFFFFF",              // Sidebar pure white — clear separation
  card:      "#FFFFFF",              // Cards pure white — crisp on warm bg
  cardSolid: "#FFFFFF",
  faint:     "#F0EDE8",              // Inner tiles — warm subtle tint
  border:    "rgba(0,0,0,.09)",      // Visible borders — sharper than before
  // Text
  text:      "#111111",              // Near-black — high contrast
  textSub:   "#555555",              // Secondary — clearly readable
  muted:     "#888888",              // Muted labels — not too light
  // Brand
  primary:   "#E8603E",
  pLight:    "#C84E2C",
  // Accent — darker on light for readability
  lime:      "#4D7C0F",
  rose:      "#BE123C",
  cyan:      "#0284C7",
  amber:     "#B45309",
  // Background decorations
  blob1:     "rgba(232,96,62,.06)",
  blob2:     "rgba(56,189,248,.04)",
  // UI
  scrollbar: "#E0D8D0",
  tooltipBg: "#FFFFFF",
  heatOff:   "#EAE6E0",
  navHover:  "rgba(0,0,0,.04)",
  tabActive: "#FFF0E8",
};

/** Border radius scale */
export const RADIUS = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  full: 9999,
};

/** Typography families */
export const FONTS = {
  heading: "'Syne', sans-serif",
  body:    "'DM Sans', sans-serif",
  stat:    "'Bebas Neue', cursive",
};

/** Google Fonts import string — injected once into <head> */
export const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600;700&family=Bebas+Neue&display=swap";