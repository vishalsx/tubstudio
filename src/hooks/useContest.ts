// src/hooks/useContest.ts
import { useState, useEffect, useCallback } from 'react';
import { Contest, ContestCreate } from '../types/contest';
import { contestService } from '../services/contest.service';
import { UserContext } from '../types';

export const useContest = (userContext: UserContext | null) => {
    const [contests, setContests] = useState<Contest[]>([]);
    const [activeContest, setActiveContest] = useState<Contest | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Initial empty contest state for creation
    const getEmptyContest = (): ContestCreate => ({
        name: { English: '' },
        description: { English: '' },
        supported_languages: ['English'],
        status: 'Draft',
        contest_type: 'Local',
        content_type: 'Generic',
        generic_theme_type: 'generic',
        registration_start_at: new Date().toISOString(),
        registration_end_at: new Date().toISOString(),
        contest_start_at: new Date().toISOString(),
        contest_end_at: new Date().toISOString(),
        grace_period_seconds: 0,
        max_participants: 100,
        eligibility_rules: {
            min_age: 0, max_age: 100, allowed_countries: [], school_required: false
        },
        game_structure: {
            level_count: 1,
            levels: [
                {
                    level_name: "Level 1",
                    level_seq: 1,
                    game_type: "matching",
                    rounds: []
                }
            ]
        },
        scoring_config: {
            base_points: 10, negative_marking: 0,
            difficulty_weights: { easy: 1, medium: 1.5, hard: 2 },
            language_weights: { native: 1, fluent: 1, learning: 1 },
            time_bonus: { enabled: false, max_bonus: 0 },
            tie_breaker_rules: []
        },
        visibility: { mode: 'public', allowed_schools: [], invite_only: false },
        rewards: { participation: { certificate: true }, rank_based: [] }
    });

    // Auto-clear errors after 4 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError(null);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const fetchContests = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Map searchQuery to status if it's not empty, otherwise list all
            const statusFilter = searchQuery.trim() || undefined;
            const data = await contestService.listContests(0, 50, statusFilter);
            setContests(data);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery]);

    // Search is now on-demand, no automatic effect


    const createNewContest = () => {
        const newContest = getEmptyContest() as Contest;
        // Set the org_id and org_code from user context if available
        if ((userContext as any)?.org_id) {
            newContest.org_id = (userContext as any).org_id;
        }
        if ((userContext as any)?.org_code) {
            newContest.org_code = (userContext as any).org_code;
        }
        setActiveContest(newContest);
        setIsDirty(true);
    };

    const selectContest = async (contest: Contest) => {
        if (!contest._id) return;

        setIsLoading(true);
        setError(null);
        try {
            const fullDetails = await contestService.fetchContestDetails(contest._id);
            setActiveContest(fullDetails);
            setIsDirty(false);
        } catch (err) {
            setError(`Failed to load contest details: ${(err as Error).message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const updateActiveContest = (updates: Partial<Contest>) => {
        if (!activeContest) return;
        setActiveContest(prev => prev ? { ...prev, ...updates } : null);
        setIsDirty(true);
    };

    const saveContest = async (action: string = 'Save') => {
        if (!activeContest) return;
        setIsLoading(true);
        try {
            if (activeContest._id) {
                const updated = await contestService.updateContest(activeContest._id, activeContest, action);
                setContests(prev => prev.map(c => c._id === updated._id ? updated : c));
                setActiveContest(updated);
            } else {
                const created = await contestService.createContest(activeContest as ContestCreate);
                setContests(prev => [...prev, created]);
                setActiveContest(created);
            }
            setIsDirty(false);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        contests,
        activeContest,
        isLoading,
        isDirty,
        error,
        searchQuery,
        setSearchQuery,
        fetchContests,
        createNewContest,
        selectContest,
        updateActiveContest,
        saveContest
    };
};
