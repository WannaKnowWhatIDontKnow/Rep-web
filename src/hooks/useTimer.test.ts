import { renderHook, act } from '@testing-library/react';
import { useTimer } from './useTimer';

describe('useTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('starts paused with 0 remaining seconds', () => {
    const { result } = renderHook(() => useTimer({ onComplete: jest.fn() }));

    expect(result.current.remainingSeconds).toBe(0);
    expect(result.current.isPaused).toBe(true);
  });

  test('startTimer sets remaining seconds and begins running', () => {
    const { result } = renderHook(() => useTimer({ onComplete: jest.fn() }));

    act(() => { result.current.startTimer(60); });

    expect(result.current.remainingSeconds).toBe(60);
    expect(result.current.isPaused).toBe(false);
  });

  test('togglePause pauses a running timer', () => {
    const { result } = renderHook(() => useTimer({ onComplete: jest.fn() }));

    act(() => { result.current.startTimer(60); });
    act(() => { result.current.togglePause(); });

    expect(result.current.isPaused).toBe(true);
  });

  test('togglePause resumes a paused timer', () => {
    const { result } = renderHook(() => useTimer({ onComplete: jest.fn() }));

    act(() => { result.current.startTimer(60); });
    act(() => { result.current.togglePause(); }); // pause
    act(() => { result.current.togglePause(); }); // resume

    expect(result.current.isPaused).toBe(false);
  });

  test('reset returns the timer to its initial state', () => {
    const { result } = renderHook(() => useTimer({ onComplete: jest.fn() }));

    act(() => { result.current.startTimer(60); });
    act(() => { result.current.reset(); });

    expect(result.current.remainingSeconds).toBe(0);
    expect(result.current.isPaused).toBe(true);
  });

  test('onComplete is called when the timer reaches zero', () => {
    const onComplete = jest.fn();
    const { result } = renderHook(() => useTimer({ onComplete }));

    act(() => { result.current.startTimer(1); });
    act(() => { jest.advanceTimersByTime(1500); });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test('onComplete is not called while the timer is paused', () => {
    const onComplete = jest.fn();
    const { result } = renderHook(() => useTimer({ onComplete }));

    act(() => { result.current.startTimer(1); });
    act(() => { result.current.togglePause(); });
    act(() => { jest.advanceTimersByTime(2000); });

    expect(onComplete).not.toHaveBeenCalled();
  });
});
