/**
 * Material Design 3 token generator.
 *
 * Runs at build time, never in the browser, and emits the complete MD3 role set
 * for light and dark schemes as CSS custom properties. The entire visual identity
 * therefore derives from three hex values taken from the IT-SUM logo, which means
 * a university forking this project rebrands it by editing `BRAND_SEED` — not by
 * hunting colour literals through the codebase.
 *
 * Usage: `pnpm --filter @it-sum/ui tokens`
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  argbFromHex,
  hexFromArgb,
  themeFromSourceColor,
  TonalPalette,
  type Theme,
} from '@material/material-color-utilities';

/** Colours sampled from the IT-SUM logo. Change these to rebrand everything. */
const BRAND_SEED = {
  /** The dominant teal of the "IT" glyph. */
  primary: '#1BA9A2',
  /** The deep teal used for outlines and depth in the mark. */
  secondary: '#0E3B3F',
  /** The lime of the "SUM" wordmark; used for rewards and success accents. */
  tertiary: '#9ED11F',
  /** Error red, kept close to MD3's reference tone for familiarity. */
  error: '#B3261E',
} as const;

/**
 * Contrast level from -1 (reduced) to 1 (maximum). Zero is MD3's default and
 * already meets WCAG AA for the on-* pairs, which is what we verify in the a11y
 * tests; raising it would flatten the palette unnecessarily.
 */
const CONTRAST_LEVEL = 0;

type SchemeName = 'light' | 'dark';

/** MD3 colour roles, in the order the specification presents them. */
const COLOR_ROLES = [
  'primary',
  'onPrimary',
  'primaryContainer',
  'onPrimaryContainer',
  'secondary',
  'onSecondary',
  'secondaryContainer',
  'onSecondaryContainer',
  'tertiary',
  'onTertiary',
  'tertiaryContainer',
  'onTertiaryContainer',
  'error',
  'onError',
  'errorContainer',
  'onErrorContainer',
  'background',
  'onBackground',
  'surface',
  'onSurface',
  'surfaceVariant',
  'onSurfaceVariant',
  'outline',
  'outlineVariant',
  'shadow',
  'scrim',
  'inverseSurface',
  'inverseOnSurface',
  'inversePrimary',
  'surfaceDim',
  'surfaceBright',
  'surfaceContainerLowest',
  'surfaceContainerLow',
  'surfaceContainer',
  'surfaceContainerHigh',
  'surfaceContainerHighest',
] as const;

type ColorRole = (typeof COLOR_ROLES)[number];

/** Converts a camelCase MD3 role into the kebab-case CSS variable name we use. */
function toCssVariable(role: string): string {
  return `--md-sys-color-${role.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`;
}

/**
 * MD3's `Scheme` exposes read-only getters, so brand overrides are applied as a
 * lookup layered over the generated scheme rather than by mutating it.
 */
function buildOverrides(lime: TonalPalette, scheme: SchemeName): Partial<Record<ColorRole, number>> {
  const isLight = scheme === 'light';
  return {
    tertiary: lime.tone(isLight ? 40 : 80),
    onTertiary: lime.tone(isLight ? 100 : 20),
    tertiaryContainer: lime.tone(isLight ? 90 : 30),
    onTertiaryContainer: lime.tone(isLight ? 10 : 90),
  };
}

function schemeToCss(theme: Theme, scheme: SchemeName, lime: TonalPalette): string {
  const source = scheme === 'light' ? theme.schemes.light : theme.schemes.dark;
  const overrides = buildOverrides(lime, scheme);
  const lines: string[] = [];

  for (const role of COLOR_ROLES) {
    const argb = overrides[role] ?? (source as unknown as Record<ColorRole, number>)[role];
    if (typeof argb !== 'number') continue;
    lines.push(`  ${toCssVariable(role)}: ${hexFromArgb(argb)};`);
  }

  // Reward surfaces are pinned to the lime palette in both schemes so a badge or
  // points celebration keeps the logo's accent instead of inverting with theme.
  const isLight = scheme === 'light';
  lines.push(`  --md-sys-color-reward: ${hexFromArgb(lime.tone(isLight ? 40 : 80))};`);
  lines.push(`  --md-sys-color-on-reward: ${hexFromArgb(lime.tone(isLight ? 100 : 20))};`);
  lines.push(`  --md-sys-color-reward-container: ${hexFromArgb(lime.tone(isLight ? 90 : 30))};`);
  lines.push(`  --md-sys-color-on-reward-container: ${hexFromArgb(lime.tone(isLight ? 10 : 90))};`);

  return lines.join('\n');
}

/** Emits the tonal palettes so components can reach an exact tone when needed. */
function palettesToCss(theme: Theme, lime: TonalPalette): string {
  const tones = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100];
  const groups: Array<[string, keyof Theme['palettes']]> = [
    ['primary', 'primary'],
    ['secondary', 'secondary'],
    ['tertiary', 'tertiary'],
    ['neutral', 'neutral'],
    ['neutral-variant', 'neutralVariant'],
    ['error', 'error'],
  ];

  const lines: string[] = [];
  for (const [name, key] of groups) {
    const palette = key === 'tertiary' ? lime : theme.palettes[key];
    for (const tone of tones) {
      lines.push(`  --md-ref-palette-${name}-${tone}: ${hexFromArgb(palette.tone(tone))};`);
    }
  }
  return lines.join('\n');
}

function generate(): string {
  const theme = themeFromSourceColor(argbFromHex(BRAND_SEED.primary));

  // `themeFromSourceColor` derives tertiary by rotating hue away from the seed,
  // which for a teal seed lands on blue and loses the logo's lime entirely. We
  // therefore build the tertiary palette from the actual lime and layer it over
  // the generated scheme, keeping MD3's tonal maths while staying on-brand.
  const lime = TonalPalette.fromInt(argbFromHex(BRAND_SEED.tertiary));

  const header = `/**
 * GENERATED FILE — do not edit by hand.
 *
 * Produced by packages/ui/scripts/generate-tokens.ts from the IT-SUM logo seed
 * (primary ${BRAND_SEED.primary}, secondary ${BRAND_SEED.secondary}, tertiary ${BRAND_SEED.tertiary})
 * at contrast level ${CONTRAST_LEVEL}. To rebrand, change BRAND_SEED in that
 * script and run \`pnpm --filter @it-sum/ui tokens\`.
 */
`;

  return `${header}
:root {
${palettesToCss(theme, lime)}
}

/* Light is the default scheme, per the brand direction. */
:root,
[data-theme='light'] {
${schemeToCss(theme, 'light', lime)}
}

[data-theme='dark'] {
${schemeToCss(theme, 'dark', lime)}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
${schemeToCss(theme, 'dark', lime)
  .split('\n')
  .map((line) => `  ${line}`)
  .join('\n')}
  }
}
`;
}

const outputPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../src/styles/generated/md3-tokens.css',
);

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, generate(), 'utf8');

// eslint-disable-next-line no-console
console.log(`Material Design 3 tokens written to ${outputPath}`);
