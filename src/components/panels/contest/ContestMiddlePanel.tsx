// src/components/panels/contest/ContestMiddlePanel.tsx
import React, { useState } from 'react';
import { Contest } from '../../../types/contest';
import { ContestGameStructureEditor } from './ContestGameStructureEditor';
import {
    CloudArrowUpIcon,
    TrophyIcon,
    CalendarIcon,
    GlobeAltIcon,
    UserGroupIcon,
    AcademicCapIcon,
    ChartBarIcon,
    LockClosedIcon,
    StarIcon,
    PaperAirplaneIcon,
    TrashIcon,
    XCircleIcon,
    ArchiveBoxIcon,
    PauseCircleIcon,
    PlayCircleIcon
} from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { UserContext } from '../../../types';

interface ContestMiddlePanelProps {
    contest: Contest | null;
    isDirty: boolean;
    onUpdate: (updates: Partial<Contest>) => void;
    onSave: (action?: string) => void;
    isLoading: boolean;
    error: string | null;
    userContext: UserContext | null;
}

// Helper to safely get display name for a language (now just returns the name as is)
const getLanguageDisplayName = (name: string): string => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

// Convert UTC ISO string to local datetime-local format (YYYY-MM-DDTHH:mm)
const toLocalDateTimeString = (isoString: string): string => {
    if (!isoString) return '';

    // If the string doesn't end with Z and doesn't contain a + or - for timezone, append Z
    // to ensure it's treated as UTC rather than local time.
    let normalizedIso = isoString;
    if (!isoString.endsWith('Z') && !isoString.includes('+') && !isoString.match(/-\d{2}:\d{2}$/)) {
        normalizedIso = isoString + 'Z';
    }

    const date = new Date(normalizedIso);
    if (isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Convert local datetime-local value to UTC ISO string
const toUTCISOString = (localDateTimeString: string): string => {
    return new Date(localDateTimeString).toISOString();
};

export const ContestMiddlePanel: React.FC<ContestMiddlePanelProps> = ({
    contest,
    isDirty,
    onUpdate,
    onSave,
    isLoading,
    error,
    userContext
}) => {
    // Initialize with the first allowed language or English
    const [activeLanguageTab, setActiveLanguageTab] = useState(
        userContext?.languages_allowed?.[0] || 'English'
    );
    const [activeConfigTab, setActiveConfigTab] = useState('Schedule');
    const [isMatchingScoringExpanded, setIsMatchingScoringExpanded] = useState(true);
    const [isQuizScoringExpanded, setIsQuizScoringExpanded] = useState(true);

    const canEdit = !contest || !contest._id || contest.status === 'Draft';

    if (!contest) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] italic">
                <TrophyIcon className="w-16 h-16 mb-4 opacity-20" />
                Select or create a contest to edit details.
            </div>
        );
    }

    const allowedLanguages = userContext?.languages_allowed || ['English'];

    // Only show tabs for languages that are in supported_languages
    const activeLanguageTabs = contest.supported_languages.filter(lang =>
        allowedLanguages.includes(lang)
    );

    const handleChange = (field: keyof Contest, value: any) => {
        onUpdate({ [field]: value });
    };

    const handleNameChange = (lang: string, value: string) => {
        onUpdate({ name: { ...contest.name, [lang]: value } });
    };

    const handleDescriptionChange = (lang: string, value: string) => {
        onUpdate({ description: { ...contest.description, [lang]: value } });
    };

    const handleLanguageToggle = (langName: string) => {
        const currentLanguages = contest.supported_languages;

        if (currentLanguages.includes(langName)) {
            // Remove language if already selected
            const updated = currentLanguages.filter(l => l !== langName);
            if (updated.length > 0) { // Ensure at least one language
                // Explicitly remove from name and description objects
                const newName = { ...contest.name };
                const newDesc = { ...contest.description };
                delete newName[langName];
                delete newDesc[langName];

                onUpdate({
                    supported_languages: updated,
                    name: newName,
                    description: newDesc
                });

                // If active tab was removed, switch to first available
                if (activeLanguageTab === langName && updated.length > 0) {
                    setActiveLanguageTab(updated[0]);
                }
            }
        } else {
            // Add language
            onUpdate({ supported_languages: [...currentLanguages, langName] });
        }
    };
    const handleEligibilityChange = (field: string, value: any) => {
        onUpdate({ eligibility_rules: { ...contest.eligibility_rules, [field]: value } });
    };

    const handleScoringChange = (updates: any) => {
        onUpdate({ scoring_config: { ...contest.scoring_config, ...updates } });
    };

    const handleVisibilityChange = (updates: any) => {
        onUpdate({ visibility: { ...contest.visibility, ...updates } });
    };

    const handleRewardsChange = (updates: any) => {
        onUpdate({ rewards: { ...contest.rewards, ...updates } });
    };

    const configTabs = [
        { id: 'Schedule', label: 'Schedule & Participants', icon: CalendarIcon },
        { id: 'Eligibility', label: 'Eligibility Rules', icon: UserGroupIcon },
        { id: 'Rounds', label: 'Game Structure', icon: TrophyIcon },
        { id: 'Scoring', label: 'Scoring Config', icon: ChartBarIcon },
        { id: 'Visibility', label: 'Visibility', icon: LockClosedIcon },
        { id: 'Rewards', label: 'Rewards', icon: StarIcon },
    ];
    return (
        <div className="flex flex-col h-full bg-[var(--bg-panel)] rounded-lg shadow-sm p-3 overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex justify-between items-start mb-2 border-b border-[var(--border-main)] pb-1.5">
                <div>
                    <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                        <TrophyIcon className="w-6 h-6 text-[var(--color-primary)]" />
                        Contest Details
                    </h2>
                    <p className="text-sm text-[var(--text-muted)] mt-0.5">Manage core contest information</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Status Badge */}
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${contest.status === 'Published' ? 'bg-green-500/10 border-green-500/20 text-green-600' :
                        contest.status === 'Draft' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' :
                            contest.status === 'Cancelled' ? 'bg-red-500/10 border-red-500/20 text-red-600' :
                                contest.status === 'Active' ? 'bg-blue-500/10 border-blue-500/20 text-blue-600' :
                                    'bg-gray-500/10 border-gray-500/20 text-gray-600'
                        }`}>
                        {contest.status.toUpperCase()}
                    </span>

                    <div className="h-6 w-px bg-[var(--border-main)] mx-1" />

                    <div className="flex items-center gap-1.5">
                        {/* Save Button */}
                        <button
                            onClick={() => onSave('Save')}
                            disabled={isLoading || !(!contest._id || contest.status === 'Draft')}
                            className="p-1.5 rounded-lg border border-[var(--border-main)] hover:bg-[var(--bg-panel)] transition-all disabled:opacity-30 disabled:cursor-not-allowed group relative"
                            title="Save Changes"
                        >
                            <CloudArrowUpIcon className="w-4 h-4 text-emerald-500" />
                            <span className="sr-only">Save</span>
                        </button>

                        {/* Publish Button */}
                        <button
                            onClick={() => onSave('Publish')}
                            disabled={isLoading || contest.status !== 'Draft'}
                            className="p-1.5 rounded-lg border border-[var(--border-main)] hover:bg-[var(--bg-panel)] transition-all disabled:opacity-30 disabled:cursor-not-allowed group relative"
                            title="Publish Contest"
                        >
                            <PaperAirplaneIcon className="w-4 h-4 text-blue-500" />
                            <span className="sr-only">Publish</span>
                        </button>

                        {/* Delete Button */}
                        <button
                            onClick={() => { if (confirm('Are you sure you want to delete this contest?')) { onSave('Delete'); } }}
                            disabled={isLoading || !(contest.status === 'Draft' || contest.status === 'Cancelled')}
                            className="p-1.5 rounded-lg border border-[var(--border-main)] hover:bg-[var(--bg-panel)] transition-all disabled:opacity-30 disabled:cursor-not-allowed group relative"
                            title="Delete Contest"
                        >
                            <TrashIcon className="w-4 h-4 text-red-500" />
                            <span className="sr-only">Delete</span>
                        </button>

                        {/* Cancel Button */}
                        <button
                            onClick={() => onSave('Cancel')}
                            disabled={isLoading || contest.status !== 'Published'}
                            className="p-1.5 rounded-lg border border-[var(--border-main)] hover:bg-[var(--bg-panel)] transition-all disabled:opacity-30 disabled:cursor-not-allowed group relative"
                            title="Cancel Contest"
                        >
                            <XCircleIcon className="w-4 h-4 text-orange-500" />
                            <span className="sr-only">Cancel</span>
                        </button>

                        {/* Archive Button */}
                        <button
                            onClick={() => onSave('Archive')}
                            disabled={isLoading || contest.status !== 'Completed'}
                            className="p-1.5 rounded-lg border border-[var(--border-main)] hover:bg-[var(--bg-panel)] transition-all disabled:opacity-30 disabled:cursor-not-allowed group relative"
                            title="Archive Contest"
                        >
                            <ArchiveBoxIcon className="w-4 h-4 text-purple-500" />
                            <span className="sr-only">Archive</span>
                        </button>

                        {/* Hold/Unhold Button */}
                        <button
                            onClick={() => onSave(contest.status === 'Hold' ? 'Active' : 'Hold')}
                            disabled={isLoading || !(contest.status === 'Active' || contest.status === 'Hold')}
                            className="p-1.5 rounded-lg border border-[var(--border-main)] hover:bg-[var(--bg-panel)] transition-all disabled:opacity-30 disabled:cursor-not-allowed group relative"
                            title={contest.status === 'Hold' ? "Unhold Contest" : "Hold Contest"}
                        >
                            {contest.status === 'Hold' ? (
                                <PlayCircleIcon className="w-4 h-4 text-green-500" />
                            ) : (
                                <PauseCircleIcon className="w-4 h-4 text-blue-400" />
                            )}
                            <span className="sr-only">{contest.status === 'Hold' ? "Unhold" : "Hold"}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-3 p-2 bg-red-500/10 text-red-500 rounded-lg border border-red-500/20 text-sm">
                    <p className="flex items-center gap-2">
                        <strong className="font-bold">Error:</strong> {error}
                    </p>
                </div>
            )}

            {/* Form Fields */}
            <div className="space-y-2">
                {/* Supported Languages - FIRST FIELD */}
                <div className="bg-[var(--bg-input)]/30 p-2 rounded-lg border border-[var(--border-main)]">
                    <h3 className="text-xs font-bold text-[var(--text-main)] mb-1.5 flex items-center gap-2">
                        <GlobeAltIcon className="w-4 h-4 text-blue-500" /> Supported Languages *
                    </h3>

                    {/* Dropdown to add languages */}
                    <div className="mb-2">
                        <select
                            value=""
                            onChange={(e) => {
                                if (e.target.value) {
                                    handleLanguageToggle(e.target.value);
                                }
                            }}
                            disabled={!canEdit}
                            className={`w-full p-2 text-sm border border-[var(--border-main)] rounded-lg bg-[var(--bg-panel)] focus:ring-2 focus:ring-[var(--color-primary)]/50 ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <option value="">Select a language to add...</option>
                            {allowedLanguages
                                .filter(lang => !contest.supported_languages.includes(lang))
                                .map(langName => (
                                    <option key={langName} value={langName}>
                                        {langName}
                                    </option>
                                ))
                            }
                        </select>
                    </div>

                    {/* Selected languages as removable cards */}
                    {contest.supported_languages.length > 0 && (
                        <div>
                            <label className="block text-xs text-[var(--text-muted)] mb-2">Selected Languages ({contest.supported_languages.length})</label>
                            <div className="flex flex-wrap gap-2">
                                {contest.supported_languages.map(langName => (
                                    <div
                                        key={langName}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-primary-light)] border border-[var(--color-primary)] text-[var(--color-primary)] rounded-full text-sm font-medium"
                                    >
                                        <span>{langName}</span>
                                        {contest.supported_languages.length > 1 && canEdit && (
                                            <button
                                                onClick={() => handleLanguageToggle(langName)}
                                                className="hover:bg-[var(--color-primary)]/20 rounded-full p-0.5 transition-colors"
                                                title="Remove language"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}


                </div>

                {/* Multilingual Title & Description - Only for selected languages */}
                {activeLanguageTabs.length > 0 && (
                    <div className="bg-[var(--bg-input)]/30 p-2 rounded-lg border border-[var(--border-main)]">
                        <h3 className="text-xs font-bold text-[var(--text-main)] mb-1.5 flex items-center gap-2">
                            <GlobeAltIcon className="w-4 h-4 text-blue-500" /> Contest Content
                        </h3>

                        {/* Language Tabs */}
                        <div className="flex gap-2 mb-2 flex-wrap">
                            {activeLanguageTabs.map(lang => (
                                <button
                                    key={lang}
                                    onClick={() => setActiveLanguageTab(lang)}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${activeLanguageTab === lang
                                        ? 'bg-[var(--color-primary)] text-white'
                                        : 'bg-[var(--bg-input)] text-[var(--text-muted)] hover:bg-[var(--color-primary-light)]'
                                        }`}
                                >
                                    {lang}
                                </button>
                            ))}
                        </div>

                        {/* Name Input for Active Language */}
                        <div className="mb-2">
                            <label className="block text-sm font-medium text-[var(--text-main)] mb-1">
                                Contest Name ({activeLanguageTab}) *
                            </label>
                            <input
                                type="text"
                                value={contest.name[activeLanguageTab] || ''}
                                onChange={(e) => handleNameChange(activeLanguageTab, e.target.value)}
                                className="w-full p-1.5 border border-[var(--border-main)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)]/50 bg-[var(--bg-input)] disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder={`e.g. Summer Reading Challenge 2025`}
                                disabled={!canEdit}
                            />
                        </div>

                        {/* Description Input for Active Language */}
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-main)] mb-1">
                                Description ({activeLanguageTab})
                            </label>
                            <textarea
                                rows={1}
                                value={contest.description[activeLanguageTab] || ''}
                                onChange={(e) => handleDescriptionChange(activeLanguageTab, e.target.value)}
                                className="w-full p-1.5 border border-[var(--border-main)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)]/50 bg-[var(--bg-input)] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder={`Describe the contest...`}
                                disabled={!canEdit}
                            />
                        </div>
                    </div>
                )}

                {/* Contest Type & Content Type - GROUPED */}
                <div className="bg-[var(--bg-input)]/30 p-2 rounded-lg border border-[var(--border-main)]">
                    <h3 className="text-xs font-bold text-[var(--text-main)] mb-1.5 flex items-center gap-2">
                        <AcademicCapIcon className="w-4 h-4 text-purple-500" /> Contest Configuration
                    </h3>
                    <div className="grid grid-cols-2 gap-3 mb-2">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-main)] mb-1">Contest Scope *</label>
                            <select
                                value={contest.contest_type}
                                onChange={(e) => handleChange('contest_type', e.target.value)}
                                className="w-full p-2 border border-[var(--border-main)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)]/50 bg-[var(--bg-input)]"
                            >
                                <option value="Local">Local</option>
                                <option value="Global">Global</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-main)] mb-1">Contest Theme *</label>
                            <select
                                value={contest.content_type || 'Generic'}
                                onChange={(e) => handleChange('content_type', e.target.value)}
                                className="w-full p-2 border border-[var(--border-main)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)]/50 bg-[var(--bg-input)]"
                            >
                                <option value="Generic">Generic</option>
                                <option value="Specialized">Specialized</option>
                            </select>
                        </div>
                    </div>

                    {/* Conditional fields based on content type */}
                    {contest.content_type === 'Specialized' && (
                        <div className="mb-2">
                            <label className="block text-sm font-medium text-[var(--text-main)] mb-1">Specialized Theme</label>
                            <input
                                type="text"
                                value={contest.specialized_theme || ''}
                                onChange={(e) => handleChange('specialized_theme', e.target.value)}
                                className="w-full p-2 border border-[var(--border-main)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)]/50 bg-[var(--bg-input)] disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder="e.g. Test cognitive abilities (Requires new content creation)"
                                disabled={!canEdit}
                            />
                        </div>
                    )}

                    {contest.content_type === 'Generic' && (
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-[var(--text-main)] mb-1">Theme selection</label>
                            <div className="flex flex-wrap gap-4 mb-3">
                                <div className="flex items-center gap-2">
                                    <input
                                        id="theme-generic"
                                        type="radio"
                                        name="generic_theme_type_group"
                                        value="generic"
                                        checked={(contest.generic_theme_type || 'generic') === 'generic'}
                                        onChange={(e) => handleChange('generic_theme_type', e.target.value)}
                                        disabled={!canEdit || contest.content_type !== 'Generic'}
                                        className="w-4 h-4 text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer disabled:cursor-not-allowed"
                                    />
                                    <label
                                        htmlFor="theme-generic"
                                        className={`text-sm text-[var(--text-main)] cursor-pointer ${(contest.content_type !== 'Generic' || !canEdit) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        Generic Theme
                                    </label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        id="theme-category"
                                        type="radio"
                                        name="generic_theme_type_group"
                                        value="category"
                                        checked={contest.generic_theme_type === 'category'}
                                        onChange={(e) => handleChange('generic_theme_type', e.target.value)}
                                        disabled={!canEdit || contest.content_type !== 'Generic'}
                                        className="w-4 h-4 text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer disabled:cursor-not-allowed"
                                    />
                                    <label
                                        htmlFor="theme-category"
                                        className={`text-sm text-[var(--text-main)] cursor-pointer ${(contest.content_type !== 'Generic' || !canEdit) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        Category
                                    </label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        id="theme-fos"
                                        type="radio"
                                        name="generic_theme_type_group"
                                        value="field_of_study"
                                        checked={contest.generic_theme_type === 'field_of_study'}
                                        onChange={(e) => handleChange('generic_theme_type', e.target.value)}
                                        disabled={!canEdit || contest.content_type !== 'Generic'}
                                        className="w-4 h-4 text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer disabled:cursor-not-allowed"
                                    />
                                    <label
                                        htmlFor="theme-fos"
                                        className={`text-sm text-[var(--text-main)] cursor-pointer ${(contest.content_type !== 'Generic' || !canEdit) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        Field of Study
                                    </label>
                                </div>
                            </div>

                            <div>
                                <input
                                    type="text"
                                    value={contest.areas_of_interest?.join(', ') || ''}
                                    onChange={(e) => handleChange('areas_of_interest', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                    className="w-full p-2 border border-[var(--border-main)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)]/50 bg-[var(--bg-input)] disabled:opacity-50 disabled:cursor-not-allowed"
                                    placeholder={
                                        contest.generic_theme_type === 'category' ? "Math, Science, Animals" :
                                            contest.generic_theme_type === 'field_of_study' ? "Biology, Physics, World War II" :
                                                "General Interest Tags"
                                    }
                                    disabled={!canEdit}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* --- CONFIGURATION TABS --- */}
                <div className="mt-2">
                    <div className="flex border-b border-[var(--border-main)] mb-2 overflow-x-auto custom-scrollbar whitespace-nowrap">
                        {configTabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveConfigTab(tab.id)}
                                className={`flex items-center gap-2 px-3 py-2 text-xs font-bold transition-all border-b-2 ${activeConfigTab === tab.id
                                    ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary-light)]'
                                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-input)]/50'
                                    }`}
                            >
                                <tab.icon className="w-3.5 h-3.5" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="min-h-[300px]">
                        {/* Schedule & Participants */}
                        {activeConfigTab === 'Schedule' && (
                            <div className="bg-[var(--bg-input)]/30 p-2.5 rounded-xl border border-[var(--border-main)] animate-fadeIn">
                                <h3 className="text-sm font-bold text-[var(--text-main)] mb-2 flex items-center gap-2">
                                    <CalendarIcon className="w-4 h-4 text-blue-500" /> Schedule and Participants
                                </h3>

                                {canEdit && (
                                    <div className="mb-2 p-2 bg-[var(--bg-panel)] rounded-lg border border-[var(--border-main)]">
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const now = new Date();
                                                    const regEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                                                    const contestStart = new Date(regEnd.getTime() + 1 * 60 * 60 * 1000);
                                                    const contestEnd = new Date(contestStart.getTime() + 7 * 24 * 60 * 60 * 1000);
                                                    onUpdate({
                                                        registration_start_at: now.toISOString(),
                                                        registration_end_at: regEnd.toISOString(),
                                                        contest_start_at: contestStart.toISOString(),
                                                        contest_end_at: contestEnd.toISOString()
                                                    });
                                                }}
                                                className="px-3 py-1.5 text-xs font-medium bg-[var(--bg-input)] hover:bg-[var(--color-primary-light)] border border-[var(--border-main)] hover:border-[var(--color-primary)] rounded-md transition-all"
                                            >
                                                📅 1 Week Contest
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const now = new Date();
                                                    const regEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                                                    const contestStart = new Date(regEnd.getTime() + 1 * 60 * 60 * 1000);
                                                    const contestEnd = new Date(contestStart.getTime() + 30 * 24 * 60 * 60 * 1000);
                                                    onUpdate({
                                                        registration_start_at: now.toISOString(),
                                                        registration_end_at: regEnd.toISOString(),
                                                        contest_start_at: contestStart.toISOString(),
                                                        contest_end_at: contestEnd.toISOString()
                                                    });
                                                }}
                                                className="px-3 py-1.5 text-xs font-medium bg-[var(--bg-input)] hover:bg-[var(--color-primary-light)] border border-[var(--border-main)] hover:border-[var(--color-primary)] rounded-md transition-all"
                                            >
                                                📅 1 Month Contest
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const tomorrow = new Date();
                                                    tomorrow.setDate(tomorrow.getDate() + 1);
                                                    tomorrow.setHours(9, 0, 0, 0);
                                                    const regEnd = new Date(tomorrow.getTime() - 1 * 60 * 60 * 1000);
                                                    const contestEnd = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
                                                    onUpdate({
                                                        registration_start_at: new Date().toISOString(),
                                                        registration_end_at: regEnd.toISOString(),
                                                        contest_start_at: tomorrow.toISOString(),
                                                        contest_end_at: contestEnd.toISOString()
                                                    });
                                                }}
                                                className="px-3 py-1.5 text-xs font-medium bg-[var(--bg-input)] hover:bg-[var(--color-primary-light)] border border-[var(--border-main)] hover:border-[var(--color-primary)] rounded-md transition-all"
                                            >
                                                🚀 Start Tomorrow 9 AM
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="block text-xs font-medium text-[var(--text-main)]">Registration Start *</label>
                                                {canEdit && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleChange('registration_start_at', new Date().toISOString())}
                                                        className="text-[9px] px-2 py-0.5 bg-[var(--color-primary-light)] text-[var(--color-primary)] rounded hover:bg-[var(--color-primary)] hover:text-white transition-all"
                                                    >
                                                        Now
                                                    </button>
                                                )}
                                            </div>
                                            <input
                                                type="datetime-local"
                                                value={toLocalDateTimeString(contest.registration_start_at)}
                                                onChange={(e) => handleChange('registration_start_at', toUTCISOString(e.target.value))}
                                                className="w-full p-2 border border-[var(--border-main)] rounded-lg bg-[var(--bg-panel)] focus:ring-2 focus:ring-[var(--color-primary)]/50 transition-all text-sm"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="block text-xs font-medium text-[var(--text-main)]">Contest Start *</label>
                                                {canEdit && (
                                                    <div className="flex gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const tomorrow = new Date();
                                                                tomorrow.setDate(tomorrow.getDate() + 1);
                                                                handleChange('contest_start_at', tomorrow.toISOString());
                                                            }}
                                                            className="text-[9px] px-2 py-0.5 bg-[var(--color-primary-light)] text-[var(--color-primary)] rounded hover:bg-[var(--color-primary)] hover:text-white transition-all"
                                                        >
                                                            +1d
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const nextWeek = new Date();
                                                                nextWeek.setDate(nextWeek.getDate() + 7);
                                                                handleChange('contest_start_at', nextWeek.toISOString());
                                                            }}
                                                            className="text-[9px] px-2 py-0.5 bg-[var(--color-primary-light)] text-[var(--color-primary)] rounded hover:bg-[var(--color-primary)] hover:text-white transition-all"
                                                        >
                                                            +1w
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <input
                                                type="datetime-local"
                                                value={toLocalDateTimeString(contest.contest_start_at)}
                                                onChange={(e) => handleChange('contest_start_at', toUTCISOString(e.target.value))}
                                                className="w-full p-2 border border-[var(--border-main)] rounded-lg bg-[var(--bg-panel)] focus:ring-2 focus:ring-[var(--color-primary)]/50 transition-all text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-[var(--text-main)] mb-1">Max Participants</label>
                                            <input
                                                type="number"
                                                value={contest.max_participants}
                                                onChange={(e) => handleChange('max_participants', parseInt(e.target.value) || 0)}
                                                className="w-full p-2 border border-[var(--border-main)] rounded-lg bg-[var(--bg-panel)] focus:ring-2 focus:ring-[var(--color-primary)]/50 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                placeholder="e.g. 1000 (0 for unlimited)"
                                                disabled={!canEdit}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="block text-xs font-medium text-[var(--text-main)]">Registration End *</label>
                                                {canEdit && (
                                                    <div className="flex gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const nextWeek = new Date();
                                                                nextWeek.setDate(nextWeek.getDate() + 7);
                                                                handleChange('registration_end_at', nextWeek.toISOString());
                                                            }}
                                                            className="text-[9px] px-2 py-0.5 bg-[var(--color-primary-light)] text-[var(--color-primary)] rounded hover:bg-[var(--color-primary)] hover:text-white transition-all"
                                                        >
                                                            +1w
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const nextMonth = new Date();
                                                                nextMonth.setMonth(nextMonth.getMonth() + 1);
                                                                handleChange('registration_end_at', nextMonth.toISOString());
                                                            }}
                                                            className="text-[9px] px-2 py-0.5 bg-[var(--color-primary-light)] text-[var(--color-primary)] rounded hover:bg-[var(--color-primary)] hover:text-white transition-all"
                                                        >
                                                            +1m
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <input
                                                type="datetime-local"
                                                value={toLocalDateTimeString(contest.registration_end_at)}
                                                onChange={(e) => handleChange('registration_end_at', toUTCISOString(e.target.value))}
                                                className="w-full p-2 border border-[var(--border-main)] rounded-lg bg-[var(--bg-panel)] focus:ring-2 focus:ring-[var(--color-primary)]/50 transition-all text-sm"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="block text-xs font-medium text-[var(--text-main)]">Contest End *</label>
                                                {canEdit && (
                                                    <div className="flex gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const nextWeek = new Date(new Date(contest.contest_start_at).getTime() + 7 * 24 * 60 * 60 * 1000);
                                                                handleChange('contest_end_at', nextWeek.toISOString());
                                                            }}
                                                            className="text-[9px] px-2 py-0.5 bg-[var(--color-primary-light)] text-[var(--color-primary)] rounded hover:bg-[var(--color-primary)] hover:text-white transition-all"
                                                        >
                                                            +1w
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const nextMonth = new Date(new Date(contest.contest_start_at).getTime() + 30 * 24 * 60 * 60 * 1000);
                                                                handleChange('contest_end_at', nextMonth.toISOString());
                                                            }}
                                                            className="text-[9px] px-2 py-0.5 bg-[var(--color-primary-light)] text-[var(--color-primary)] rounded hover:bg-[var(--color-primary)] hover:text-white transition-all"
                                                        >
                                                            +1m
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <input
                                                type="datetime-local"
                                                value={toLocalDateTimeString(contest.contest_end_at)}
                                                onChange={(e) => handleChange('contest_end_at', toUTCISOString(e.target.value))}
                                                className="w-full p-2 border border-[var(--border-main)] rounded-lg bg-[var(--bg-panel)] focus:ring-2 focus:ring-[var(--color-primary)]/50 transition-all text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-[var(--text-main)] mb-1">Grace Period (seconds)</label>
                                            <input
                                                type="number"
                                                value={contest.grace_period_seconds}
                                                onChange={(e) => handleChange('grace_period_seconds', parseInt(e.target.value) || 0)}
                                                className="w-full p-2 border border-[var(--border-main)] rounded-lg bg-[var(--bg-panel)] focus:ring-2 focus:ring-[var(--color-primary)]/50 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                placeholder="e.g. 300"
                                                disabled={!canEdit}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Eligibility Rules */}
                        {activeConfigTab === 'Eligibility' && (
                            <div className="bg-[var(--bg-input)]/30 p-2.5 rounded-xl border border-[var(--border-main)] animate-fadeIn">
                                <h3 className="text-sm font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
                                    <UserGroupIcon className="w-4 h-4 text-emerald-500" /> Eligibility Rules
                                </h3>

                                {/* Top Row: Age Range and Max Incomplete Attempts */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--text-main)] mb-2">Age Range</label>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1">
                                                <span className="text-xs text-[var(--text-muted)] block mb-1">Min Age</span>
                                                <input
                                                    type="number"
                                                    value={contest.eligibility_rules.min_age}
                                                    onChange={(e) => handleEligibilityChange('min_age', parseInt(e.target.value) || 0)}
                                                    className="w-full p-2.5 border border-[var(--border-main)] rounded-lg bg-[var(--bg-panel)] focus:ring-2 focus:ring-[var(--color-primary)]/50 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                    disabled={!canEdit}
                                                />
                                            </div>
                                            <div className="text-[var(--text-muted)] pt-5">to</div>
                                            <div className="flex-1">
                                                <span className="text-xs text-[var(--text-muted)] block mb-1">Max Age</span>
                                                <input
                                                    type="number"
                                                    value={contest.eligibility_rules.max_age}
                                                    onChange={(e) => handleEligibilityChange('max_age', parseInt(e.target.value) || 0)}
                                                    className="w-full p-2.5 border border-[var(--border-main)] rounded-lg bg-[var(--bg-panel)] focus:ring-2 focus:ring-[var(--color-primary)]/50 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                    disabled={!canEdit}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-[var(--text-main)] mb-1">Max Incomplete Attempts</label>
                                        <p className="text-[10px] text-[var(--text-muted)] mb-2 italic">Number of times a participant can exit and resume the contest (0-10)</p>
                                        <input
                                            type="number"
                                            min={0}
                                            max={10}
                                            value={contest.max_incomplete_attempts}
                                            onChange={(e) => handleChange('max_incomplete_attempts', Math.max(0, Math.min(10, parseInt(e.target.value) || 3)))}
                                            className="w-full p-2.5 border border-[var(--border-main)] rounded-lg bg-[var(--bg-panel)] focus:ring-2 focus:ring-[var(--color-primary)]/50 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                            placeholder="e.g. 3"
                                            disabled={!canEdit}
                                        />
                                    </div>
                                </div>

                                {/* Bottom Row: Organisation Required and Allowed Countries */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--text-main)] mb-1">Participation Requirements</label>
                                        <p className="text-[10px] text-[var(--text-muted)] mb-2 italic">Participants must be affiliated with an organisation</p>
                                        <label className="flex items-center space-x-2 cursor-pointer p-2.5 bg-[var(--bg-panel)] rounded-lg border border-[var(--border-main)] hover:border-[var(--color-primary)] transition-all">
                                            <input
                                                type="checkbox"
                                                checked={contest.eligibility_rules.school_required}
                                                onChange={(e) => handleEligibilityChange('school_required', e.target.checked)}
                                                className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] disabled:opacity-50"
                                                disabled={!canEdit}
                                            />
                                            <span className="block text-xs font-bold text-[var(--text-main)]">Organisations Required</span>
                                        </label>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-[var(--text-main)] mb-1">Allowed Countries</label>
                                        <p className="text-[10px] text-[var(--text-muted)] mb-2 italic">Enter country separated by commas. Leave empty for global access.</p>
                                        <textarea
                                            rows={1}
                                            value={contest.eligibility_rules.allowed_countries.join(', ')}
                                            onChange={(e) => handleEligibilityChange('allowed_countries', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                            className="w-full p-2.5 border border-[var(--border-main)] rounded-lg bg-[var(--bg-panel)] focus:ring-2 focus:ring-[var(--color-primary)]/50 transition-all text-sm font-mono disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                                            placeholder="USA, India, ..."
                                            disabled={!canEdit}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Game Structure */}
                        {activeConfigTab === 'Rounds' && (
                            <div className="bg-[var(--bg-input)]/30 p-2.5 rounded-xl border border-[var(--border-main)] animate-fadeIn">
                                <h3 className="text-sm font-bold text-[var(--text-main)] mb-2 flex items-center gap-2">
                                    <TrophyIcon className="w-4 h-4 text-purple-500" /> Game Structure
                                </h3>

                                <ContestGameStructureEditor
                                    gameStructure={contest.game_structure}
                                    onUpdate={(newStructure) => onUpdate({ game_structure: newStructure })}
                                    readOnly={!canEdit}
                                />
                            </div>
                        )}

                        {/* Scoring Configuration */}
                        {activeConfigTab === 'Scoring' && (
                            <div className="bg-[var(--bg-input)]/30 p-2.5 rounded-xl border border-[var(--border-main)] animate-fadeIn space-y-4">
                                <h3 className="text-sm font-bold text-[var(--text-main)] mb-2 flex items-center gap-2">
                                    <ChartBarIcon className="w-4 h-4 text-blue-500" /> Scoring Configuration
                                </h3>

                                {/* Matching Mode Scoring */}
                                <div className="bg-[var(--bg-panel)] rounded-xl border border-[var(--border-main)] overflow-hidden">
                                    <button
                                        onClick={() => setIsMatchingScoringExpanded(!isMatchingScoringExpanded)}
                                        className="w-full flex items-center justify-between p-3 hover:bg-[var(--bg-input)]/50 transition-colors"
                                    >
                                        <h4 className="text-sm font-bold flex items-center gap-2 text-[var(--text-main)]">
                                            <span className="w-6 h-6 flex items-center justify-center bg-blue-500/10 text-blue-500 rounded text-xs">🧩</span>
                                            Matching Mode
                                        </h4>
                                        <svg
                                            className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${isMatchingScoringExpanded ? 'rotate-180' : ''}`}
                                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {isMatchingScoringExpanded && (
                                        <div className="p-3 pt-0 animate-fadeIn">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pt-3 border-t border-[var(--border-main)]/50">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Base Points</label>
                                                    <input
                                                        type="number"
                                                        value={contest.scoring_config.matching.base_points}
                                                        onChange={(e) => handleScoringChange({
                                                            matching: { ...contest.scoring_config.matching, base_points: parseInt(e.target.value) || 0 }
                                                        })}
                                                        className="w-full p-2 border border-[var(--border-main)] rounded bg-[var(--bg-input)] text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Negative Marking</label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        value={contest.scoring_config.matching.negative_marking}
                                                        onChange={(e) => handleScoringChange({
                                                            matching: { ...contest.scoring_config.matching, negative_marking: parseFloat(e.target.value) || 0 }
                                                        })}
                                                        className={`w-full p-2 border rounded bg-[var(--bg-input)] text-sm ${contest.scoring_config.matching.negative_marking >= contest.scoring_config.matching.base_points || contest.scoring_config.matching.negative_marking < 0 ? 'border-red-500' : 'border-[var(--border-main)]'}`}
                                                    />
                                                    {contest.scoring_config.matching.negative_marking >= contest.scoring_config.matching.base_points && (
                                                        <p className="text-[9px] text-red-500 mt-1">Must be less than base points</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Time Bonus (per sec)</label>
                                                    <input
                                                        type="number"
                                                        value={contest.scoring_config.matching.time_bonus}
                                                        onChange={(e) => handleScoringChange({
                                                            matching: { ...contest.scoring_config.matching, time_bonus: parseInt(e.target.value) || 0 }
                                                        })}
                                                        className="w-full p-2 border border-[var(--border-main)] rounded bg-[var(--bg-input)] text-sm"
                                                    />
                                                </div>
                                            </div>

                                            {/* Language Weights for Matching */}
                                            <div className="pt-3 border-t border-[var(--border-main)]">
                                                <h5 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Language Multipliers</h5>
                                                <div className="max-h-[200px] overflow-y-auto custom-scrollbar border border-[var(--border-main)] rounded-lg">
                                                    <table className="w-full text-left text-xs">
                                                        <thead className="sticky top-0 bg-[var(--bg-input)] text-[var(--text-muted)] border-b border-[var(--border-main)]">
                                                            <tr>
                                                                <th className="px-3 py-2 font-bold uppercase tracking-tight">Language</th>
                                                                <th className="px-3 py-2 font-bold uppercase tracking-tight w-24">Weight</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-[var(--border-main)]/50">
                                                            {contest.supported_languages.map(lang => (
                                                                <tr key={`matching-${lang}`} className="hover:bg-[var(--bg-input)]/30 transition-colors">
                                                                    <td className="px-3 py-2 text-[var(--text-main)] font-medium">{lang}</td>
                                                                    <td className="px-3 py-2">
                                                                        <input
                                                                            type="number"
                                                                            step="0.1"
                                                                            value={contest.scoring_config.matching.language_weights?.[lang] ?? 1.0}
                                                                            onChange={(e) => handleScoringChange({
                                                                                matching: {
                                                                                    ...contest.scoring_config.matching,
                                                                                    language_weights: {
                                                                                        ...(contest.scoring_config.matching.language_weights || {}),
                                                                                        [lang]: parseFloat(e.target.value) || 1.0
                                                                                    }
                                                                                }
                                                                            })}
                                                                            className="w-full p-1 text-xs border border-[var(--border-main)] rounded bg-[var(--bg-panel)] text-center"
                                                                        />
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                    {contest.supported_languages.length === 0 && (
                                                        <div className="p-4 text-center">
                                                            <p className="text-[10px] italic text-[var(--text-muted)]">No languages selected</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Quiz Mode Scoring */}
                                <div className="bg-[var(--bg-panel)] rounded-xl border border-[var(--border-main)] overflow-hidden">
                                    <button
                                        onClick={() => setIsQuizScoringExpanded(!isQuizScoringExpanded)}
                                        className="w-full flex items-center justify-between p-3 hover:bg-[var(--bg-input)]/50 transition-colors"
                                    >
                                        <h4 className="text-sm font-bold flex items-center gap-2 text-[var(--text-main)]">
                                            <span className="w-6 h-6 flex items-center justify-center bg-purple-500/10 text-purple-500 rounded text-xs">❓</span>
                                            Quiz Mode
                                        </h4>
                                        <svg
                                            className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${isQuizScoringExpanded ? 'rotate-180' : ''}`}
                                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {isQuizScoringExpanded && (
                                        <div className="p-3 pt-0 animate-fadeIn">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pt-3 border-t border-[var(--border-main)]/50">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Base Points</label>
                                                    <input
                                                        type="number"
                                                        value={contest.scoring_config.quiz.base_points}
                                                        onChange={(e) => handleScoringChange({
                                                            quiz: { ...contest.scoring_config.quiz, base_points: parseInt(e.target.value) || 0 }
                                                        })}
                                                        className="w-full p-2 border border-[var(--border-main)] rounded bg-[var(--bg-input)] text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Negative Marking</label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        value={contest.scoring_config.quiz.negative_marking}
                                                        onChange={(e) => handleScoringChange({
                                                            quiz: { ...contest.scoring_config.quiz, negative_marking: parseFloat(e.target.value) || 0 }
                                                        })}
                                                        className={`w-full p-2 border rounded bg-[var(--bg-input)] text-sm ${contest.scoring_config.quiz.negative_marking >= contest.scoring_config.quiz.base_points || contest.scoring_config.quiz.negative_marking < 0 ? 'border-red-500' : 'border-[var(--border-main)]'}`}
                                                    />
                                                    {contest.scoring_config.quiz.negative_marking >= contest.scoring_config.quiz.base_points && (
                                                        <p className="text-[9px] text-red-500 mt-1">Must be less than base points</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Time Bonus (per sec)</label>
                                                    <input
                                                        type="number"
                                                        value={contest.scoring_config.quiz.time_bonus}
                                                        onChange={(e) => handleScoringChange({
                                                            quiz: { ...contest.scoring_config.quiz, time_bonus: parseInt(e.target.value) || 0 }
                                                        })}
                                                        className="w-full p-2 border border-[var(--border-main)] rounded bg-[var(--bg-input)] text-sm"
                                                    />
                                                </div>
                                            </div>

                                            {/* Difficulty Weights for Quiz */}
                                            <div className="mb-4 pt-3 border-t border-[var(--border-main)]">
                                                <h5 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Difficulty Multipliers</h5>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                    {['low', 'medium', 'high', 'very_high'].map(level => (
                                                        <div key={`quiz-diff-${level}`} className="flex flex-col gap-1 bg-[var(--bg-input)] p-2 rounded-lg border border-[var(--border-main)]">
                                                            <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase text-center">{level.replace('_', ' ')}</span>
                                                            <input
                                                                type="number"
                                                                step="0.1"
                                                                value={(contest.scoring_config.quiz.difficulty_weights as any)[level]}
                                                                onChange={(e) => handleScoringChange({
                                                                    quiz: {
                                                                        ...contest.scoring_config.quiz,
                                                                        difficulty_weights: {
                                                                            ...contest.scoring_config.quiz.difficulty_weights,
                                                                            [level]: parseFloat(e.target.value) || 1.0
                                                                        }
                                                                    }
                                                                })}
                                                                className="w-full p-1.5 text-xs border border-[var(--border-main)] rounded bg-[var(--bg-panel)] text-center"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Language Weights for Quiz */}
                                            <div className="pt-3 border-t border-[var(--border-main)]">
                                                <h5 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Language Multipliers</h5>
                                                <div className="max-h-[200px] overflow-y-auto custom-scrollbar border border-[var(--border-main)] rounded-lg">
                                                    <table className="w-full text-left text-xs">
                                                        <thead className="sticky top-0 bg-[var(--bg-input)] text-[var(--text-muted)] border-b border-[var(--border-main)]">
                                                            <tr>
                                                                <th className="px-3 py-2 font-bold uppercase tracking-tight">Language</th>
                                                                <th className="px-3 py-2 font-bold uppercase tracking-tight w-24">Weight</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-[var(--border-main)]/50">
                                                            {contest.supported_languages.map(lang => (
                                                                <tr key={`quiz-${lang}`} className="hover:bg-[var(--bg-input)]/30 transition-colors">
                                                                    <td className="px-3 py-2 text-[var(--text-main)] font-medium">{lang}</td>
                                                                    <td className="px-3 py-2">
                                                                        <input
                                                                            type="number"
                                                                            step="0.1"
                                                                            value={contest.scoring_config.quiz.language_weights?.[lang] ?? 1.0}
                                                                            onChange={(e) => handleScoringChange({
                                                                                quiz: {
                                                                                    ...contest.scoring_config.quiz,
                                                                                    language_weights: {
                                                                                        ...(contest.scoring_config.quiz.language_weights || {}),
                                                                                        [lang]: parseFloat(e.target.value) || 1.0
                                                                                    }
                                                                                }
                                                                            })}
                                                                            className="w-full p-1 text-xs border border-[var(--border-main)] rounded bg-[var(--bg-panel)] text-center"
                                                                        />
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                    {contest.supported_languages.length === 0 && (
                                                        <div className="p-4 text-center">
                                                            <p className="text-[10px] italic text-[var(--text-muted)]">No languages selected</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Visibility Configuration */}
                        {activeConfigTab === 'Visibility' && (
                            <div className="bg-[var(--bg-input)]/30 p-2.5 rounded-xl border border-[var(--border-main)] animate-fadeIn">
                                <h3 className="text-sm font-bold text-[var(--text-main)] mb-2 flex items-center gap-2">
                                    <LockClosedIcon className="w-4 h-4 text-slate-500" /> Visibility & Access
                                </h3>
                                <div className="space-y-2">
                                    <div>
                                        <label className="block text-xs font-medium mb-2">Visibility Mode</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { id: 'public', label: 'Public', desc: 'Open to all', icon: '🌐' },
                                                { id: 'private', label: 'Private', desc: 'Direct link', icon: '🔒' },
                                                { id: 'invite_only', label: 'Invite', desc: 'Code req.', icon: '✉️' }
                                            ].map(mode => (
                                                <button
                                                    key={mode.id}
                                                    onClick={() => handleVisibilityChange({ mode: mode.id })}
                                                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all text-center ${contest.visibility.mode === mode.id
                                                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
                                                        : 'border-[var(--border-main)] bg-[var(--bg-panel)] hover:border-[var(--color-primary)]/50'
                                                        }`}
                                                >
                                                    <span className="text-lg">{mode.icon}</span>
                                                    <div>
                                                        <span className="block font-bold text-[10px] text-[var(--text-main)] uppercase tracking-tight">{mode.label}</span>
                                                        <span className="text-[9px] text-[var(--text-muted)] leading-tight">{mode.desc}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-[var(--border-main)]/50">
                                        <label className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer w-full max-w-xs ${contest.visibility.invite_only
                                            ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
                                            : 'border-[var(--border-main)] bg-[var(--bg-panel)] hover:border-[var(--color-primary)]/50'
                                            }`}>
                                            <input
                                                type="checkbox"
                                                checked={contest.visibility.invite_only}
                                                onChange={(e) => handleVisibilityChange({ invite_only: e.target.checked })}
                                                className="w-3.5 h-3.5 rounded text-[var(--color-primary)]"
                                            />
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-xs text-[var(--text-main)]">Force Invite Only</span>
                                                <span className="text-[10px] text-[var(--text-muted)] border-l border-[var(--border-main)] pl-2">Requires unique entry code</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Rewards Configuration */}
                        {activeConfigTab === 'Rewards' && (
                            <div className="bg-[var(--bg-input)]/30 p-2.5 rounded-xl border border-[var(--border-main)] animate-fadeIn">
                                <h3 className="text-sm font-bold text-[var(--text-main)] mb-2 flex items-center gap-2">
                                    <StarIcon className="w-4 h-4 text-amber-500" /> Rewards & Recognition
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <div className="p-3 bg-[var(--bg-panel)] rounded-xl border border-[var(--border-main)] transition-all hover:shadow-md">
                                            <label className="flex items-center space-x-2 cursor-pointer mb-3">
                                                <input
                                                    type="checkbox"
                                                    checked={contest.rewards.participation.certificate}
                                                    onChange={(e) => handleRewardsChange({
                                                        participation: { ...contest.rewards.participation, certificate: e.target.checked }
                                                    })}
                                                    className="w-4 h-4 rounded text-[var(--color-primary)]"
                                                />
                                                <div>
                                                    <span className="block text-xs font-bold text-[var(--text-main)]">Participation Certificate</span>
                                                    <span className="text-[10px] text-[var(--text-muted)]">Auto-generate PDF certificate for all contestants</span>
                                                </div>
                                            </label>
                                            <div>
                                                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Completion Badge</label>
                                                <input
                                                    type="text"
                                                    value={contest.rewards.participation.badge || ''}
                                                    onChange={(e) => handleRewardsChange({
                                                        participation: { ...contest.rewards.participation, badge: e.target.value || null }
                                                    })}
                                                    className="w-full p-2 border border-[var(--border-main)] rounded-lg bg-[var(--bg-panel)] text-sm"
                                                    placeholder="Badge ID (e.g. participation_2025)"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-[var(--text-main)]">Rank-based Rewards</h4>
                                        <div className="p-4 border-2 border-dashed border-[var(--border-main)] rounded-xl flex flex-col items-center justify-center text-[var(--text-muted)] text-center">
                                            <TrophyIcon className="w-6 h-6 opacity-20 mb-2" />
                                            <p className="text-[10px] font-medium leading-tight">Rank reward distribution editor coming soon</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>


            </div>
        </div>
    );
};

