import { useState, useCallback } from 'react';
import { Rep } from '../types';
import { useTimer } from './useTimer';
import { useUserPreferences } from './useUserPreferences';
import { playAlertSound } from '../utils/audio';

interface UseRepSessionOptions {
    addRep: (rep: Rep) => Promise<void>;
    selectedDate: Date;
}

function isToday(date: Date): boolean {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate();
}

export function useRepSession({ addRep, selectedDate }: UseRepSessionOptions) {
    const [currentRep, setCurrentRep] = useState<Rep | null>(null);
    const [repToReview, setRepToReview] = useState<Rep | null>(null);
    const [isRetroModalOpen, setRetroModalOpen] = useState<boolean>(false);
    const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
    const [isDeleteCurrentRepModalOpen, setDeleteCurrentRepModalOpen] = useState<boolean>(false);

    const prefs = useUserPreferences();

    const handleComplete = useCallback((completedRep: Rep) => {
        playAlertSound();
        setCurrentRep(null);
        setRepToReview({ ...completedRep, completed_at: new Date().toISOString() });
        setTimeout(() => setRetroModalOpen(true), 0);
    }, []);

    const { remainingSeconds, isPaused, startTimer, togglePause, reset } = useTimer({
        onComplete: useCallback(() => {
            if (currentRep) handleComplete({ ...currentRep, completed_at: new Date().toISOString() });
        }, [currentRep, handleComplete]),
    });

    const handleStartRep = useCallback((goal: string, minutes: number) => {
        if (!isToday(selectedDate)) {
            alert('렙 생성은 오늘 날짜에서만 가능합니다.');
            return;
        }
        const seconds = minutes * 60;
        const newRep: Rep = {
            id: Date.now(),
            goal,
            initial_seconds: seconds,
            initialSeconds: seconds, 
            completed_at: null,
        };
        setCurrentRep(newRep);
        startTimer(seconds);
    }, [selectedDate, startTimer]);

    const handleInterruptRep = useCallback(() => {
        if (!currentRep) return;
        setShowConfirmModal(true);
    }, [currentRep]);
    
    const confirmEarlyComplete = useCallback(() => {
        if (!currentRep) return; 
        playAlertSound();
        setShowConfirmModal(false);
        handleComplete(currentRep);
    }, [currentRep, handleComplete]);

    const cancelEarlyComplete = useCallback(() => setShowConfirmModal(false), []);

    const handleDeleteCurrentRepRequest = useCallback(() => setDeleteCurrentRepModalOpen(true), []);

    const confirmDeleteCurrentRep = useCallback(() => {
        setCurrentRep(null);
        reset();
        setDeleteCurrentRepModalOpen(false);
    }, [reset]);

    const cancelDeleteCurrentRep = useCallback(() => setDeleteCurrentRepModalOpen(false), []);

    const handleRetroSubmit = useCallback(async (notes: string) => {
        if (!repToReview) {setRetroModalOpen(false); return; }
        const finalRep = { ...repToReview, notes };
        await addRep(finalRep);
        const minutes = Math.floor(finalRep.initial_seconds / 60);
        prefs.save(minutes);
        setRetroModalOpen(false);
        setRepToReview(null);
    }, [repToReview, addRep, prefs]);

    return {
        currentRep,
        remainingSeconds,
        isPaused,
        lastSuccessfulRepMinutes: prefs.lastSuccessfulRepMinutes,
        handleStartRep,
        handleTogglePause: togglePause,
        handleInterruptRep,
        showConfirmModal,
        confirmEarlyComplete,
        cancelEarlyComplete,
        isDeleteCurrentRepModalOpen,
        handleDeleteCurrentRepRequest,
        confirmDeleteCurrentRep,
        cancelDeleteCurrentRep,
        isRetroModalOpen,
        repToReview,
        handleRetroSubmit,
    };
}