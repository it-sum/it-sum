/**
 * The single registry of every API path in IT-SUM.
 *
 * Both the NestJS controllers and the web client build their URLs from this file.
 * A typo therefore becomes a TypeScript error rather than a 404 discovered in
 * production, and renaming an endpoint is a one-line change that the compiler
 * propagates to every call site.
 */

export const API_VERSION = 'v1' as const;
export const API_PREFIX = `/api/${API_VERSION}` as const;

export const apiRoutes = {
  health: {
    live: '/health',
    ready: '/health/ready',
  },

  auth: {
    register: '/auth/register',
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    me: '/auth/me',
    updateProfile: '/auth/me',
    updatePreferences: '/auth/me/preferences',
    requestPasswordReset: '/auth/password/reset',
    confirmPasswordReset: '/auth/password/reset/confirm',
    verifyEmail: '/auth/email/verify',
    acceptInvitation: '/auth/invitations/accept',
  },

  academics: {
    universities: '/academics/universities',
    departments: '/academics/departments',
    department: (id: string) => `/academics/departments/${id}`,
    departmentTree: (id: string) => `/academics/departments/${id}/tree`,
    batches: '/academics/batches',
    batch: (id: string) => `/academics/batches/${id}`,
    semesters: '/academics/semesters',
    semester: (id: string) => `/academics/semesters/${id}`,
    courses: '/academics/courses',
    course: (id: string) => `/academics/courses/${id}`,
    courseAliases: '/academics/course-aliases',
    courseAlias: (id: string) => `/academics/course-aliases/${id}`,
  },

  library: {
    browse: '/library',
    facets: '/library/facets',
    resource: (id: string) => `/library/resources/${id}`,
    updateResource: (id: string) => `/library/resources/${id}`,
    bulkAction: '/library/resources/bulk',
    streamTicket: (id: string) => `/library/resources/${id}/stream-ticket`,
    stream: (id: string) => `/library/resources/${id}/stream`,
    download: (id: string) => `/library/resources/${id}/download`,
    thumbnail: (id: string) => `/library/resources/${id}/thumbnail`,
    contributors: '/library/contributors',
    folders: '/library/folders',
    bookmarks: '/library/bookmarks',
    bookmark: (id: string) => `/library/bookmarks/${id}`,
    report: '/library/reports',
  },

  videos: {
    list: '/videos',
    video: (id: string) => `/videos/${id}`,
    import: '/videos/import',
  },

  progress: {
    update: '/progress',
    overview: '/progress/overview',
    continueItems: '/progress/continue',
    course: (courseId: string) => `/progress/courses/${courseId}`,
    streak: '/progress/streak',
  },

  quizzes: {
    list: '/quizzes',
    quiz: (id: string) => `/quizzes/${id}`,
    create: '/quizzes',
    update: (id: string) => `/quizzes/${id}`,
    publish: (id: string) => `/quizzes/${id}/publish`,
    unpublish: (id: string) => `/quizzes/${id}/unpublish`,
    withKeys: (id: string) => `/quizzes/${id}/authoring`,
    import: '/quizzes/import',
    startAttempt: (id: string) => `/quizzes/${id}/attempts`,
    autosave: (attemptId: string) => `/quizzes/attempts/${attemptId}/autosave`,
    submit: (attemptId: string) => `/quizzes/attempts/${attemptId}/submit`,
    attempt: (attemptId: string) => `/quizzes/attempts/${attemptId}`,
    attemptHistory: '/quizzes/attempts',
    reviewQueue: '/quizzes/review-queue',
  },

  rewards: {
    overview: '/rewards',
    ledger: '/rewards/ledger',
    badges: '/rewards/badges',
    leaderboard: '/rewards/leaderboard',
    rules: '/rewards/rules',
    rule: (id: string) => `/rewards/rules/${id}`,
    grant: '/rewards/grant',
  },

  drive: {
    account: '/drive/account',
    health: '/drive/health',
    connectStart: '/drive/oauth/start',
    connectCallback: '/drive/oauth/callback',
    disconnect: '/drive/oauth/disconnect',
    sync: '/drive/sync',
    syncRuns: '/drive/sync/runs',
    syncRun: (id: string) => `/drive/sync/runs/${id}`,
    proposals: '/drive/proposals',
    decideProposals: '/drive/proposals/decide',
  },

  engagement: {
    notifications: '/notifications',
    markRead: (id: string) => `/notifications/${id}/read`,
    markAllRead: '/notifications/read-all',
    preferences: '/notifications/preferences',
    unsubscribe: '/notifications/unsubscribe',
    announcements: '/announcements',
    announcement: (id: string) => `/announcements/${id}`,
    contact: '/contact',
    contactMessages: '/contact/messages',
    contactMessage: (id: string) => `/contact/messages/${id}`,
  },

  roadmaps: {
    list: '/roadmaps',
    roadmap: (slug: string) => `/roadmaps/${slug}`,
    nodeProgress: '/roadmaps/node-progress',
  },

  admin: {
    dashboard: '/admin/dashboard',
    users: '/admin/users',
    user: (id: string) => `/admin/users/${id}`,
    setRole: (id: string) => `/admin/users/${id}/role`,
    approvals: '/admin/approvals',
    decideApproval: (id: string) => `/admin/approvals/${id}`,
    invitations: '/admin/invitations',
    reports: '/admin/reports',
    report: (id: string) => `/admin/reports/${id}`,
    auditLog: '/admin/audit-log',
  },

  ai: {
    capabilities: '/ai/capabilities',
    chat: '/ai/chat',
    stream: '/ai/chat/stream',
    conversations: '/ai/conversations',
    conversation: (id: string) => `/ai/conversations/${id}`,
    feature: (feature: string) => `/ai/features/${feature}`,
    models: '/ai/models',
    health: '/ai/health',
    usage: '/ai/usage',
    usageSummary: '/ai/usage/summary',
    budgets: '/ai/budgets',
    feedback: '/ai/feedback',
    keys: '/ai/keys',
    key: (id: string) => `/ai/keys/${id}`,
    embeddings: '/ai/embeddings',
    completions: '/ai/completions',
  },

  public: {
    stats: '/public/stats',
    departments: '/public/departments',
    resourcePreview: '/public/resources',
  },

  internal: {
    cronReminders: '/internal/cron/reminders',
    cronDriveSync: '/internal/cron/drive-sync',
    cronWarm: '/internal/cron/warm',
    cronLeaderboard: '/internal/cron/leaderboard-snapshot',
  },
} as const;

/** Prefixes an API path with the versioned base, e.g. `/api/v1/library`. */
export const apiUrl = (path: string): string => `${API_PREFIX}${path}`;

/** Web application routes, used by navigation and by deep links in emails. */
export const webRoutes = {
  home: '/',
  departments: '/departments',
  department: (slug: string) => `/departments/${slug}`,
  resources: '/resources',
  roadmaps: '/roadmaps',
  roadmap: (slug: string) => `/roadmaps/${slug}`,
  about: '/about',
  contact: '/contact',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  pendingApproval: '/pending-approval',

  app: {
    dashboard: '/app',
    library: '/app/library',
    resource: (id: string) => `/app/resource/${id}`,
    resourceAtPage: (id: string, page: number) => `/app/resource/${id}?page=${page}`,
    resourceAtSecond: (id: string, second: number) => `/app/resource/${id}?t=${Math.floor(second)}`,
    quizzes: '/app/quizzes',
    quiz: (id: string) => `/app/quizzes/${id}`,
    attempt: (attemptId: string) => `/app/quizzes/attempts/${attemptId}`,
    progress: '/app/progress',
    rewards: '/app/rewards',
    leaderboard: '/app/rewards/leaderboard',
    roadmaps: '/app/roadmaps',
    bookmarks: '/app/bookmarks',
    notifications: '/app/notifications',
    settings: '/app/settings',
  },

  admin: {
    dashboard: '/admin',
    structure: '/admin/structure',
    resources: '/admin/resources',
    driveSync: '/admin/drive-sync',
    quizzes: '/admin/quizzes',
    quizEditor: (id: string) => `/admin/quizzes/${id}`,
    videos: '/admin/videos',
    roadmaps: '/admin/roadmaps',
    users: '/admin/users',
    approvals: '/admin/users/approvals',
    notifications: '/admin/notifications',
    announcements: '/admin/announcements',
    contact: '/admin/contact',
    reports: '/admin/reports',
    aiUsage: '/admin/ai-usage',
    aiReview: '/admin/ai-review',
    auditLog: '/admin/audit-log',
    settings: '/admin/settings',
  },
} as const;
