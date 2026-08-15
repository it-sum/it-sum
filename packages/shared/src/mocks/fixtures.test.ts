import { describe, expect, it } from 'vitest';
import {
  adminDashboardSchema,
  badgeSchema,
  contributorSchema,
  courseSchema,
  departmentSchema,
  departmentTreeSchema,
  driveHealthSchema,
  folderSchema,
  libraryFacetsSchema,
  quizQuestionSchema,
  quizSchema,
  resourceSchema,
  resourceSummarySchema,
  roadmapSchema,
  universitySchema,
  videoSchema,
} from '../index';
import {
  mockAdminDashboard,
  mockBadges,
  mockContributors,
  mockCourses,
  mockDepartments,
  mockDepartmentTree,
  mockDriveHealth,
  mockFolders,
  mockLibraryFacets,
  mockQuizQuestions,
  mockQuizzes,
  mockResources,
  mockResourceSummaries,
  mockRoadmaps,
  mockUniversity,
  mockVideos,
} from './fixtures';

/**
 * This is the contract test that keeps the two developer tracks honest.
 *
 * Track A builds the entire frontend against these fixtures. If a schema changes
 * and a fixture is not updated, this test fails immediately — so the mocks can
 * never drift into describing a response shape the API will not actually produce.
 */

describe('mock fixtures satisfy the published contract', () => {
  it('validates the university and departments', () => {
    expect(() => universitySchema.parse(mockUniversity)).not.toThrow();
    for (const department of mockDepartments) {
      expect(() => departmentSchema.parse(department)).not.toThrow();
    }
  });

  it('validates the full department tree', () => {
    expect(() => departmentTreeSchema.parse(mockDepartmentTree)).not.toThrow();
  });

  it('validates every course', () => {
    for (const course of mockCourses) {
      expect(() => courseSchema.parse(course)).not.toThrow();
    }
  });

  it('validates contributors and folders', () => {
    for (const contributor of mockContributors) {
      expect(() => contributorSchema.parse(contributor)).not.toThrow();
    }
    for (const folder of mockFolders) {
      expect(() => folderSchema.parse(folder)).not.toThrow();
    }
  });

  it('validates resources and their summary projection', () => {
    for (const resource of mockResources) {
      expect(() => resourceSchema.parse(resource)).not.toThrow();
    }
    for (const summary of mockResourceSummaries) {
      expect(() => resourceSummarySchema.parse(summary)).not.toThrow();
    }
  });

  it('validates library facets, videos, quizzes, badges, roadmaps and dashboards', () => {
    expect(() => libraryFacetsSchema.parse(mockLibraryFacets)).not.toThrow();
    for (const video of mockVideos) {
      expect(() => videoSchema.parse(video)).not.toThrow();
    }
    for (const quiz of mockQuizzes) {
      expect(() => quizSchema.parse(quiz)).not.toThrow();
    }
    for (const badge of mockBadges) {
      expect(() => badgeSchema.parse(badge)).not.toThrow();
    }
    for (const roadmap of mockRoadmaps) {
      expect(() => roadmapSchema.parse(roadmap)).not.toThrow();
    }
    expect(() => driveHealthSchema.parse(mockDriveHealth)).not.toThrow();
    expect(() => adminDashboardSchema.parse(mockAdminDashboard)).not.toThrow();
  });
});

describe('quiz integrity is structural, not incidental', () => {
  it('student-facing questions carry no answer key of any kind', () => {
    for (const question of mockQuizQuestions) {
      const parsed = quizQuestionSchema.parse(question);
      const serialized = JSON.stringify(parsed);

      expect(serialized).not.toContain('isCorrect');
      expect(serialized).not.toContain('correctOptionIds');
      expect(serialized).not.toContain('correctShortAnswers');
      expect(serialized).not.toContain('explanation');

      for (const option of parsed.options) {
        expect(Object.keys(option).sort()).toEqual(['id', 'imageUrl', 'sortOrder', 'text']);
      }
    }
  });

  it('strips an answer key even if a careless caller supplies one', () => {
    const leaky = {
      ...(mockQuizQuestions[0] as (typeof mockQuizQuestions)[number]),
      options: [
        { id: '00000000-0000-4000-8000-000000000710', text: 'a', imageUrl: null, sortOrder: 0, isCorrect: true },
        { id: '00000000-0000-4000-8000-000000000711', text: 'b', imageUrl: null, sortOrder: 1, isCorrect: false },
      ],
    };

    const parsed = quizQuestionSchema.parse(leaky);
    expect(JSON.stringify(parsed)).not.toContain('isCorrect');
  });
});

describe('fixtures reflect the awkward realities of the source dataset', () => {
  it('includes a scanned document that is explicitly not searchable', () => {
    const scanned = mockResources.find((resource) => resource.textQuality === 'none');
    expect(scanned).toBeDefined();
    expect(scanned?.isSearchable).toBe(false);
    expect(scanned?.isAiReady).toBe(false);
  });

  it('includes a file large enough to exercise range streaming', () => {
    const largest = Math.max(...mockResources.map((resource) => resource.sizeBytes ?? 0));
    expect(largest).toBeGreaterThan(40 * 1024 * 1024);
  });

  it('includes an unpublished draft so the UI must handle publication state', () => {
    expect(mockResources.some((resource) => resource.state === 'draft')).toBe(true);
  });

  it('includes Arabic titles so RTL layout is exercised from the start', () => {
    const arabicPattern = /[\u0600-\u06FF]/;
    expect(mockResources.some((resource) => arabicPattern.test(resource.displayTitle))).toBe(true);
  });

  it('includes an AI-generated quiz that requires human review before publication', () => {
    const generated = mockQuizzes.find((quiz) => quiz.isAiGenerated);
    expect(generated).toBeDefined();
    expect(generated?.aiReviewRequired).toBe(true);
    expect(generated?.state).not.toBe('published');
    expect(generated?.publishedVersionId).toBeNull();
  });
});
