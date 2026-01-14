import React, { useState } from 'react';
import { Contest } from '../../../types/contest';
import { QRCodeSVG } from 'qrcode.react';
import { GAME_BASE_URL } from '../../../utils/constants';
import { UserContext } from '../../../types';
import {
    ChartBarIcon,
    GlobeAltIcon,
    TrophyIcon,
    AcademicCapIcon,
    UserGroupIcon,
    CheckCircleIcon,
    ArrowTrendingUpIcon,
    LanguageIcon,
    QrCodeIcon,
    ClipboardIcon,
    CheckIcon,
} from '@heroicons/react/24/outline';

interface ContestRightPanelProps {
    contest: Contest | null;
    onUpdate: (updates: Partial<Contest>) => void;
    userContext?: UserContext | null;
}

export const ContestRightPanel: React.FC<ContestRightPanelProps> = ({
    contest,
    userContext
}) => {
    if (!contest) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] italic">
                Select a contest to view analytics.
            </div>
        );
    }

    // Mock Analytics Data
    const analytics = {
        participants: Math.floor(Math.random() * 50) + 20,
        avgScore: (Math.random() * 20 + 75).toFixed(1),
        completionRate: Math.floor(Math.random() * 15) + 80,
        topLanguage: contest.supported_languages[0] || 'English'
    };

    const StatWidget = ({ icon: Icon, label, value, subtext, colorClass }: any) => (
        <div className="bg-[var(--bg-input)]/30 border border-[var(--border-main)] rounded-xl p-3 flex flex-col gap-2 transition-all hover:shadow-sm">
            <div className="flex items-center justify-between">
                <div className={`p-1.5 rounded-lg ${colorClass} bg-opacity-10 opacity-80`}>
                    <Icon className={`w-4 h-4 ${colorClass.replace('bg-', 'text-')}`} />
                </div>
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{label}</span>
            </div>
            <div className="flex flex-col">
                <span className="text-lg font-black text-[var(--text-main)] leading-none">{value}</span>
                <span className="text-[10px] text-[var(--text-muted)] mt-1">{subtext}</span>
            </div>
        </div>
    );

    const contestUrl = `${GAME_BASE_URL}/${contest.org_code || userContext?.org_code || 'GLOBAL'}/contest/${contest._id}`;

    const [isCopied, setIsCopied] = useState(false);

    const handleCopyUrl = () => {
        if (contestUrl) {
            navigator.clipboard.writeText(contestUrl);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 3000);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[var(--bg-panel)] rounded-lg shadow-sm p-4 overflow-y-auto custom-scrollbar space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-3">
                <h2 className="text-base font-bold text-[var(--text-main)] flex items-center gap-2">
                    <ChartBarIcon className="w-5 h-5 text-[var(--color-primary)]" />
                    Analytics Dashboard
                </h2>
                <div className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[10px] font-bold rounded-full border border-green-500/20">
                    LIVE
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                <StatWidget
                    icon={UserGroupIcon}
                    label="Participants"
                    value={analytics.participants}
                    subtext={`of ${contest.max_participants} limit`}
                    colorClass="bg-blue-500 text-blue-500"
                />
                <StatWidget
                    icon={ArrowTrendingUpIcon}
                    label="Avg Score"
                    value={analytics.avgScore}
                    subtext="+5.2% vs last week"
                    colorClass="bg-amber-500 text-amber-500"
                />
                <StatWidget
                    icon={CheckCircleIcon}
                    label="Completion"
                    value={`${analytics.completionRate}%`}
                    subtext="Steady engagement"
                    colorClass="bg-emerald-500 text-emerald-500"
                />
                <StatWidget
                    icon={LanguageIcon}
                    label="Primary"
                    value={analytics.topLanguage}
                    subtext="Most active"
                    colorClass="bg-purple-500 text-purple-500"
                />
            </div>

            {/* Detailed Analytics Sections */}
            <div className="space-y-4">
                <div className="p-3 bg-[var(--bg-input)]/20 rounded-xl border border-[var(--border-main)] border-dashed">
                    <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-3 flex items-center justify-between">
                        Language Adoption
                        <GlobeAltIcon className="w-3 h-3 text-[var(--text-muted)]" />
                    </h3>
                    <div className="space-y-3">
                        {contest.supported_languages.map((lang, idx) => (
                            <div key={lang} className="space-y-1">
                                <div className="flex justify-between text-[10px] font-medium">
                                    <span>{lang}</span>
                                    <span className="text-[var(--text-muted)]">{75 - idx * 15}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-[var(--border-main)] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[var(--color-primary)] rounded-full opacity-70"
                                        style={{ width: `${75 - idx * 15}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content Removed: Game Structure is no longer displayed in the Right Panel */}
            </div>

            {/* Contest URL and QR Code - Only shown if Published/Active */}
            {contest._id && (contest.status === 'Published' || contest.status === 'Active') && (
                <div className="mt-auto pt-4 border-t border-[var(--border-main)] space-y-4">
                    <div className="bg-[var(--bg-input)]/30 rounded-xl p-4 border border-[var(--border-main)] flex flex-col items-center gap-3">
                        <div className="flex items-center justify-between w-full">
                            <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase flex items-center gap-1.5">
                                <QrCodeIcon className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                                Contest URL
                            </h3>
                            <button
                                onClick={handleCopyUrl}
                                className={`text-[9px] flex items-center gap-1 transition-colors ${isCopied
                                        ? 'text-green-500 font-medium'
                                        : 'text-[var(--text-muted)] hover:text-[var(--color-primary)]'
                                    }`}
                                title="Copy Contest URL"
                            >
                                {isCopied ? (
                                    <>
                                        <CheckIcon className="w-3 h-3" />
                                        Link Copied
                                    </>
                                ) : (
                                    <>
                                        <ClipboardIcon className="w-3 h-3" />
                                        Copy Link
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="p-3 bg-white rounded-lg shadow-inner">
                            <QRCodeSVG
                                value={contestUrl}
                                size={120}
                                level="H"
                                includeMargin={true}
                            />
                        </div>

                        <div className="text-center space-y-1">
                            <p className="text-[10px] font-mono text-[var(--text-muted)] break-all max-w-[200px]">
                                {contestUrl}
                            </p>
                            <p className="text-[9px] text-[var(--text-muted)] italic">
                                Scan to join the challenge
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-3 bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/10 rounded-xl flex items-start gap-2">
                <AcademicCapIcon className="w-4 h-4 text-[var(--color-primary)] mt-0.5" />
                <p className="text-[9px] text-[var(--text-muted)] leading-relaxed">
                    <strong>Tip:</strong> Encourage participants to complete the profile sections for more accurate performance analytics.
                </p>
            </div>
        </div>
    );
};
