import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTimerOptions {
    onComplete: () => void;
}

export function useTimer({ onComplete }: UseTimerOptions) {
    const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
    const [isPaused, setIsPaused] = useState<boolean>(true);
    const [endTime, setEndTime] = useState<number | null>(null);
    const lastTickRef = useRef<number>(Date.now());

    const startTimer = useCallback((seconds: number) => {
        setRemainingSeconds(seconds);
        setEndTime(Date.now() + seconds * 1000);
        setIsPaused(false);
        lastTickRef.current = Date.now();
    }, []);

    const togglePause = useCallback(() => {
        setIsPaused(prev => {
            if (prev) setEndTime(Date.now() + remainingSeconds * 1000);
            return !prev;
        });
    }, [remainingSeconds]);

    const reset = useCallback(() => {
        setRemainingSeconds(0);
        setIsPaused(true);
        setEndTime(null);
    }, []);

    useEffect(() => {
        if (isPaused || endTime === null) return;
        const timerId = setInterval(() => {
            const now = Date.now();
            const gap = now - lastTickRef.current;
            lastTickRef.current = now;
            if (gap > 3000) {
                setRemainingSeconds(Math.max(0, Math.round((endTime - now) / 1000)));
                setIsPaused(true);
                return;
            }
            const newRemaining = Math.round((endTime - Date.now()) / 1000);
            if (newRemaining <= 0) {
                clearInterval(timerId);
                setRemainingSeconds(0);
                onComplete();
            } else {
                setRemainingSeconds(newRemaining);
            }
        }, 500);
        return () => clearInterval(timerId);
    }, [isPaused, endTime, onComplete]);

    return { remainingSeconds, isPaused, startTimer, togglePause, reset };
}