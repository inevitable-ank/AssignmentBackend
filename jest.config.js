module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Tests share a single database; run serially to avoid FK and unique conflicts
  maxWorkers: 1,
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/app.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 10000,
  globals: {
    'ts-jest': {
      tsconfig: {
        types: ['node', 'jest'],
      },
    },
  },
};

