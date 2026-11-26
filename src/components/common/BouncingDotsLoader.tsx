'use client';

import React from 'react';

interface BouncingDotsLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  colorClass?: string;
  className?: string;
}

export const BouncingDotsLoader: React.FC<BouncingDotsLoaderProps> = ({
  size = 'md',
  colorClass = 'bg-[#1b4332]',
  className = '',
}) => {
  const dotSize =
    size === 'sm' ? 'w-1.5 h-1.5' : size === 'lg' ? 'w-3 h-3' : 'w-2.5 h-2.5';
  const gap = size === 'sm' ? 'gap-1' : 'gap-1.5';

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`inline-flex items-center justify-center ${gap} ${className}`}
    >
      <span
        className={`${dotSize} ${colorClass} rounded-full animate-bounce [animation-delay:-0.3s]`}
      />
      <span
        className={`${dotSize} ${colorClass} rounded-full animate-bounce [animation-delay:-0.15s]`}
      />
      <span
        className={`${dotSize} ${colorClass} rounded-full animate-bounce`}
      />
    </div>
  );
};
