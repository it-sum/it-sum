import { describe, expect, it } from 'vitest';
import ar from '../../messages/ar.json';
import en from '../../messages/en.json';

/**
 * Translation-parity tests.
 *
 * A missing key in one locale is invisible in development — you simply never open
 * that page in that language — and then ships as a raw key like `home.heroTitle`
 * on a live site. These tests make the two catalogues structurally identical by
 * construction, and also check the details that specifically break bilingual UIs:
 * ICU plural categories that Arabic needs but English does not, and placeholder
 * sets that must match between locales.
 */

type Json = { [key: string]: Json | string };

function flatten(value: Json, prefix = ''): Map<string, string> {
  const result = new Map<string, string>();
  for (const [key, entry] of Object.entries(value)) {
    const path = prefix === '' ? key : `${prefix}.${key}`;
    if (typeof entry === 'string') {
      result.set(path, entry);
    } else {
      for (const [nested, nestedValue] of flatten(entry, path)) {
        result.set(nested, nestedValue);
      }
    }
  }
  return result;
}

const arabic = flatten(ar as unknown as Json);
const english = flatten(en as unknown as Json);

/** Extracts `{name}` placeholders, ignoring ICU plural category labels. */
function placeholders(message: string): Set<string> {
  const found = new Set<string>();
  const pattern = /\{\s*([a-zA-Z0-9_]+)\s*(?:,|\})/g;
  let match: RegExpExecArray | null = pattern.exec(message);
  while (match !== null) {
    if (match[1] != null) found.add(match[1]);
    match = pattern.exec(message);
  }
  return found;
}

describe('message catalogues', () => {
  it('define exactly the same keys in both locales', () => {
    const missingInEnglish = [...arabic.keys()].filter((key) => !english.has(key)).sort();
    const missingInArabic = [...english.keys()].filter((key) => !arabic.has(key)).sort();

    expect(missingInEnglish, `keys present in ar.json but missing from en.json`).toEqual([]);
    expect(missingInArabic, `keys present in en.json but missing from ar.json`).toEqual([]);
  });

  it('has no empty or placeholder-only translations', () => {
    for (const [key, value] of [...arabic, ...english]) {
      expect(value.trim(), `empty translation for ${key}`).not.toBe('');
      expect(value.trim(), `untranslated marker left in ${key}`).not.toMatch(/^(TODO|TBD|FIXME)/i);
    }
  });

  it('uses the same interpolation placeholders in both locales', () => {
    for (const [key, arValue] of arabic) {
      const enValue = english.get(key);
      if (enValue == null) continue;

      const arPlaceholders = [...placeholders(arValue)].sort();
      const enPlaceholders = [...placeholders(enValue)].sort();
      expect(arPlaceholders, `placeholder mismatch in ${key}`).toEqual(enPlaceholders);
    }
  });

  it('gives Arabic plural messages the dual and few categories the language needs', () => {
    // Arabic distinguishes one, two, few (3-10), many (11-99) and other. English
    // needs only one/other, so an Arabic plural copied from English reads wrong
    // for 2 and for 3-10 — the two most common counts in a course listing.
    const arabicPlurals = [...arabic.entries()].filter(([, value]) => value.includes(', plural,'));

    expect(arabicPlurals.length, 'expected some pluralised Arabic messages').toBeGreaterThan(0);

    for (const [key, value] of arabicPlurals) {
      expect(value, `Arabic plural ${key} is missing the dual (two) category`).toMatch(/\btwo\s*\{/);
      expect(value, `Arabic plural ${key} is missing the few category`).toMatch(/\bfew\s*\{/);
      expect(value, `Arabic plural ${key} is missing the required other category`).toMatch(
        /\bother\s*\{/,
      );
    }
  });

  it('keeps every English plural message valid ICU with an other branch', () => {
    const englishPlurals = [...english.entries()].filter(([, value]) => value.includes(', plural,'));
    for (const [key, value] of englishPlurals) {
      expect(value, `English plural ${key} is missing the required other category`).toMatch(
        /\bother\s*\{/,
      );
    }
  });

  it('has balanced braces in every message', () => {
    for (const [key, value] of [...arabic, ...english]) {
      let depth = 0;
      for (const char of value) {
        if (char === '{') depth += 1;
        if (char === '}') depth -= 1;
        expect(depth, `unbalanced closing brace in ${key}`).toBeGreaterThanOrEqual(0);
      }
      expect(depth, `unclosed brace in ${key}`).toBe(0);
    }
  });

  it('contains Arabic script in the Arabic catalogue and none in the English one', () => {
    const arabicScript = /[\u0600-\u06FF]/;

    const arabicEntriesWithoutArabic = [...arabic.entries()]
      .filter(([key]) => !key.startsWith('meta.siteName') && key !== 'meta.switchTo')
      .filter(([, value]) => !arabicScript.test(value) && !/^[A-Za-z\s.@-]+$/.test(value));
    expect(arabicEntriesWithoutArabic.map(([key]) => key)).toEqual([]);

    // `meta.switchTo` is the sole exception: it names the *other* language.
    const englishEntriesWithArabic = [...english.entries()]
      .filter(([key]) => key !== 'meta.switchTo')
      .filter(([, value]) => arabicScript.test(value));
    expect(englishEntriesWithArabic.map(([key]) => key)).toEqual([]);
  });
});
