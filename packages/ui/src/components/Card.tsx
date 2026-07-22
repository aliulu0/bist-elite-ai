import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated';
}

export function Card({ variant = 'default', children, className = '', ...props }: CardProps) {
  const variants = {
    default: 'bg-white dark:bg-gray-800 rounded-lg shadow',
    outlined: 'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
    elevated: 'bg-white dark:bg-gray-800 rounded-lg shadow-lg',
  };

  return (
    <div className={`${variants[variant]} p-4 ${className}`} {...props}>
      {children}
    </div>
  );
}
