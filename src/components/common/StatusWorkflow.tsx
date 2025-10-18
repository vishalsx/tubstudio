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

  if (currentIndex === -1 || !currentStatus) {
    // Fallback for unexpected statuses
    return <p className={`text-gray-900 ${className}`}>{currentStatus || '-'}</p>;
  }

  return (
    <div className={`flex items-center w-full pt-1 ${className}`}>
      {statuses.map((status, index) => (
        <React.Fragment key={status}>
          <div className="flex flex-col items-center flex-shrink-0 w-20 text-center">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors duration-300
                ${index <= currentIndex ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'}
              `}
            >
              {index < currentIndex && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {index === currentIndex && (
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              )}
            </div>
            <span className={`mt-1 text-xs ${index === currentIndex ? 'font-bold text-gray-800' : 'text-gray-500'}`}>
              {status}
            </span>
          </div>
          {index < statuses.length - 1 && (
            <div className={`flex-1 h-0.5 mt-[-1rem] transition-colors duration-300 ${index < currentIndex ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
