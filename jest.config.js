module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.js'],
  modulePathIgnorePatterns: [
    '<rootDir>/preview/node_modules',
    '<rootDir>/preview/dist',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/preview/',
    '<rootDir>/android/',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|react-native-vector-icons|@react-navigation)/)',
  ],
  // Firebase and AsyncStorage run against the in-memory stand-ins in preview/mock.
  moduleNameMapper: {
    '^firebase/app$': '<rootDir>/preview/mock/app.js',
    '^firebase/auth$': '<rootDir>/preview/mock/auth.js',
    '^firebase/database$': '<rootDir>/preview/mock/database.js',
    '^@react-native-async-storage/async-storage$':
      '<rootDir>/preview/stubs/async-storage.js',
  },
};
