import { listen, newKey, notify, setAt } from './store';

export const getDatabase = () => ({});

export const ref = (_db, path = '') => ({ path });
export const child = (parent, sub) => ({ path: `${parent.path}/${sub}` });

export const set = (r, value) => {
  setAt(r.path, value);
  notify(r.path);
  return Promise.resolve();
};
export const remove = r => set(r, null);
export const push = (r, value) => {
  const key = newKey();
  setAt(`${r.path}/${key}`, value);
  notify(r.path);
  return Promise.resolve({ key });
};
export const onValue = (r, fn) => listen(r.path, fn);
