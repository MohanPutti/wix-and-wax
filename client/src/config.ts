// ─── Feature Flags ───────────────────────────────────────────────────────────

/** Set to true to apply 18% GST at checkout. */
export const ENABLE_GST = false
export const GST_RATE = 0.18

// ─── Site Theme ──────────────────────────────────────────────────────────────
// Change these class strings to retheme the entire site.
// All values must be literal Tailwind classes so they get included at build time.
//
// To switch to light mode, swap to:
//   pageBg: 'bg-cream-50',  sectionAlt: 'bg-warm-50',
//   heading: 'text-warm-900',  body: 'text-warm-600',  muted: 'text-warm-400',
//   headerBg: 'bg-cream-50 border-b border-warm-200',  headerText: 'text-warm-700',
//   cardBg: 'bg-white',  cardText: 'text-warm-900',  cardMuted: 'text-warm-500',

export const THEME = {
  // Page & section backgrounds
  pageBg:     'bg-cream-50',
  sectionAlt: 'bg-warm-50',

  // Text
  heading: 'text-warm-900',
  body:    'text-warm-600',
  muted:   'text-warm-400',

  // Header
  headerBg:   'bg-cream-50 border-b border-warm-200',
  headerText: 'text-warm-700',
  headerHover:'hover:text-amber-700',

  // Cards (category tiles)
  cardBg:   'bg-white',
  cardText: 'text-warm-900',
  cardMuted:'text-warm-500',

  // Dividers
  divider: 'border-warm-200',
}
