import React from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ValidationSummaryItem {
    chapter_name: string;
    page_title: string;
    valid_count: number;
    missing_count: number;
}

interface ValidationSummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    result: {
        isValid: boolean;
        message: string;
        summary: ValidationSummaryItem[];
        totals: { valid: number; missing: number };
    } | null;
}

export const ValidationSummaryModal: React.FC<ValidationSummaryModalProps> = ({ isOpen, onClose, result }) => {
    if (!isOpen || !result) return null;

    // Group items by chapter
    const groupedSummary = result.summary.reduce((acc, item) => {
        const chapter = item.chapter_name || 'Unknown Chapter';
        if (!acc[chapter]) {
            acc[chapter] = [];
        }
        acc[chapter].push(item);
        return acc;
    }, {} as Record<string, ValidationSummaryItem[]>);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-[#1e1e1e] rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh] border border-gray-800 overflow-hidden">

                {/* Header */}
                <div className={`p-4 border-b border-gray-800 flex-shrink-0 flex items-center justify-between ${result.isValid ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
                    <div className="flex items-center space-x-3">
                        {result.isValid ? (
                            <CheckCircleIcon className="w-8 h-8 text-green-500" />
                        ) : (
                            <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
                        )}
                        <div>
                            <h2 className={`text-lg font-bold ${result.isValid ? 'text-green-400' : 'text-red-400'}`}>
                                {result.isValid ? 'Ready to Publish!' : "Book Can't be Published"}
                            </h2>
                            <p className="text-sm text-gray-400">{result.message}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Content (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 min-h-0">

                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 gap-4 flex-shrink-0">
                        <div className="bg-[#2a2a2a] p-3 rounded-lg border border-gray-700">
                            <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Valid Translations</span>
                            <p className="text-2xl font-mono text-green-400">{result.totals.valid}</p>
                        </div>
                        <div className="bg-[#2a2a2a] p-3 rounded-lg border border-gray-700">
                            <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Missing Translations</span>
                            <p className="text-2xl font-mono text-red-400">{result.totals.missing}</p>
                        </div>
                    </div>

                    <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mt-4 flex-shrink-0">Detailed Report</h3>

                    <div className="space-y-4">
                        {Object.keys(groupedSummary).length === 0 ? (
                            <p className="text-gray-500 italic text-sm">No issues found.</p>
                        ) : (
                            Object.entries(groupedSummary).map(([chapter, items]) => (
                                <div key={chapter} className="space-y-2">
                                    <h4 className="text-sm font-semibold text-blue-400 border-b border-gray-700 pb-1 sticky top-0 bg-[#1e1e1e] pt-2 z-10">{chapter}</h4>
                                    <div className="space-y-2 pl-2">
                                        {items.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between bg-[#252525] p-2 rounded border border-gray-800 hover:border-gray-700 transition-colors">
                                                <p className="text-sm text-gray-300">{item.page_title}</p>
                                                <div className="flex items-center space-x-4 text-xs font-mono">
                                                    <div className="flex items-center space-x-1 text-green-500/80">
                                                        <CheckCircleIcon className="w-3 h-3" />
                                                        <span>{item.valid_count} OK</span>
                                                    </div>
                                                    {item.missing_count > 0 && (
                                                        <div className="flex items-center space-x-1 text-red-500">
                                                            <ExclamationTriangleIcon className="w-3 h-3" />
                                                            <span>{item.missing_count} MISSING</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-800 flex justify-end flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>

            </div>
        </div>
    );
};
