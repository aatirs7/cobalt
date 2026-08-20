// AsyncStorage is a native module, so it needs its official mock under Jest.
// Without it any test that touches a persisted store fails at import time.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
