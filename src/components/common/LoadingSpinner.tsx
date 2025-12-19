// components/common/LoadingSpinner.tsx
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'white' | 'gray';
  text?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8'
};

const colorClasses = {
  blue: 'border-[#00AEEF]',
  white: 'border-white',
  gray: 'border-gray-400'
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'blue',
  text,
  className = ''
}) => {
  const spinnerClasses = [
    sizeClasses[size],
    'border-2 border-t-transparent rounded-full animate-spin',
    colorClasses[color],
    className
  ].join(' ');

  if (text) {
    return (
      <div className="flex items-center space-x-2">
        <div className={spinnerClasses}></div>
        <span className="text-[var(--text-muted)]">{text}</span>
      </div>
    );
  }

  return <div className={spinnerClasses}></div>;
};