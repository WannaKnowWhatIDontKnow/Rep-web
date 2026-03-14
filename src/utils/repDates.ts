import { Rep } from '../types';

export function buildRepDates(repList: Rep[]): Record<string, number> {
    const repDates: Record<string, number> = {};
    repList.forEach(rep => {
        if (!rep.completed_at) return; 
        const d = new Date(rep.completed_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        repDates[key] = (repDates[key] || 0) + Math.floor((rep.initial_seconds || 0) / 60);
    });
    return repDates;
}