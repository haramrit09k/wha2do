/* eslint-env jest */
// Native modules that need a stand-in under Jest.
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
