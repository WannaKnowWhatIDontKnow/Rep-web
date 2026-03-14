import { renderHook, act } from '@testing-library/react';
import { useRepActions } from './useRepActions';
import { Rep } from '../types';

const mockRep: Rep = {
  id: 1,
  goal: 'Test goal',
  initial_seconds: 1800,
  completed_at: '2024-01-01T12:00:00Z',
};

describe('useRepActions', () => {
  test('starts with everything empty and closed', () => {
    const { result } = renderHook(() => useRepActions({ deleteRep: jest.fn() }));

    expect(result.current.selectedRep).toBeNull();
    expect(result.current.isDetailModalOpen).toBe(false);
    expect(result.current.repToDelete).toBeNull();
  });

  test('openDetail sets the rep and opens the modal', () => {
    const { result } = renderHook(() => useRepActions({ deleteRep: jest.fn() }));

    act(() => { result.current.openDetail(mockRep); });

    expect(result.current.selectedRep).toEqual(mockRep);
    expect(result.current.isDetailModalOpen).toBe(true);
  });

  test('closeDetail clears the rep and closes the modal', () => {
    const { result } = renderHook(() => useRepActions({ deleteRep: jest.fn() }));

    act(() => { result.current.openDetail(mockRep); });
    act(() => { result.current.closeDetail(); });

    expect(result.current.selectedRep).toBeNull();
    expect(result.current.isDetailModalOpen).toBe(false);
  });

  test('handleDeleteRequest queues the rep for deletion and closes the detail modal', () => {
    const { result } = renderHook(() => useRepActions({ deleteRep: jest.fn() }));

    act(() => { result.current.openDetail(mockRep); });
    act(() => { result.current.handleDeleteRequest(mockRep); });

    expect(result.current.repToDelete).toEqual(mockRep);
    expect(result.current.isDetailModalOpen).toBe(false);
  });

  test('confirmDelete calls deleteRep with the correct id and clears repToDelete', async () => {
    const mockDeleteRep = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useRepActions({ deleteRep: mockDeleteRep }));

    act(() => { result.current.handleDeleteRequest(mockRep); });
    await act(async () => { await result.current.confirmDelete(); });

    expect(mockDeleteRep).toHaveBeenCalledWith(mockRep.id);
    expect(result.current.repToDelete).toBeNull();
  });

  test('cancelDelete clears repToDelete without deleting', () => {
    const mockDeleteRep = jest.fn();
    const { result } = renderHook(() => useRepActions({ deleteRep: mockDeleteRep }));

    act(() => { result.current.handleDeleteRequest(mockRep); });
    act(() => { result.current.cancelDelete(); });

    expect(result.current.repToDelete).toBeNull();
    expect(mockDeleteRep).not.toHaveBeenCalled();
  });
});
