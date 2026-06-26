/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@histock/shared$': '<rootDir>/../../packages/shared/src/index.ts',
  },
  // Integration suites share a single Postgres/Redis. Run serially so parallel
  // suites don't contend for DB connections (which caused intermittent timeouts).
  maxWorkers: 1,
}
