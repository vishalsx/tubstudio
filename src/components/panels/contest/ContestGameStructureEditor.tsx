import React, { useState } from 'react';
import { GameStructure, LevelStructure, RoundStructure } from '../../../types/contest';
import {
    PlusIcon,
    TrashIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    ClockIcon,
    QuestionMarkCircleIcon,
    AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';

interface ContestGameStructureEditorProps {
    gameStructure: GameStructure;
    onUpdate: (structure: GameStructure) => void;
    readOnly?: boolean;
}

export const ContestGameStructureEditor: React.FC<ContestGameStructureEditorProps> = ({
    gameStructure,
    onUpdate,
    readOnly = false
}) => {
    // Determine the next level sequence number
    const getNextLevelSeq = () => {
        const maxSeq = gameStructure.levels.reduce((max, lvl) => Math.max(max, lvl.level_seq), 0);
        return maxSeq + 1;
    };

    const addLevel = () => {
        const newLevel: LevelStructure = {
            level_name: `Level ${getNextLevelSeq()}`,
            level_seq: getNextLevelSeq(),
            game_type: 'matching',
            rounds: []
        };
        const updatedLevels = [...gameStructure.levels, newLevel];
        onUpdate({
            ...gameStructure,
            levels: updatedLevels,
            level_count: updatedLevels.length
        });
    };

    const removeLevel = (index: number) => {
        if (confirm('Are you sure you want to remove this level?')) {
            const updatedLevels = gameStructure.levels.filter((_, i) => i !== index);
            onUpdate({
                ...gameStructure,
                levels: updatedLevels,
                level_count: updatedLevels.length
            });
        }
    };

    const updateLevel = (index: number, updates: Partial<LevelStructure>) => {
        const updatedLevels = [...gameStructure.levels];
        updatedLevels[index] = { ...updatedLevels[index], ...updates };
        onUpdate({
            ...gameStructure,
            levels: updatedLevels
        });
    };

    // --- Round Management ---

    const getNextRoundSeq = (level: LevelStructure) => {
        const maxSeq = level.rounds.reduce((max, rnd) => Math.max(max, rnd.round_seq), 0);
        return maxSeq + 1;
    };

    const addRound = (levelIndex: number) => {
        const level = gameStructure.levels[levelIndex];
        const newRound: RoundStructure = {
            round_name: `Round ${getNextRoundSeq(level)}`,
            round_seq: getNextRoundSeq(level),
            time_limit_seconds: 60,
            question_count: 5,
            difficulty_distribution: {
                low: 3,
                medium: 2,
                high: 0,
                very_high: 0
            }
        };
        const updatedLevels = [...gameStructure.levels];
        updatedLevels[levelIndex] = {
            ...level,
            rounds: [...level.rounds, newRound]
        };
        onUpdate({ ...gameStructure, levels: updatedLevels });
    };

    const removeRound = (levelIndex: number, roundIndex: number) => {
        const updatedLevels = [...gameStructure.levels];
        updatedLevels[levelIndex].rounds = updatedLevels[levelIndex].rounds.filter((_, i) => i !== roundIndex);
        onUpdate({ ...gameStructure, levels: updatedLevels });
    };

    const updateRound = (levelIndex: number, roundIndex: number, updates: Partial<RoundStructure>) => {
        const updatedLevels = [...gameStructure.levels];
        const round = updatedLevels[levelIndex].rounds[roundIndex];
        updatedLevels[levelIndex].rounds[roundIndex] = { ...round, ...updates };
        onUpdate({ ...gameStructure, levels: updatedLevels });
    };

    const updateRoundDistribution = (levelIndex: number, roundIndex: number, difficulty: 'low' | 'medium' | 'high' | 'very_high', value: number) => {
        const updatedLevels = [...gameStructure.levels];
        const round = updatedLevels[levelIndex].rounds[roundIndex];
        const newDistribution = { ...round.difficulty_distribution, [difficulty]: value };

        // Also update question count to match sum? Or just warn?
        // Let's just update distribution for now, keeping it flexible.
        // Ideally question_count should match sum of distribution.

        updatedLevels[levelIndex].rounds[roundIndex] = {
            ...round,
            difficulty_distribution: newDistribution
        };
        onUpdate({ ...gameStructure, levels: updatedLevels });
    };

    return (
        <div className="space-y-4">
            {gameStructure.levels.map((level, lIdx) => (
                <LevelEditor
                    key={lIdx}
                    level={level}
                    levelIndex={lIdx}
                    onUpdateLevel={updateLevel}
                    onRemoveLevel={removeLevel}
                    onAddRound={addRound}
                    onUpdateRound={updateRound}
                    onRemoveRound={removeRound}
                    onUpdateRoundDistribution={updateRoundDistribution}
                    readOnly={readOnly}
                />
            ))}

            {!readOnly && (
                <button
                    onClick={addLevel}
                    className="w-full py-2.5 border-2 border-dashed border-[var(--border-main)] rounded-xl flex items-center justify-center gap-2 text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all group"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">Add Level</span>
                </button>
            )}
        </div>
    );
};

// Sub-component for Level Editor
const LevelEditor: React.FC<{
    level: LevelStructure;
    levelIndex: number;
    onUpdateLevel: (index: number, updates: Partial<LevelStructure>) => void;
    onRemoveLevel: (index: number) => void;
    onAddRound: (levelIndex: number) => void;
    onUpdateRound: (levelIndex: number, roundIndex: number, updates: Partial<RoundStructure>) => void;
    onRemoveRound: (levelIndex: number, roundIndex: number) => void;
    onUpdateRoundDistribution: (lIdx: number, rIdx: number, diff: 'low' | 'medium' | 'high' | 'very_high', val: number) => void;
    readOnly: boolean;
}> = ({ level, levelIndex, onUpdateLevel, onRemoveLevel, onAddRound, onUpdateRound, onRemoveRound, onUpdateRoundDistribution, readOnly }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="bg-[var(--bg-input)]/30 border border-[var(--border-main)] rounded-xl overflow-hidden transition-all duration-200">
            {/* Level Header */}
            <div className={`p-3 bg-[var(--bg-panel)] border-b border-[var(--border-main)] flex items-center gap-3 ${!isExpanded && 'border-b-0'}`}>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-1 rounded hover:bg-[var(--bg-input)] text-[var(--text-muted)] transition-colors"
                >
                    {isExpanded ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
                </button>

                <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2">
                    <input
                        type="text"
                        value={level.level_name}
                        onChange={(e) => onUpdateLevel(levelIndex, { level_name: e.target.value })}
                        className="font-bold text-sm bg-transparent border border-transparent hover:border-[var(--border-main)] focus:border-[var(--color-primary)] rounded px-2 py-1 text-[var(--text-main)] w-full md:w-auto focus:bg-[var(--bg-input)] transition-all disabled:opacity-70 disabled:hover:border-transparent"
                        placeholder="Level Name"
                        disabled={readOnly}
                    />

                    <div className="flex items-center gap-2 ml-auto md:ml-0">
                        <select
                            value={level.game_type}
                            onChange={(e) => onUpdateLevel(levelIndex, { game_type: e.target.value as 'matching' | 'quiz' })}
                            className="text-xs bg-[var(--bg-input)] border border-[var(--border-main)] rounded-md px-2 py-1 text-[var(--text-main)] focus:ring-1 focus:ring-[var(--color-primary)] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                            disabled={readOnly}
                        >
                            <option value="matching">Matching</option>
                            <option value="quiz">Quiz</option>
                        </select>
                        <span className="text-[10px] text-[var(--text-muted)] px-2 border-l border-[var(--border-main)]">
                            {level.rounds.length} Rounds
                        </span>
                    </div>
                </div>

                {!readOnly && (
                    <button
                        onClick={() => onRemoveLevel(levelIndex)}
                        className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Remove Level"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Level Content */}
            {isExpanded && (
                <div className="p-3 space-y-3">
                    {level.rounds.map((round, rIdx) => (
                        <RoundEditor
                            key={rIdx}
                            round={round}
                            roundIndex={rIdx}
                            levelIndex={levelIndex}
                            onUpdateRound={onUpdateRound}
                            onRemoveRound={onRemoveRound}
                            onUpdateDistribution={onUpdateRoundDistribution}
                            readOnly={readOnly}
                            gameType={level.game_type}
                        />
                    ))}

                    {!readOnly && (
                        <button
                            onClick={() => onAddRound(levelIndex)}
                            className="w-full py-2 border border-dashed border-[var(--border-main)] rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all flex items-center justify-center gap-1.5"
                        >
                            <PlusIcon className="w-3.5 h-3.5" />
                            Add Round
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

// Sub-component for Round Editor
const RoundEditor: React.FC<{
    round: RoundStructure;
    roundIndex: number;
    levelIndex: number;
    onUpdateRound: (lIdx: number, rIdx: number, updates: Partial<RoundStructure>) => void;
    onRemoveRound: (lIdx: number, rIdx: number) => void;
    onUpdateDistribution: (lIdx: number, rIdx: number, diff: 'low' | 'medium' | 'high' | 'very_high', val: number) => void;
    readOnly: boolean;
    gameType: 'matching' | 'quiz';
}> = ({ round, roundIndex, levelIndex, onUpdateRound, onRemoveRound, onUpdateDistribution, readOnly, gameType }) => {
    // Check if distribution matches total questions
    const totalDist = round.difficulty_distribution.low + round.difficulty_distribution.medium + round.difficulty_distribution.high + round.difficulty_distribution.very_high;
    const isDistMismatch = totalDist !== round.question_count;

    return (
        <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-lg p-3 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-6 h-6 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center text-xs font-bold">
                    {round.round_seq}
                </div>
                <input
                    type="text"
                    value={round.round_name}
                    onChange={(e) => onUpdateRound(levelIndex, roundIndex, { round_name: e.target.value })}
                    className="flex-1 text-sm font-medium bg-transparent border-b border-transparent hover:border-[var(--border-main)] focus:border-[var(--color-primary)] text-[var(--text-main)] px-1 transition-all disabled:opacity-70 disabled:hover:border-transparent"
                    placeholder="Round Name"
                    disabled={readOnly}
                />
                {!readOnly && (
                    <button
                        onClick={() => onRemoveRound(levelIndex, roundIndex)}
                        className="text-[var(--text-muted)] hover:text-red-500 transition-colors"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Basic Settings */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-[var(--text-muted)] flex items-center gap-1.5">
                            <ClockIcon className="w-3.5 h-3.5" /> Time (sec)
                        </label>
                        <input
                            type="number"
                            value={round.time_limit_seconds}
                            onChange={(e) => onUpdateRound(levelIndex, roundIndex, { time_limit_seconds: parseInt(e.target.value) || 0 })}
                            className="w-16 p-1 bg-[var(--bg-input)] border border-[var(--border-main)] rounded text-right focus:ring-1 focus:ring-[var(--color-primary)] disabled:opacity-50"
                            disabled={readOnly}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="text-[var(--text-muted)] flex items-center gap-1.5">
                            <QuestionMarkCircleIcon className="w-3.5 h-3.5" /> {gameType === 'matching' ? 'Hints' : 'Questions'}
                        </label>
                        <input
                            type="number"
                            value={round.question_count}
                            onChange={(e) => onUpdateRound(levelIndex, roundIndex, { question_count: parseInt(e.target.value) || 0 })}
                            className={`w-16 p-1 bg-[var(--bg-input)] border rounded text-right focus:ring-1 focus:ring-[var(--color-primary)] disabled:opacity-50 ${isDistMismatch ? 'border-amber-400 text-amber-600' : 'border-[var(--border-main)]'
                                }`}
                            disabled={readOnly}
                        />
                    </div>
                    {gameType === 'quiz' && (
                        <div className="flex items-center justify-between">
                            <label className="text-[var(--text-muted)] flex items-center gap-1.5">
                                <QuestionMarkCircleIcon className="w-3.5 h-3.5" /> Objects
                            </label>
                            <input
                                type="number"
                                value={round.object_count || 0}
                                onChange={(e) => onUpdateRound(levelIndex, roundIndex, { object_count: parseInt(e.target.value) || 0 })}
                                className="w-16 p-1 bg-[var(--bg-input)] border border-[var(--border-main)] rounded text-right focus:ring-1 focus:ring-[var(--color-primary)] disabled:opacity-50"
                                disabled={readOnly}
                            />
                        </div>
                    )}
                    {gameType === 'matching' && (
                        <div className="flex items-center justify-between">
                            <label className="text-[var(--text-muted)] flex items-center gap-1.5">
                                <AdjustmentsHorizontalIcon className="w-3.5 h-3.5" /> Hints Used
                            </label>
                            <select
                                value={round.hints_used || ''}
                                onChange={(e) => onUpdateRound(levelIndex, roundIndex, { hints_used: e.target.value || null })}
                                className="w-32 p-1 bg-[var(--bg-input)] border border-[var(--border-main)] rounded text-xs focus:ring-1 focus:ring-[var(--color-primary)] disabled:opacity-50"
                                disabled={readOnly}
                            >
                                <option value="">None</option>
                                <option value="Long Hints">Long Hints</option>
                                <option value="Short Hints">Short Hints</option>
                                <option value="Object Name">Object Name</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Difficulty Distribution */}
                <div className="space-y-2 bg-[var(--bg-input)]/50 p-2 rounded-lg border border-[var(--border-main)]/50">
                    <div className="flex items-center justify-between mb-1">
                        <label className="text-[var(--text-muted)] font-medium flex items-center gap-1">
                            <AdjustmentsHorizontalIcon className="w-3.5 h-3.5" /> Distribution
                        </label>
                        {isDistMismatch && (
                            <span className="text-[9px] text-amber-600 font-bold px-1.5 py-0.5 bg-amber-100 rounded-full">
                                Sum: {totalDist} ≠ {round.question_count}
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div>
                            <span className="block text-[9px] text-[var(--text-muted)] text-center mb-0.5">Low</span>
                            <input
                                type="number"
                                value={round.difficulty_distribution.low}
                                onChange={(e) => onUpdateDistribution(levelIndex, roundIndex, 'low', parseInt(e.target.value) || 0)}
                                className="w-full text-center p-1 text-[10px] bg-[var(--bg-input)] text-[var(--text-main)] border border-[var(--border-main)] rounded focus:ring-1 focus:ring-[var(--color-primary)] disabled:opacity-50"
                                disabled={readOnly}
                            />
                        </div>
                        <div>
                            <span className="block text-[9px] text-[var(--text-muted)] text-center mb-0.5">Medium</span>
                            <input
                                type="number"
                                value={round.difficulty_distribution.medium}
                                onChange={(e) => onUpdateDistribution(levelIndex, roundIndex, 'medium', parseInt(e.target.value) || 0)}
                                className="w-full text-center p-1 text-[10px] bg-[var(--bg-input)] text-[var(--text-main)] border border-[var(--border-main)] rounded focus:ring-1 focus:ring-[var(--color-primary)] disabled:opacity-50"
                                disabled={readOnly}
                            />
                        </div>
                        <div>
                            <span className="block text-[9px] text-[var(--text-muted)] text-center mb-0.5">High</span>
                            <input
                                type="number"
                                value={round.difficulty_distribution.high}
                                onChange={(e) => onUpdateDistribution(levelIndex, roundIndex, 'high', parseInt(e.target.value) || 0)}
                                className="w-full text-center p-1 text-[10px] bg-[var(--bg-input)] text-[var(--text-main)] border border-[var(--border-main)] rounded focus:ring-1 focus:ring-[var(--color-primary)] disabled:opacity-50"
                                disabled={readOnly}
                            />
                        </div>
                        <div>
                            <span className="block text-[9px] text-[var(--text-muted)] text-center mb-0.5">Very High</span>
                            <input
                                type="number"
                                value={round.difficulty_distribution.very_high}
                                onChange={(e) => onUpdateDistribution(levelIndex, roundIndex, 'very_high', parseInt(e.target.value) || 0)}
                                className="w-full text-center p-1 text-[10px] bg-[var(--bg-input)] text-[var(--text-main)] border border-[var(--border-main)] rounded focus:ring-1 focus:ring-[var(--color-primary)] disabled:opacity-50"
                                disabled={readOnly}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
