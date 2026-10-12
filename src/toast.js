// Tiny cross-platform toast: components call toast('message'), <ToastHost />
// (mounted once in App.js) renders it. Replaces Android-only ToastAndroid.
let listener = null;

export const toast = message => {
  if (listener) {
    listener(message);
  }
};

export const subscribeToast = fn => {
  listener = fn;
  return () => {
    if (listener === fn) {
      listener = null;
    }
  };
};
