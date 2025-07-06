import { renderHook, act, waitFor } from '@testing-library/react';
import { useReps } from './useReps';
import { Rep } from '../types';

// Supabase 모킹
jest.mock('../supabaseClient', () => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  single: jest.fn().mockImplementation(() => Promise.resolve({
    data: {
      id: 'mock-id-1',
      goal: '테스트 목표',
      notes: '테스트 노트',
      completed_at: '2023-01-01T12:00:00Z',
      initial_seconds: 1800,
      user_id: 'mock-user-id'
    },
    error: null
  }))
}));

// AuthContext 모킹
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'mock-user-id', email: 'test@example.com' },
    isAuthenticated: true
  })
}));

// localStorage 모킹
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// logger 모킹
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

describe('useReps 훅 테스트', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
  });

  test('초기 렌더링 시 loading 상태가 true에서 false로 변경되어야 함', async () => {
    // 비동기 데이터 로딩을 모킹
    const { result } = renderHook(() => useReps());
    
    // 초기 상태는 loading: true
    expect(result.current.loading).toBe(true);
    
    // 비동기 업데이트 대기
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  test('addRep 함수 호출 시 repList에 새로운 Rep이 추가되어야 함', async () => {
    const { result } = renderHook(() => useReps());
    
    // 초기 데이터 로딩 대기
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    const initialLength = result.current.repList.length;
    
    // 새 Rep 추가
    const newRep = {
      goal: '새로운 목표',
      notes: '새로운 노트',
      initialSeconds: 1200,
      initial_seconds: 1200,
      completed_at: null
    };
    
    await act(async () => {
      await result.current.addRep(newRep);
    });
    
    // repList 길이가 1 증가했는지 확인
    expect(result.current.repList.length).toBe(initialLength + 1);
    
    // 추가된 Rep이 첫 번째 위치에 있는지 확인
    expect(result.current.repList[0].goal).toBe('테스트 목표');
  });

  test('deleteRep 함수 호출 시 repList에서 해당 Rep이 제거되어야 함', async () => {
    const { result } = renderHook(() => useReps());
    
    // 초기 데이터 로딩 대기
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // 테스트용 Rep 추가
    await act(async () => {
      await result.current.addRep({
        goal: '삭제할 목표',
        notes: '삭제할 노트',
        initialSeconds: 600,
        initial_seconds: 600,
        completed_at: null
      });
    });
    
    const repToDelete = result.current.repList[0];
    const initialLength = result.current.repList.length;
    
    // Rep 삭제
    await act(async () => {
      await result.current.deleteRep(repToDelete.id);
    });
    
    // repList 길이가 1 감소했는지 확인
    expect(result.current.repList.length).toBe(initialLength - 1);
    
    // 삭제된 Rep이 더 이상 목록에 없는지 확인
    const deletedRep = result.current.repList.find(rep => rep.id === repToDelete.id);
    expect(deletedRep).toBeUndefined();
  });

  test('getFilteredReps 함수가 특정 날짜의 Rep만 정확히 필터링해야 함', async () => {
    const { result } = renderHook(() => useReps());
    
    // 초기 데이터 로딩 대기
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // 테스트용 Rep 데이터 설정
    const testReps: Rep[] = [
      {
        id: '1',
        goal: '오늘 목표',
        notes: '오늘 노트',
        completed_at: new Date().toISOString(),
        initial_seconds: 1800,
        initialSeconds: 1800
      },
      {
        id: '2',
        goal: '어제 목표',
        notes: '어제 노트',
        completed_at: new Date(Date.now() - 86400000).toISOString(), // 하루 전
        initial_seconds: 1500,
        initialSeconds: 1500
      },
      {
        id: '3',
        goal: '내일 목표',
        notes: '내일 노트',
        completed_at: new Date(Date.now() + 86400000).toISOString(), // 하루 후
        initial_seconds: 2000,
        initialSeconds: 2000
      }
    ];
    
    // repList 상태 강제 설정
    act(() => {
      // React 18에서는 setRepList에 직접 접근할 수 없으므로 모킹된 데이터로 작업
      // 실제 테스트에서는 이 부분을 다르게 처리해야 할 수 있음
      Object.defineProperty(result.current, 'repList', { value: testReps });
    });
    
    // 오늘 날짜로 필터링
    const today = new Date();
    const todayReps = result.current.getFilteredReps(today);
    
    // 오늘 날짜의 Rep만 필터링되었는지 확인
    expect(todayReps.length).toBe(1);
    expect(todayReps[0].goal).toBe('오늘 목표');
    
    // 어제 날짜로 필터링
    const yesterday = new Date(Date.now() - 86400000);
    const yesterdayReps = result.current.getFilteredReps(yesterday);
    
    // 어제 날짜의 Rep만 필터링되었는지 확인
    expect(yesterdayReps.length).toBe(1);
    expect(yesterdayReps[0].goal).toBe('어제 목표');
  });
});
