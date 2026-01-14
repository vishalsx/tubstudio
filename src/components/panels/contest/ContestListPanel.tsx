// src/components/panels/contest/ContestListPanel.tsx
import React, { useState } from 'react';
import { Contest } from '../../../types/contest';
import { PlusCircleIcon, MagnifyingGlassIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../../common/LoadingSpinner';

interface ContestListPanelProps {
    contests: Contest[];
    activeContest: Contest | null;
    isLoading: boolean;
    error: string | null;
    onSelectContest: (contest: Contest) => void;
    onCreateContest: () => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onSearch: () => void; // New prop for manual search
}

export const ContestListPanel: React.FC<ContestListPanelProps> = ({
    contests,
    activeContest,
    isLoading,
    error,
    onSelectContest,
    onCreateContest,
    searchQuery,
    onSearchChange,
    onSearch
}) => {
    return (
        <div className="flex flex-col h-full">
            {/* Search & Actions */}
            <div className="mb-3 space-y-2">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <MagnifyingGlassIcon className="w-3.5 h-3.5 absolute left-2 top-2 text-[var(--text-muted)]" />
                        <input
                            type="text"
                            placeholder="Search contests..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                            className="w-full pl-7 pr-2 py-1.5 border border-[var(--border-main)] rounded-lg bg-[var(--bg-input)] text-xs focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                        />
                    </div>
                    <button
                        onClick={onSearch}
                        className="p-1.5 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 shadow-sm transition-all"
                        title="Find Contest"
                    >
                        <MagnifyingGlassIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onCreateContest}
                        className="p-1.5 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 shadow-sm transition-all"
                        title="Create New Contest"
                    >
                        <PlusCircleIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-2 bg-red-500/10 text-red-500 rounded-lg border border-red-500/20 text-xs text-center">
                    {error}
                </div>
            )}

            {/* Contest List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {isLoading && contests.length === 0 ? (
                    <div className="flex justify-center py-4">
                        <LoadingSpinner size="sm" />
                    </div>
                ) : contests.length === 0 ? (
                    <div className="text-center py-8 text-[var(--text-muted)] italic text-sm">
                        No contests found.
                    </div>
                ) : (
                    contests.map((contest) => (
                        <div
                            key={contest._id || 'new'}
                            onClick={() => onSelectContest(contest)}
                            className={`p-2 rounded-xl border cursor-pointer transition-all hover:shadow-md ${activeContest?._id === contest._id
                                ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
                                : 'border-[var(--border-main)] bg-[var(--bg-input)] hover:border-[var(--color-primary)]'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    <TrophyIcon className={`w-4 h-4 ${activeContest?._id === contest._id ? 'text-[var(--color-primary)]' : 'text-[var(--text-muted)]'}`} />
                                    <div>
                                        <h3 className="font-semibold text-xs text-[var(--text-main)]">
                                            {Object.values(contest.name)[0] || 'Untitled Contest'}
                                        </h3>
                                        <p className="text-[10px] text-[var(--text-muted)]">
                                            {contest.contest_type}
                                        </p>
                                    </div>
                                </div>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${contest.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {contest.status}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div >
    );
};
