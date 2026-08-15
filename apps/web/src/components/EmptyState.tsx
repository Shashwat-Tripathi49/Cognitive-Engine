'use client';

import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        borderRadius: 'var(--radius-xl)',
        border: '1px dashed var(--border-subtle)',
        backgroundColor: 'rgba(22, 26, 34, 0.4)',
      }}
    >
      {icon ? (
        <div
          style={{
            color: 'var(--accent-tertiary)',
            marginBottom: '4px',
          }}
        >
          {icon}
        </div>
      ) : (
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'rgba(108, 92, 231, 0.12)',
            color: 'var(--accent-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '4px',
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4 21l3.39-.97C8.93 20.26 10.88 21 12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z" />
          </svg>
        </div>
      )}

      <h3
        style={{
          fontSize: '1.05rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          maxWidth: '400px',
          lineHeight: '1.5',
        }}
      >
        {description}
      </p>
    </div>
  );
}
