export default {
    testEnvironment: 'node',
    globals: {
        'ts-jest': {
        useESM: true
        }
    },
    transform: {},
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
    },
    testMatch: ['**/tests/**/*.test.js'],
    testTimeout: 10000
};