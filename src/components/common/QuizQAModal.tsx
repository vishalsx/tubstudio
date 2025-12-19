import React, { useState } from 'react';
import { XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { QuizQAItem } from '../../types';

interface QuizQAModalProps {
    isOpen: boolean;
    onClose: () => void;
    quizQA: QuizQAItem[];
    language: string;
    isEditing: boolean;
    onUpdate: (newQuizQA: QuizQAItem[]) => void;
    hasValidationErrors?: boolean;
    translationId?: string;
    onRefreshQuizQA?: () => Promise<void>;
    isRefreshing?: boolean;
}

export const QuizQAModal: React.FC<QuizQAModalProps> = ({ isOpen, onClose, quizQA, language, isEditing, onUpdate, hasValidationErrors, translationId, onRefreshQuizQA, isRefreshing = false }) => {
    const [showConfirmation, setShowConfirmation] = useState(false);

    if (!isOpen) return null;

    const handleQuestionChange = (index: number, value: string) => {
        const updatedQuizQA = [...quizQA];
        updatedQuizQA[index] = { ...updatedQuizQA[index], question: value };
        console.log('QuizQAModal: handleQuestionChange', updatedQuizQA);
        onUpdate(updatedQuizQA);
    };

    const handleAnswerChange = (index: number, value: string) => {
        const updatedQuizQA = [...quizQA];
        updatedQuizQA[index] = { ...updatedQuizQA[index], answer: value };
        onUpdate(updatedQuizQA);
    };

    const handleDifficultyChange = (index: number, value: string) => {
        const updatedQuizQA = [...quizQA];
        updatedQuizQA[index] = { ...updatedQuizQA[index], difficulty_level: value };
        onUpdate(updatedQuizQA);
    };

    const handleAddQuestion = () => {
        const updatedQuizQA = [...quizQA, { question: '', answer: '', difficulty_level: '' }];
        console.log('QuizQAModal: handleAddQuestion', updatedQuizQA);
        onUpdate(updatedQuizQA);
    };

    const handleDeleteQuestion = (index: number) => {
        const updatedQuizQA = quizQA.filter((_, i) => i !== index);
        onUpdate(updatedQuizQA);
    };

    const handleRefreshClick = () => {
        setShowConfirmation(true);
    };

    const handleConfirmRefresh = async () => {
        setShowConfirmation(false);
        if (onRefreshQuizQA) {
            await onRefreshQuizQA();
        }
    };

    const handleCancelRefresh = () => {
        setShowConfirmation(false);
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-[var(--bg-panel)] bg-panel-texture rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    <div className="bg-[var(--bg-panel)] px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg leading-6 font-medium text-[var(--text-main)]" id="modal-title">
                                Quiz Q&A - {language} {isEditing && <span className="text-sm text-[var(--color-primary)] font-normal">(Editing Mode)</span>}
                            </h3>
                            <button
                                onClick={onClose}
                                className="bg-transparent rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] focus:outline-none"
                            >
                                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                            </button>
                        </div>

                        <div className="mt-2 max-h-[60vh] overflow-y-auto">
                            {quizQA && quizQA.length > 0 ? (
                                <div className="space-y-4">
                                    {quizQA.map((item, index) => (
                                        <div key={index} className="bg-[var(--bg-input)] p-4 rounded-lg border border-[var(--border-main)] relative">
                                            {isEditing && (
                                                <button
                                                    onClick={() => handleDeleteQuestion(index)}
                                                    className="absolute top-2 right-2 text-red-400 hover:text-red-600"
                                                    title="Delete Question"
                                                >
                                                    <XMarkIcon className="h-5 w-5" />
                                                </button>
                                            )}
                                            <div className="mb-2 pr-6">
                                                <div className="flex justify-between items-center mb-1">
                                                    <label className="block text-xs font-medium text-[var(--text-muted)]">Question {index + 1}</label>
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={item.difficulty_level || ''}
                                                            onChange={(e) => handleDifficultyChange(index, e.target.value)}
                                                            placeholder="Difficulty"
                                                            className={`text-xs p-1 border rounded focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] w-24 bg-[var(--bg-panel)] text-[var(--text-main)] ${hasValidationErrors && !item.difficulty_level?.trim() ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-[var(--border-main)]'}`}
                                                        />
                                                    ) : (
                                                        item.difficulty_level && (
                                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.difficulty_level.toLowerCase().includes('high') ? 'bg-red-500/20 text-red-500' :
                                                                item.difficulty_level.toLowerCase().includes('medium') ? 'bg-yellow-500/20 text-yellow-500' :
                                                                    'bg-green-500/20 text-green-500'
                                                                }`}>
                                                                {item.difficulty_level}
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                                {isEditing ? (
                                                    <textarea
                                                        rows={2}
                                                        value={item.question}
                                                        onChange={(e) => handleQuestionChange(index, e.target.value)}
                                                        className={`w-full p-2 border rounded-md focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-sm bg-[var(--bg-panel)] text-[var(--text-main)] ${hasValidationErrors && !item.question.trim() ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-[var(--border-main)]'}`}
                                                    />
                                                ) : (
                                                    <p className="font-medium text-[var(--text-main)]">{item.question}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Answer</label>
                                                {isEditing ? (
                                                    <textarea
                                                        rows={2}
                                                        value={item.answer}
                                                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                                                        className={`w-full p-2 border rounded-md focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-sm bg-[var(--bg-panel)] text-[var(--text-main)] ${hasValidationErrors && !item.answer.trim() ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-[var(--border-main)]'}`}
                                                    />
                                                ) : (
                                                    <p className="text-[var(--text-main)] pl-4 border-l-2 border-[var(--color-primary)]">{item.answer}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[var(--text-muted)] italic text-center py-8">No quiz questions available for this object.</p>
                            )}

                            {isEditing && (
                                <div className="mt-4 flex justify-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleAddQuestion}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-[var(--color-primary)] bg-[var(--color-primary-light)] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)]"
                                    >
                                        <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                        </svg>
                                        Add New Question
                                    </button>
                                    {onRefreshQuizQA && (
                                        <button
                                            type="button"
                                            onClick={handleRefreshClick}
                                            disabled={!translationId || isRefreshing}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[var(--color-secondary)] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
                                            title={!translationId ? "Translation must be saved first" : "Refresh Quiz Q&A from backend"}
                                        >
                                            {isRefreshing ? (
                                                <>
                                                    <div className="-ml-1 mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    Refreshing...
                                                </>
                                            ) : (
                                                <>
                                                    <ArrowPathIcon className="-ml-1 mr-2 h-5 w-5" />
                                                    Refresh Quiz Q&A
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="bg-[var(--bg-input)] px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-[var(--border-main)] shadow-sm px-4 py-2 bg-[var(--bg-panel)] text-base font-medium text-[var(--text-main)] hover:bg-[var(--bg-input)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* Confirmation Dialog */}
                {showConfirmation && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-[var(--bg-panel)] bg-panel-texture rounded-lg p-6 max-w-sm mx-4 shadow-xl border border-[var(--border-main)]">
                            <h4 className="text-lg font-semibold text-[var(--text-main)] mb-2">Refresh Quiz Q&A?</h4>
                            <p className="text-sm text-[var(--text-muted)] mb-4">
                                Existing questions will be lost. Are you sure you want to continue?
                            </p>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={handleCancelRefresh}
                                    className="px-4 py-2 text-sm font-medium text-[var(--text-main)] bg-[var(--bg-input)] rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmRefresh}
                                    className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-secondary)] rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-secondary)]"
                                >
                                    Yes, Refresh
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
