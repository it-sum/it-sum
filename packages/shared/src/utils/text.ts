import type { ExamPhase, MaterialKind } from '../domain/enums';

/**
 * Bilingual text utilities shared by the importer, the search layer and the UI.
 *
 * These live in the contract package on purpose. The API normalises a Drive folder
 * name to decide which course it belongs to, and the web app normalises a user's
 * search box input; if those two implementations ever disagreed, a student would
 * type the name of a course they can see and get no results. One implementation
 * removes that class of bug entirely.
 */

/** Arabic diacritics (harakat, tatweel, superscript alef). */
const ARABIC_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g;

/** Zero-width and bidirectional control characters that survive copy-paste. */
const INVISIBLE_CHARS = /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g;

/**
 * Emoji, pictographs and dingbats, which appear in several real folder names.
 * The variation selectors (FE00-FE0F) are matched separately from the base
 * ranges so the class never combines a base character with its modifier.
 */
const EMOJI =
  /[\u{1F000}-\u{1FAFF}]|[\u{2600}-\u{27BF}]|[\u{1F1E6}-\u{1F1FF}]|[\u{2190}-\u{21FF}]|[\u{2B00}-\u{2BFF}]|[\u{FE00}-\u{FE0F}]/gu;

/**
 * Folds Arabic orthographic variants so that alternative spellings compare equal.
 * Alef forms collapse to bare alef, taa marbuta to haa, alef maqsura to yaa, and
 * Persian/Urdu kaf and yeh to their Arabic equivalents.
 */
export function foldArabic(input: string): string {
  return input
    .replace(ARABIC_DIACRITICS, '')
    .replace(/[\u0622\u0623\u0625\u0627\u0671]/g, '\u0627')
    .replace(/\u0629/g, '\u0647')
    .replace(/\u0649/g, '\u064A')
    .replace(/\u06A9/g, '\u0643')
    .replace(/[\u06CC\u06D2]/g, '\u064A')
    .replace(/\u0624/g, '\u0648');
}

/** Converts Arabic-Indic and Eastern Arabic-Indic digits to ASCII digits. */
export function normalizeDigits(input: string): string {
  return input.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (digit) => {
    const code = digit.codePointAt(0) ?? 0;
    const base = code >= 0x06f0 ? 0x06f0 : 0x0660;
    return String(code - base);
  });
}

/**
 * Canonical comparison form for any human-entered or Drive-sourced label.
 * Lowercased, Arabic-folded, digit-normalised, punctuation-stripped and
 * whitespace-collapsed, so `"physic "`, `"Physics"` and `"physics"` all agree.
 */
export function normalizeLabel(input: string): string {
  return normalizeDigits(foldArabic(input))
    .replace(INVISIBLE_CHARS, '')
    .replace(EMOJI, ' ')
    .toLowerCase()
    .replace(/[_\-–—.,;:!?()[\]{}'"«»“”‘’/\\|+*&#@~`^$%<>=]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Builds a URL-safe slug, transliterating nothing and preserving Arabic words. */
export function slugify(input: string): string {
  const normalized = normalizeLabel(input).replace(/\s+/g, '-');
  return normalized.replace(/^-+|-+$/g, '').slice(0, 120);
}

/**
 * Levenshtein-based similarity in the range 0–1, used to propose a course match
 * for an unrecognised folder name. Kept small and dependency-free; the database
 * does the heavy fuzzy work with `pg_trgm`, this is for client-side preview.
 */
export function similarity(a: string, b: string): number {
  const left = normalizeLabel(a);
  const right = normalizeLabel(b);
  if (left === right) return 1;
  if (left.length === 0 || right.length === 0) return 0;

  const previous = new Array<number>(right.length + 1);
  const current = new Array<number>(right.length + 1);
  for (let j = 0; j <= right.length; j += 1) previous[j] = j;

  for (let i = 1; i <= left.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      current[j] = Math.min(
        (current[j - 1] ?? 0) + 1,
        (previous[j] ?? 0) + 1,
        (previous[j - 1] ?? 0) + cost,
      );
    }
    for (let j = 0; j <= right.length; j += 1) previous[j] = current[j] ?? 0;
  }

  const distance = previous[right.length] ?? 0;
  return 1 - distance / Math.max(left.length, right.length);
}

/**
 * Arabic and English keyword tables mapping a folder or file name onto the
 * material-kind facet. Derived from the actual folder names in the source Drive.
 */
const MATERIAL_KIND_PATTERNS: ReadonlyArray<{ kind: MaterialKind; patterns: RegExp[] }> = [
  // "غير محلولة" (unsolved) must be tested before "محلول" (solved), otherwise the
  // real folder "محاضرات و شيتات غير محلولة" is misfiled as a solutions folder.
  { kind: 'sheet', patterns: [/غير\s*محلول/, /\bunsolved/, /\bnot\s*solved/] },
  { kind: 'solution', patterns: [/حل\s*شيت/, /\bحلول?\b/, /محلول/, /\bsolution/, /\bsolved/, /\banswer/] },
  // Tested before `sheet` so the real folder "Assignment & Sheet" is filed as an
  // assignment, which is how a student thinks of it, rather than as a bare sheet.
  { kind: 'assignment', patterns: [/تكليف/, /واجب/, /\bassignment/, /\bhomework/, /\bhw\b/] },
  { kind: 'sheet', patterns: [/شيت/, /\bsheet/, /\bworksheet/] },
  { kind: 'tutorial', patterns: [/سكشن/, /\btutorial/, /\bsection/, /\blab\b/, /\bpractical/] },
  { kind: 'exam', patterns: [/امتحان/, /اختبار/, /\bexam/, /\bquiz\b/, /\btest\b/, /\bpaper/] },
  { kind: 'lecture', patterns: [/محاضر/, /\blecture/, /\blec\b/, /\bslides?\b/, /\bchapter/] },
  { kind: 'summary', patterns: [/ملخص/, /مراجع/, /\bsummary/, /\bsummaries/, /\brevision/] },
  { kind: 'reference', patterns: [/كتاب/, /مرجع/, /\bbook/, /\breference/, /\btextbook/] },
];

/** Infers what a document *is* from its Drive path. Falls back to `other`. */
export function inferMaterialKind(pathOrName: string): MaterialKind {
  const haystack = normalizeLabel(pathOrName);
  for (const entry of MATERIAL_KIND_PATTERNS) {
    if (entry.patterns.some((pattern) => pattern.test(haystack))) {
      return entry.kind;
    }
  }
  return 'other';
}

/**
 * Exam-phase patterns. Order matters: "ما بعد ميدترم" and "ما قبل ميدترم" both
 * contain "ميدترم", so the qualified forms must be tested first.
 */
const EXAM_PHASE_PATTERNS: ReadonlyArray<{ phase: ExamPhase; patterns: RegExp[] }> = [
  { phase: 'post_midterm', patterns: [/ما\s*بعد\s*(ال)?ميد/, /\bpost[\s-]*mid/, /\bafter\s*mid/] },
  { phase: 'pre_midterm', patterns: [/ما\s*قبل\s*(ال)?ميد/, /\bpre[\s-]*mid/, /\bbefore\s*mid/] },
  { phase: 'final', patterns: [/فاينل/, /نهائ/, /\bfinal/] },
  { phase: 'midterm', patterns: [/ميد\s*تر?م/, /نصف\s*(ال)?ترم/, /\bmid[\s-]*term/, /\bmidterm/] },
];

/** Infers when in the term a document matters. Falls back to `unphased`. */
export function inferExamPhase(pathOrName: string): ExamPhase {
  const haystack = normalizeLabel(pathOrName);
  for (const entry of EXAM_PHASE_PATTERNS) {
    if (entry.patterns.some((pattern) => pattern.test(haystack))) {
      return entry.phase;
    }
  }
  return 'unphased';
}

/**
 * Extracts a contributor name from folder labels such as `ملخصات Eng:Ahmed Eid`
 * or `Dr. Mona summaries`. Returns null when no person is credited.
 */
export function extractContributorName(label: string): string | null {
  // Two separate patterns, because the risk differs by honorific length.
  //
  // Multi-letter titles (Eng, Dr, Prof) are safe to match followed by whitespace
  // or punctuation. Single-letter Arabic titles (د, م, أ) are *not*: the "د" in
  // "ميدترم" and the "م" in "ملخصات" would both be misread as a title. Those
  // therefore require an explicit separator such as "." or ":" straight after.
  const titles = '(?:eng(?:ineer)?|dr|prof(?:essor)?|mr|ms|mrs)';
  const boundary = '(?:^|[\\s([|،,\\-–])';
  const separator = '[.:\\u061B\\u060C\\-–]';

  const longHonorific = new RegExp(
    `${boundary}${titles}\\s*${separator}?\\s+|${boundary}${titles}\\s*[.:\\u061B\\u060C]\\s*`,
    'i',
  );
  const shortHonorific = new RegExp(`${boundary}(?:أ|د|م)\\s*[.:\\u061B\\u060C]\\s*`);

  const match = longHonorific.exec(label) ?? shortHonorific.exec(label);
  if (!match) return null;

  const remainder = label.slice(match.index + match[0].length);
  const nameMatch = /^[A-Za-z\u0600-\u06FF][A-Za-z\u0600-\u06FF\s.'’-]{1,60}/.exec(remainder);
  const captured = nameMatch?.[0]?.trim();
  if (!captured) return null;

  const cleaned = captured
    .replace(INVISIBLE_CHARS, '')
    .replace(/(summaries|summary|ملخصات|ملخص)/gi, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s.'’-]+|[\s.'’-]+$/g, '')
    .trim();

  return cleaned.length >= 2 ? cleaned : null;
}

/** Strips the noise that makes raw Drive filenames unreadable in a UI. */
export function cleanDisplayTitle(fileName: string): string {
  return fileName
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .replace(INVISIBLE_CHARS, '')
    .replace(/\bCamScanner\b/gi, '')
    .replace(/\bDOC-\d{8}-WA\d{4}\b/gi, '')
    .replace(/\bIMG[-_]\d{8}[-_]WA\d{4}\b/gi, '')
    .replace(/\b\d{2}-\d{2}-\d{4}\s*\d{2}\.\d{2}\.\d{2}\b/g, '')
    .replace(/[_]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s\-–—.]+|[\s\-–—.]+$/g, '')
    .trim();
}

/** Human-readable byte size, locale-aware for Arabic and English. */
export function formatBytes(bytes: number, locale: 'ar' | 'en' = 'ar'): string {
  if (bytes <= 0) return locale === 'ar' ? '0 بايت' : '0 B';
  const units =
    locale === 'ar'
      ? ['بايت', 'ك.بايت', 'م.بايت', 'ج.بايت']
      : ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  const formatted = value >= 100 || exponent === 0 ? Math.round(value) : Number(value.toFixed(1));
  return `${formatted} ${units[exponent]}`;
}

/** Formats a duration in seconds as `h:mm:ss` or `m:ss`. */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const pad = (value: number) => value.toString().padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(secs)}` : `${minutes}:${pad(secs)}`;
}
