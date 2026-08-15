'use client';

import React from 'react';
import type { MemorySearchResult } from '@cognitive-engine/shared';
import { formatRelativeTime } from '../lib/utils';

interface MemoryResultCardProps {
  result: MemorySearchResult;
}

export function MemoryResultCard({ result }: MemoryResultCardProps) {
  const { memory, sourceFragment } = result;
  const content = memory.content || sourceFragment?.content || '';
  const dateValue = memory.createdAt || sourceFragment?.capturedAt || new Date();
  const formattedTime = formatRelativeTime(dateValue);
  const fullDate = new Date(dateValue).toLocaleString();

  return (
    <article
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transition: 'border-color var(--duration-fast), transform var(--duration-fast)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-strong)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.transform = 'none';
      }}
    >
      <p
        style={{
          fontSize: '0.975rem',
          lineHeight: '1.65',
          color: 'var(--text-primary)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {content}
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
        }}
      >
        <span
          title={fullDate}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {formattedTime}
        </span>

        {/* Note: In strict adherence to Cognitive Engine product constitution, NO SIMILARITY SCORES are displayed */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            color: 'var(--accent-secondary)',
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          Semantic Match
        </span>
      </div>
    </article>
  );
}
