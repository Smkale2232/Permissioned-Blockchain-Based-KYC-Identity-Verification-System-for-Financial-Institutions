module.exports = {
  testEnvironment: 'node',
  globalSetup: '<rootDir>/tests/globalSetup.js',
  globalTeardown: '<rootDir>/tests/globalTeardown.js',
  setupFilesAfterEnv: ['<rootDir>/tests/setupAfterEnv.js'],
  testTimeout: 30000,
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
};
