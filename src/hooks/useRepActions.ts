import { useState, useCallback } from 'react';
import { Rep } from '../types';

interface UseRepActionsOptions {
    deleteRep: (id: number | string) => Promise<void>;
}

export function useRepActions({ deleteRep }: UseRepActionsOptions) {
    const [selectedRep, setSelectedRep] = useState<Rep | null>(null);
    const [isDetailModalOpen, setDetailModalOpen] = useState<boolean>(false);
    const [repToDelete, setRepToDelete] = useState<Rep | null>(null);

    const openDetail = useCallback((rep: Rep) => {
        setSelectedRep(rep);
        setDetailModalOpen(true);
    }, []);
    
    const closeDetail = useCallback(() => {
        setDetailModalOpen(false);
        setSelectedRep(null);
    }, []);

    const handleDeleteRequest = useCallback((rep: Rep) => {
        setRepToDelete(rep);
        setDetailModalOpen(false);
    }, []);

    const confirmDelete = useCallback(async () => {
        if (!repToDelete) return;
        await deleteRep(repToDelete.id);
        setRepToDelete(null);
    }, [repToDelete, deleteRep]);

    const cancelDelete = useCallback(() => setRepToDelete(null), []);

    return {
        selectedRep,
        isDetailModalOpen,
        repToDelete,
        openDetail,
        closeDetail,
        handleDeleteRequest,
        confirmDelete,
        cancelDelete,
        };
    }