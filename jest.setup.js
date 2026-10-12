/* eslint-env jest */
import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);
jest.mock('react-native/Libraries/Animated/src/NativeAnimatedHelper');

// Swap the real Firebase SDK for the in-memory mock (see preview/mockFirebase.js).
jest.mock('./src/firebase', () => {
  const {createMockFirebase} = require('./preview/mockFirebase');
  return {__esModule: true, default: createMockFirebase({seed: false})};
});
