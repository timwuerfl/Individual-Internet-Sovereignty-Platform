/**
 * ────────────────────────────────────────────────────────────────────────────
 *  DESIGN TOKENS — single source of truth
 * ────────────────────────────────────────────────────────────────────────────
 *  Design direction: editorial, near-monochrome, trustworthy. Structure comes
 *  from 1px hairlines + whitespace, NOT shadows or rounded boxes. One quiet
 *  accent (muted pine green); colour is functional (status), never decorative.
 *
 *  Type pairing:
 *    - display / headlines → Fraunces (characterful serif)
 *    - UI / body           → IBM Plex Sans (calm, precise grotesk)
 *
 *  These tokens are mirrored as CSS variables in src/index.css so non-Tailwind
 *  contexts (e.g. inline SVG charts) can read the same values.
 * ────────────────────────────────────────────────────────────────────────────
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    // Tight, deliberate scale — generous whitespace is the point.
    extend: {
      colors: {
        // Surfaces — warm off-white paper, not clinical white.
        paper: "#FBFAF7", // app background
        surface: "#FFFFFF", // raised reading surface (cards, drawers)
        sunken: "#F4F2EC", // recessed wells, table headers

        // Ink — warm anthracite, three weights.
        ink: "#1C1B19", // primary text / headlines
        "ink-soft": "#52504A", // secondary text
        "ink-mute": "#8A867D", // tertiary / captions / icons at rest

        // Hairlines — warm grey 1px structure.
        line: "#E7E3DA",
        "line-strong": "#D6D1C5",

        // Accent — muted pine. The only "brand" colour, used sparingly.
        accent: {
          DEFAULT: "#2E5D4B",
          soft: "#EAF1ED", // tint background
          ink: "#244C3D", // pressed / text-on-tint
        },

        // Functional status — quiet, never neon.
        ok: { DEFAULT: "#3F7A5E", soft: "#EAF2EC" },
        warn: { DEFAULT: "#B07414", soft: "#FBF1DF" },
        danger: { DEFAULT: "#A23B33", soft: "#FBEBE8" },
        info: { DEFAULT: "#3A5A78", soft: "#EAF0F5" },
      },
      fontFamily: {
        display: ['"Fraunces Variable"', "Fraunces", "Georgia", "serif"],
        sans: ['"IBM Plex Sans"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      fontSize: {
        // Editorial scale with strong contrast at the top end.
        "display-xl": ["3.25rem", { lineHeight: "1.04", letterSpacing: "-0.02em" }],
        "display-lg": ["2.5rem", { lineHeight: "1.08", letterSpacing: "-0.015em" }],
        "display-md": ["1.875rem", { lineHeight: "1.15", letterSpacing: "-0.01em" }],
        "display-sm": ["1.375rem", { lineHeight: "1.25", letterSpacing: "-0.005em" }],
      },
      borderRadius: {
        // Restrained radii — slightly soft, never pill-blobby on cards.
        DEFAULT: "4px",
        md: "6px",
        lg: "8px",
      },
      maxWidth: {
        content: "1180px",
      },
      transitionTimingFunction: {
        // Calm, no bounce.
        subtle: "cubic-bezier(0.4, 0.0, 0.2, 1)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in": {
          "0%": { transform: "translateX(16px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s cubic-bezier(0.4,0,0.2,1)",
        "slide-in": "slide-in 0.28s cubic-bezier(0.4,0,0.2,1)",
        shimmer: "shimmer 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
