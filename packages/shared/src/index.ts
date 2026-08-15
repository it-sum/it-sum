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

export * from './domain/enums';
export * from './domain/primitives';

export * from './contracts/auth';
export * from './contracts/academics';
export * from './contracts/library';
export * from './contracts/progress';
export * from './contracts/quizzes';
export * from './contracts/rewards';
export * from './contracts/drive';
export * from './contracts/ai';
export * from './contracts/engagement';

export * from './routes';
export * from './utils/text';
