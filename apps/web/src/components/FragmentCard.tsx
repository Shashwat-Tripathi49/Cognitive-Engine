'use client';

import React from 'react';
import type { CognitiveFragment } from '@cognitive-engine/shared';
import { formatRelativeTime } from '../lib/utils';

interface FragmentCardProps {
  fragment: CognitiveFragment;
}

export function FragmentCard({ fragment }: FragmentCardProps) {
  const formattedTime = formatRelativeTime(fragment.capturedAt);
  const fullDate = new Date(fragment.capturedAt).toLocaleString();

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
        {fragment.content}
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

        {fragment.modality && fragment.modality !== 'text' && (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(108, 92, 231, 0.12)',
              color: 'var(--accent-tertiary)',
              textTransform: 'capitalize',
            }}
          >
            {fragment.modality.replace('_', ' ')}
          </span>
        )}
      </div>
    </article>
  );
}
