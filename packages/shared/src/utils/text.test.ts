import { describe, expect, it } from 'vitest';
import {
  cleanDisplayTitle,
  extractContributorName,
  foldArabic,
  formatBytes,
  formatDuration,
  inferExamPhase,
  inferMaterialKind,
  normalizeDigits,
  normalizeLabel,
  similarity,
  slugify,
} from './text.js';

/**
 * Every fixture in this file is a real string observed in the source Drive folder
 * `ملخصات قسم IT`, or a direct variation of one. Testing against invented inputs
 * would prove very little; testing against the actual mess is the point.
 */

describe('normalizeLabel', () => {
  it('collapses the observed course-name inconsistencies to one form', () => {
    expect(normalizeLabel('physics ')).toBe('physics');
    expect(normalizeLabel('Physics')).toBe('physics');
    expect(normalizeLabel('Cyber Security')).toBe('cyber security');
    expect(normalizeLabel('Cybersecurity')).toBe('cybersecurity');
  });

  it('strips diacritics, invisible characters and emoji', () => {
    expect(normalizeLabel('مُلَخَّصَات')).toBe('ملخصات');
    expect(normalizeLabel('ملخصات\u200f IT')).toBe('ملخصات it');
    expect(normalizeLabel('ملخصات 📚 IT')).toBe('ملخصات it');
  });

  it('is idempotent', () => {
    const once = normalizeLabel('Level 1_First semester');
    expect(normalizeLabel(once)).toBe(once);
  });
});

describe('foldArabic', () => {
  it('folds alef, taa marbuta and alef maqsura variants', () => {
    expect(foldArabic('أحمد')).toBe(foldArabic('احمد'));
    expect(foldArabic('لغة')).toBe(foldArabic('لغه'));
    expect(foldArabic('على')).toBe(foldArabic('علي'));
  });
});

describe('normalizeDigits', () => {
  it('converts Arabic-Indic digits to ASCII', () => {
    expect(normalizeDigits('المستوى ١')).toBe('المستوى 1');
    expect(normalizeDigits('۱۲۳')).toBe('123');
  });
});

describe('slugify', () => {
  it('produces URL-safe slugs for Latin names', () => {
    expect(slugify('Cyber Security')).toBe('cyber-security');
    expect(slugify('Level 1_First semester')).toBe('level-1-first-semester');
  });

  it('preserves Arabic words rather than dropping them', () => {
    expect(slugify('ملخصات IT')).toBe('ملخصات-it');
  });
});

describe('similarity', () => {
  it('rates the real near-duplicate course names highly', () => {
    expect(similarity('physics', 'physic')).toBeGreaterThan(0.8);
    expect(similarity('Cybersecurity', 'Cyber Security')).toBeGreaterThan(0.85);
  });

  it('rates unrelated courses low', () => {
    expect(similarity('Math', 'Python')).toBeLessThan(0.4);
  });

  it('treats normalisation-equal strings as identical', () => {
    expect(similarity('physics ', 'Physics')).toBe(1);
  });
});

describe('inferMaterialKind', () => {
  it('classifies the real folder names', () => {
    expect(inferMaterialKind('محاضرات و شيتات غير محلولة')).toBe('sheet');
    expect(inferMaterialKind('حل شيتات الخاصة')).toBe('solution');
    expect(inferMaterialKind('ملخصات Cybersecurity')).toBe('summary');
    expect(inferMaterialKind('Assignment & Sheet')).toBe('assignment');
    expect(inferMaterialKind('tutorial')).toBe('tutorial');
    expect(inferMaterialKind('محاضرات')).toBe('lecture');
  });

  it('prefers the more specific classification when patterns overlap', () => {
    // Contains both "حل" and "شيت"; the solved-sheet reading is the correct one.
    expect(inferMaterialKind('حل شيت 3')).toBe('solution');
  });

  it('falls back to other for unrecognised names', () => {
    expect(inferMaterialKind('random file 42')).toBe('other');
  });
});

describe('inferExamPhase', () => {
  it('distinguishes the three midterm-related folder names', () => {
    expect(inferExamPhase('ما قبل ميدترم')).toBe('pre_midterm');
    expect(inferExamPhase('ميدترم')).toBe('midterm');
    expect(inferExamPhase('ما بعد ميدترم')).toBe('post_midterm');
    expect(inferExamPhase('فاينل')).toBe('final');
  });

  it('handles English equivalents and spacing variations', () => {
    expect(inferExamPhase('Pre-Midterm')).toBe('pre_midterm');
    expect(inferExamPhase('post midterm')).toBe('post_midterm');
    expect(inferExamPhase('Final Exam')).toBe('final');
    expect(inferExamPhase('ميد ترم')).toBe('midterm');
  });

  it('returns unphased when no phase is indicated', () => {
    expect(inferExamPhase('ملخصات Python')).toBe('unphased');
  });
});

describe('extractContributorName', () => {
  it('extracts the contributor from the real folder label', () => {
    expect(extractContributorName('ملخصات Eng:Ahmed Eid')).toBe('Ahmed Eid');
  });

  it('handles other honorific spellings', () => {
    expect(extractContributorName('Dr. Mona Hassan')).toBe('Mona Hassan');
    expect(extractContributorName('Eng Ahmed')).toBe('Ahmed');
  });

  it('returns null when nobody is credited', () => {
    expect(extractContributorName('ميدترم')).toBeNull();
    expect(extractContributorName('tutorial')).toBeNull();
  });
});

describe('cleanDisplayTitle', () => {
  it('removes scanner and WhatsApp noise from real filenames', () => {
    expect(cleanDisplayTitle('DOC-20250412-WA0001.pdf')).toBe('');
    expect(cleanDisplayTitle('CamScanner 04-12-2025 10.31.22.pdf')).toBe('');
    expect(cleanDisplayTitle('Lecture_3_Networks.pdf')).toBe('Lecture 3 Networks');
  });

  it('keeps meaningful Arabic titles intact', () => {
    expect(cleanDisplayTitle('ملخص الباب الأول.pdf')).toBe('ملخص الباب الأول');
  });
});

describe('formatBytes', () => {
  it('formats the real size range in both locales', () => {
    expect(formatBytes(0)).toBe('0 بايت');
    expect(formatBytes(48 * 1024 * 1024, 'en')).toBe('48 MB');
    expect(formatBytes(1_500_000, 'en')).toBe('1.4 MB');
    expect(formatBytes(2048, 'ar')).toBe('2 ك.بايت');
  });
});

describe('formatDuration', () => {
  it('formats minutes and hours', () => {
    expect(formatDuration(59)).toBe('0:59');
    expect(formatDuration(125)).toBe('2:05');
    expect(formatDuration(3725)).toBe('1:02:05');
  });
});
