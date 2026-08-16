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
        padding: '40px 20px',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        border: '1px dashed var(--border-structural)',
        backgroundColor: 'var(--surface-raised)',
        borderRadius: 'var(--radius-slip)',
      }}
    >
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.95rem',
          fontWeight: 600,
          color: 'var(--ink-bone)',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: '0.875rem',
          color: 'var(--ink-zinc)',
          maxWidth: '55ch',
          lineHeight: '1.6',
          fontFamily: 'var(--font-body)',
        }}
      >
        {description}
      </p>
    </div>
  );
}
