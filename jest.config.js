module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['client-source'],
  collectCoverage: true,
  'collectCoverageFrom': [
    '**/*.{ts,tsx}',
    '!**/js_legacy*/**',
  ],
};
