'use client';

import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        border: '1px dashed var(--border-strong)',
        backgroundColor: 'var(--bg-surface-subtle)',
      }}
    >
      <h3
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.2rem',
          fontWeight: 400,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
          maxWidth: '400px',
          lineHeight: '1.6',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {description}
      </p>
    </div>
  );
}
