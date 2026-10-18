import { getAt } from '../preview/mock/store';
import {
  signUp,
  signIn,
  signOut,
  authErrorMessage,
  addList,
  subscribeLists,
  addTask,
  subscribeTasks,
  setTaskDone,
  removeTask,
  removeList,
  deleteAccount,
  onProfileUpdated,
} from '../src/api';

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe('auth', () => {
  it('tells the UI when the display name has been saved', async () => {
    const seen = jest.fn();
    const stop = onProfileUpdated(seen);
    await signUp({
      username: 'pat',
      email: 'pat@example.com',
      password: 'correct-horse',
      phone: '5550000000',
    });
    expect(seen).toHaveBeenCalledTimes(1);
    stop();
    await signOut();
  });

  it('signs a user up, stores a profile and never stores the password', async () => {
    const user = await signUp({
      username: 'sam',
      email: 'sam@example.com',
      password: 'hunter2hunter2',
      phone: '5551234567',
    });
    expect(user.displayName).toBe('sam');

    const profile = getAt(`users/${user.uid}/profile`);
    expect(profile).toEqual({
      username: 'sam',
      email: 'sam@example.com',
      phone: '5551234567',
    });
    expect(JSON.stringify(profile)).not.toMatch(/hunter2/);
  });

  it('rejects duplicates and bad credentials with friendly messages', async () => {
    await signOut();
    await expect(
      signUp({
        username: 'sam',
        email: 'sam@example.com',
        password: 'x',
        phone: '1',
      }),
    ).rejects.toMatchObject({ code: 'auth/email-already-in-use' });
    await expect(signIn('sam@example.com', 'nope')).rejects.toMatchObject({
      code: 'auth/wrong-password',
    });
    await expect(signIn('ghost@example.com', 'nope')).rejects.toMatchObject({
      code: 'auth/user-not-found',
    });
    expect(authErrorMessage({ code: 'auth/wrong-password' })).toMatch(
      /incorrect/i,
    );
    expect(authErrorMessage(new Error('boom'))).toMatch(/went wrong/i);
  });
});

describe('lists and tasks', () => {
  it('creates, completes, deletes tasks and removes a list with its tasks', async () => {
    const uid = 'u1';
    let lists = [];
    const stopLists = subscribeLists(uid, l => (lists = l));
    await addList(uid, 'Groceries');
    await flush();
    expect(lists.map(l => l.name)).toEqual(['Groceries']);

    const listId = lists[0].id;
    let tasks = [];
    const stopTasks = subscribeTasks(uid, listId, t => (tasks = t));
    await addTask(uid, listId, { name: 'Milk', time: '09:30' });
    await addTask(uid, listId, { name: 'Eggs' });
    await flush();
    expect(tasks.map(t => t.name).sort()).toEqual(['Eggs', 'Milk']);
    expect(tasks.every(t => t.done === false)).toBe(true);

    const milk = tasks.find(t => t.name === 'Milk');
    await setTaskDone(uid, listId, milk.id, true);
    await flush();
    expect(tasks.find(t => t.name === 'Milk').done).toBe(true);

    await removeTask(uid, listId, milk.id);
    await flush();
    expect(tasks.map(t => t.name)).toEqual(['Eggs']);

    await removeList(uid, listId);
    await flush();
    expect(lists).toEqual([]);
    expect(tasks).toEqual([]);
    stopLists();
    stopTasks();
  });
});

describe('account deletion', () => {
  it('removes the user data and the account', async () => {
    const user = await signUp({
      username: 'gone',
      email: 'gone@example.com',
      password: 'bye-bye-bye',
      phone: '5551111111',
    });
    await addList(user.uid, 'Temp');
    await deleteAccount(user);
    expect(getAt(`users/${user.uid}`)).toBeUndefined();
    await expect(
      signIn('gone@example.com', 'bye-bye-bye'),
    ).rejects.toMatchObject({
      code: 'auth/user-not-found',
    });
  });
});
