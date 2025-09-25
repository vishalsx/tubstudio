// components/common/ErrorMessage.tsx
import React from 'react';

interface ErrorMessageProps {
  message: string;
  onClose?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onClose,
  className = ''
}) => {
  return (
    <div className={`p-3 rounded-lg bg-red-50 border-l-4 border-red-500 ${className}`}>
      <div className="flex justify-between items-start">
        <p className="font-medium text-red-600 text-sm flex-1">{message}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-2 text-red-400 hover:text-red-600 transition"
            title="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};