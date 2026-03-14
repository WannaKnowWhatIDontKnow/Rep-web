import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../supabaseClient';

export function useUserPreferences() {
    const { user, isAuthenticated } = useAuth();
    const [lastSuccessfulRepMinutes, setLastSuccessfulRepMinutes] = useState<number>(15);

    useEffect(() => {
        if (isAuthenticated && user) {
            const fetch = async () => {
                const { data, error } = await supabase
                    .from('users')
                    .select('last_successful_rep_minutes')
                    .eq('id', user.id);
                if (!error) setLastSuccessfulRepMinutes(data[0].last_successful_rep_minutes);
            };
            fetch();
        } else {
            const saved = localStorage.getItem('lastSuccessfulRepMinutes');
            if (saved) setLastSuccessfulRepMinutes(Number(saved));
        }
    }, [isAuthenticated, user]);

    function save(minutes: number) {
        setLastSuccessfulRepMinutes(minutes);
        try {
            localStorage.setItem('lastSuccessfulRepMinutes', String(minutes));
        } catch (e) {
            console.error('Failed to save lastSuccessfulRepMinutes:', e);
        }
    }

    return { lastSuccessfulRepMinutes, save};
}
