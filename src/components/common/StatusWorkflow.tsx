// src/components/common/StatusWorkflow.tsx
import React from 'react';

interface StatusWorkflowProps {
  statuses: string[];
  currentStatus: string | null | undefined;
  className?: string;
}

export const StatusWorkflow: React.FC<StatusWorkflowProps> = ({ statuses, currentStatus, className = '' }) => {
  const normalizedCurrentStatus = currentStatus?.toLowerCase() || '';
  const currentIndex = statuses.findIndex(s => s.toLowerCase() === normalizedCurrentStatus);

  // Special handling for Rejected status
  if (normalizedCurrentStatus === 'rejected') {
    return (
      <p className={`bg-red-500/10 p-2 rounded-md font-semibold text-red-500 ${className}`}>
        ❌ Rejected
      </p>
    );
  }

  // Helper to get color for a specific status
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft': return 'bg-orange-500 border-orange-500';
      case 'released': return 'bg-blue-500 border-blue-500';
      case 'verified': return 'bg-purple-500 border-purple-500';
      case 'approved': return 'bg-green-500 border-green-500';
      default: return 'bg-gray-500 border-gray-500';
    }
  };

  // Helper to get line color based on the COMPLETED step
  const getLineColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft': return 'bg-orange-500';
      case 'released': return 'bg-blue-500';
      case 'verified': return 'bg-purple-500';
      case 'approved': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (currentIndex === -1 || !currentStatus) {
    // Fallback for unexpected statuses
    return <p className={`text-[var(--text-main)] ${className}`}>{currentStatus || '-'}</p>;
  }

  return (
    <div className={`flex items-center w-full pt-1 ${className}`}>
      {statuses.map((status, index) => (
        <React.Fragment key={status}>
          <div className="flex flex-col items-center flex-shrink-0 w-20 text-center">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors duration-300
                ${index <= currentIndex ? getStatusColor(status) : 'bg-[var(--bg-panel)] border-[var(--border-main)]'}
              `}
            >
              {index < currentIndex && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {/* For the checked item (Approved logic), or active item */}
              {index === currentIndex && (
                normalizedCurrentStatus === 'approved' ? (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )
              )}
            </div>
            <span className={`mt-1 text-xs ${index === currentIndex ? 'font-bold text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>
              {status}
            </span>
          </div>
          {index < statuses.length - 1 && (
            <div className={`flex-1 h-0.5 mt-[-1rem] transition-colors duration-300 ${index < currentIndex ? getLineColor(status) : 'bg-[var(--border-main)]'}`}></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
