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
        border: '1px solid var(--border-hairline)',
        boxShadow: 'var(--shadow-paper)',
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        transition: 'border-color var(--duration-fast)',
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
        {content}
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
          dateTime={new Date(dateValue).toISOString()}
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

        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.68rem',
            color: 'var(--text-secondary)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Retrieved Memory
        </span>
      </div>
    </article>
  );
}
