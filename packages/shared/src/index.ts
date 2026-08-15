/**
 * `@it-sum/shared` — the API contract.
 *
 * This package is the single source of truth for every payload exchanged between
 * the web app and the API. Both workspaces import from here, which is what lets
 * the two developer tracks work in parallel without drifting: a change to a shape
 * breaks compilation on whichever side has not caught up, immediately and loudly.
 *
 * Nothing here may import from `apps/*`. The dependency direction is one-way.
 */

export * from './domain/enums.js';
export * from './domain/primitives.js';

export * from './contracts/auth.js';
export * from './contracts/academics.js';
export * from './contracts/library.js';
export * from './contracts/progress.js';
export * from './contracts/quizzes.js';
export * from './contracts/rewards.js';
export * from './contracts/drive.js';
export * from './contracts/ai.js';
export * from './contracts/engagement.js';

export * from './routes.js';
export * from './utils/text.js';
