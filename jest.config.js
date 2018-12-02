module.exports = {
  testEnvironment: 'node',
  roots: ['client-source'],
  moduleFileExtensions: ['js', 'jsx', 'json', 'ts', 'tsx'],
  testMatch: [
    '**/?(*.)+(spec|test).ts?(x)',
  ],
  collectCoverage: false,
  'collectCoverageFrom': [
    '**/*.{ts,tsx}',
    '!**/js_legacy*/**',
  ],
  'globals': {
    'NODE_ENV': 'test',
  },
  'transform': {
    '^.+\\.ts$': 'babel-jest',
  },
};
