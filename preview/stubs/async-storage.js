// The real package is native-only; the preview never reaches the persistence code.
export default {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};
