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
        border: '1px solid var(--border-hairline)',
        boxShadow: 'var(--shadow-paper)',
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        transition: 'border-color var(--duration-fast), transform var(--duration-fast)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-strong)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-hairline)';
      }}
    >
      <p
        style={{
          fontSize: '1rem',
          lineHeight: '1.68',
          color: 'var(--text-primary)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {fragment.content}
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '10px',
          borderTop: '1px solid var(--border-hairline)',
        }}
      >
        <time
          dateTime={new Date(fragment.capturedAt).toISOString()}
          title={fullDate}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.04em',
          }}
        >
          {formattedTime}
        </time>

        {fragment.modality && fragment.modality !== 'text' && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {fragment.modality.replace('_', ' ')}
          </span>
        )}
      </div>
    </article>
  );
}
