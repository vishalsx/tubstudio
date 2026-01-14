// src/services/contest.service.ts
import { apiClient } from './api';
import { Contest, ContestCreate } from '../types/contest';

class ContestService {
    /**
     * Searches for contests using the search endpoint.
     */
    async searchContests(query: string = ''): Promise<Contest[]> {
        const params = new URLSearchParams();
        if (query) params.append('query', query);
        return apiClient.get(`contest/search?${params.toString()}`);
    }

    /**
     * Lists contests with pagination and status filtering.
     */
    async listContests(skip: number = 0, limit: number = 10, status?: string): Promise<Contest[]> {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (status) params.append('status', status);
        return apiClient.get(`contest/list?${params.toString()}`);
    }

    /**
     * Fetches details of a single contest.
     */
    async fetchContestDetails(contestId: string): Promise<Contest> {
        return apiClient.get(`contest/search/${contestId}`);
    }

    /**
     * Creates a new contest.
     */
    async createContest(contestData: ContestCreate): Promise<Contest> {
        return apiClient.post('contest/create', contestData);
    }

    /**
     * Updates an existing contest.
     */
    async updateContest(contestId: string, contestData: Partial<Contest>, action: string = 'Save'): Promise<Contest> {
        return apiClient.put(`contest/update/${contestId}?action=${action}`, contestData);
    }
}

export const contestService = new ContestService();
