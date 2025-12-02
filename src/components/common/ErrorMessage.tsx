// components/common/ErrorMessage.tsx
import React from 'react';

interface ErrorMessageProps {
  message: string;
  onClose?: () => void;
  className?: string;
  showDog?: boolean; // Optional: show/hide the crying dog image
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onClose,
  className = '',
  showDog = true, // Default to showing the dog
}) => {
  return (
    <div className={`p-4 rounded-lg bg-red-50 border-l-4 border-red-500 ${className}`}>
      <div className="flex items-start gap-3">
        {/* Crying Dog Image */}
        {showDog && (
          <div className="flex-shrink-0">
            <img
              src="/crying-dog.png"
              alt="Sad dog"
              className="w-16 h-16 object-contain"
              onError={(e) => {
                // Hide image if it fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Error Message */}
        <div className="flex-1 flex justify-between items-start">
          <div className="flex-1">
            <p className="font-medium text-red-600 text-sm">{message}</p>
          </div>

          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="ml-2 text-red-400 hover:text-red-600 transition flex-shrink-0"
              title="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};