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
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                Quiz Q&A - {language} {isEditing && <span className="text-sm text-blue-600 font-normal">(Editing Mode)</span>}
                            </h3>
                            <button
                                onClick={onClose}
                                className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                            >
                                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                            </button>
                        </div>

                        <div className="mt-2 max-h-[60vh] overflow-y-auto">
                            {quizQA && quizQA.length > 0 ? (
                                <div className="space-y-4">
                                    {quizQA.map((item, index) => (
                                        <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative">
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
                                                    <label className="block text-xs font-medium text-gray-500">Question {index + 1}</label>
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={item.difficulty_level || ''}
                                                            onChange={(e) => handleDifficultyChange(index, e.target.value)}
                                                            placeholder="Difficulty"
                                                            className={`text-xs p-1 border rounded focus:ring-[#00AEEF] focus:border-[#00AEEF] w-24 ${hasValidationErrors && !item.difficulty_level?.trim() ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}`}
                                                        />
                                                    ) : (
                                                        item.difficulty_level && (
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${item.difficulty_level.toLowerCase().includes('high') ? 'bg-red-100 text-red-800' :
                                                                item.difficulty_level.toLowerCase().includes('medium') ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-green-100 text-green-800'
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
                                                        className={`w-full p-2 border rounded-md focus:ring-[#00AEEF] focus:border-[#00AEEF] text-sm ${hasValidationErrors && !item.question.trim() ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}`}
                                                    />
                                                ) : (
                                                    <p className="font-medium text-gray-800">{item.question}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Answer</label>
                                                {isEditing ? (
                                                    <textarea
                                                        rows={2}
                                                        value={item.answer}
                                                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                                                        className={`w-full p-2 border rounded-md focus:ring-[#00AEEF] focus:border-[#00AEEF] text-sm ${hasValidationErrors && !item.answer.trim() ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}`}
                                                    />
                                                ) : (
                                                    <p className="text-gray-600 pl-4 border-l-2 border-[#00AEEF]">{item.answer}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 italic text-center py-8">No quiz questions available for this object.</p>
                            )}

                            {isEditing && (
                                <div className="mt-4 flex justify-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleAddQuestion}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-[#00AEEF] bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00AEEF]"
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
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#F15A29] hover:bg-[#D14A23] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F15A29] disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00AEEF] sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* Confirmation Dialog */}
                {showConfirmation && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Refresh Quiz Q&A?</h4>
                            <p className="text-sm text-gray-600 mb-4">
                                Existing questions will be lost. Are you sure you want to continue?
                            </p>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={handleCancelRefresh}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmRefresh}
                                    className="px-4 py-2 text-sm font-medium text-white bg-[#F15A29] rounded-md hover:bg-[#D14A23] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F15A29]"
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
