/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@freshin10/utils$': '<rootDir>/../../packages/utils/src/index.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
};
