// Use the official in-memory AsyncStorage mock so persistence helpers can be
// tested without a native module.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)
