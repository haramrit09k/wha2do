import { iconForList, accentForList } from '../src/listStyle';
import { signUpSchema } from '../src/screens/SignUp';
import { formatTime, timeFromPick } from '../src/screens/Tasks';

describe('listStyle', () => {
  it('matches icons to list names', () => {
    expect(iconForList('Groceries')).toBe('cart-outline');
    expect(iconForList('Gym routine')).toBe('dumbbell');
    expect(iconForList('Work this week')).toBe('briefcase-outline');
    expect(iconForList('Misc')).toBe('format-list-checks');
  });

  it('gives a stable accent per name', () => {
    expect(accentForList('Groceries')).toBe(accentForList('Groceries'));
    expect(accentForList('Groceries')).toMatch(/^#[0-9A-F]{6}$/i);
  });
});

describe('signUpSchema', () => {
  const valid = {
    username: 'alex',
    email: 'alex@example.com',
    password: 'password123',
  };

  it('accepts a valid form', async () => {
    await expect(signUpSchema.isValid(valid)).resolves.toBe(true);
  });

  it.each([
    ['username', 'al'],
    ['email', 'alex@'],
    ['password', 'short'],
  ])('rejects a bad %s', async (field, value) => {
    await expect(
      signUpSchema.isValid({ ...valid, [field]: value }),
    ).resolves.toBe(false);
  });
});

describe('formatTime', () => {
  it('zero-pads hours and minutes', () => {
    expect(formatTime(new Date(2020, 0, 1, 3, 5))).toBe('03:05');
    expect(formatTime(new Date(2020, 0, 1, 14, 30))).toBe('14:30');
  });
});

describe('timeFromPick', () => {
  const when = new Date(2020, 0, 1, 7, 5);

  it('returns the chosen time when the picker is confirmed', () => {
    expect(timeFromPick({ type: 'set' }, when)).toBe('07:05');
  });

  it('ignores a cancelled picker even though it still passes a date', () => {
    expect(timeFromPick({ type: 'dismissed' }, when)).toBeNull();
    expect(timeFromPick({ type: 'neutralButtonPressed' }, when)).toBeNull();
    expect(timeFromPick({ type: 'set' }, undefined)).toBeNull();
  });
});
