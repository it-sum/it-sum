/**
 * Mock data entry point.
 *
 * Imported only by the web app's mock mode and by tests. It is exported from a
 * separate subpath (`@it-sum/shared/mocks`) so that fixtures can never be
 * accidentally bundled into the API or into a production client build.
 */

export * from './fixtures.js';
