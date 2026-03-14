import { buildRepDates } from './repDates';
import { Rep } from '../types';

describe('buildRepDates', () => {
  test('returns empty object for an empty list', () => {
    expect(buildRepDates([])).toEqual({});
  });

  test('skips reps that have no completed_at', () => {
    const reps: Rep[] = [
      { id: 1, goal: 'unfinished', initial_seconds: 1800, completed_at: null },
    ];
    expect(buildRepDates(reps)).toEqual({});
  });

  test('converts seconds to minutes for a single rep', () => {
    const reps: Rep[] = [
      { id: 1, goal: 'test', initial_seconds: 1800, completed_at: '2024-03-05T10:00:00Z' },
    ];
    expect(buildRepDates(reps)['2024-03-05']).toBe(30);
  });

  test('accumulates minutes for multiple reps on the same date', () => {
    const date = new Date();
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const localIso = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0, 0).toISOString();
    const localIso2 = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 14, 0, 0).toISOString();
    const reps: Rep[] = [
      { id: 1, goal: 'morning', initial_seconds: 900, completed_at: localIso },
      { id: 2, goal: 'evening', initial_seconds: 1800, completed_at: localIso2 },
    ];
    expect(buildRepDates(reps)[key]).toBe(45);
  });

  test('keeps reps on different dates separate', () => {
    const reps: Rep[] = [
      { id: 1, goal: 'monday', initial_seconds: 1800, completed_at: '2024-03-04T10:00:00Z' },
      { id: 2, goal: 'tuesday', initial_seconds: 1800, completed_at: '2024-03-05T10:00:00Z' },
    ];
    const result = buildRepDates(reps);
    expect(result['2024-03-04']).toBe(30);
    expect(result['2024-03-05']).toBe(30);
  });

  test('floors partial minutes (e.g. 90 seconds = 1 minute)', () => {
    const reps: Rep[] = [
      { id: 1, goal: 'short', initial_seconds: 90, completed_at: '2024-03-05T10:00:00Z' },
    ];
    expect(buildRepDates(reps)['2024-03-05']).toBe(1);
  });
});
