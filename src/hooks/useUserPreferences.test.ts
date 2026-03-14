import { renderHook, act, waitFor } from '@testing-library/react';
import { useUserPreferences } from './useUserPreferences';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock supabase
jest.mock('../supabaseClient', () => ({
  __esModule: true,
  default: {
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({
          data: [{ last_successful_rep_minutes: 25 }],
          error: null,
        }),
      }),
    }),
  },
}));

// Auth mock — swapped per describe block
const mockUseAuth = { user: null as any, isAuthenticated: false };
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth,
}));

describe('useUserPreferences — guest user', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    mockUseAuth.user = null;
    mockUseAuth.isAuthenticated = false;
  });

  test('defaults to 15 minutes when localStorage is empty', () => {
    const { result } = renderHook(() => useUserPreferences());
    expect(result.current.lastSuccessfulRepMinutes).toBe(15);
  });

  test('loads from localStorage when a value is saved', async () => {
    mockLocalStorage.getItem.mockReturnValueOnce('20');
    const { result } = renderHook(() => useUserPreferences());

    await waitFor(() => {
      expect(result.current.lastSuccessfulRepMinutes).toBe(20);
    });
  });

  test('save updates state and writes to localStorage', () => {
    const { result } = renderHook(() => useUserPreferences());

    act(() => { result.current.save(30); });

    expect(result.current.lastSuccessfulRepMinutes).toBe(30);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('lastSuccessfulRepMinutes', '30');
  });
});

describe('useUserPreferences — authenticated user', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    mockUseAuth.user = { id: 'mock-user-id', email: 'test@example.com' };
    mockUseAuth.isAuthenticated = true;
  });

  test('loads last_successful_rep_minutes from the database', async () => {
    const { result } = renderHook(() => useUserPreferences());

    await waitFor(() => {
      expect(result.current.lastSuccessfulRepMinutes).toBe(25);
    });
  });
});
