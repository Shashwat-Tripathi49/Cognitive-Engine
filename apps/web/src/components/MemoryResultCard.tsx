'use client';

import React, { useMemo } from 'react';
import type { MemorySearchResult } from '@cognitive-engine/shared';
import { formatRelativeTime } from '../lib/utils';

interface MemoryResultCardProps {
  result: MemorySearchResult;
  index?: number;
  query?: string;
}

export function MemoryResultCard({ result, index = 0, query = '' }: MemoryResultCardProps) {
  const { memory, sourceFragment } = result;
  const content = memory.content || sourceFragment?.content || '';
  const dateValue = memory.createdAt || sourceFragment?.capturedAt || new Date();
  const formattedTime = formatRelativeTime(dateValue);
  const fullDate = new Date(dateValue).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  // Subtle controlled rotation for editorial paper feel
  const rotationAngle = useMemo(() => {
    const angles = ['0deg', '-0.3deg', '0.25deg', '-0.2deg', '0.3deg'];
    return angles[index % angles.length];
  }, [index]);

  // Highlight query keywords softly only if they literally exist in text
  const highlightedContent = useMemo(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || trimmedQuery.length < 2) return content;

    const words = trimmedQuery
      .split(/\s+/)
      .filter((w) => w.length > 1)
      .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    if (words.length === 0) return content;

    try {
      const regex = new RegExp(`(${words.join('|')})`, 'gi');
      const parts = content.split(regex);

      return parts.map((part, i) => {
        if (regex.test(part)) {
          return (
            <mark
              key={i}
              style={{
                backgroundColor: 'rgba(20, 23, 26, 0.08)',
                color: 'var(--ink-bone)',
                padding: '1px 3px',
                borderRadius: '1px',
                fontWeight: 600,
              }}
            >
              {part}
            </mark>
          );
        }
        return part;
      });
    } catch {
      return content;
    }
  }, [content, query]);

  return (
    <article
      style={{
        backgroundColor: 'var(--surface-pure)',
        border: '1px solid var(--border-structural)',
        boxShadow: '1.5px 2.5px 0px rgba(0, 0, 0, 0.10)',
        padding: '18px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transform: rotationAngle,
        transition: 'transform var(--duration-fast), border-color var(--duration-fast)',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--ink-bone)';
        e.currentTarget.style.transform = 'none';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-structural)';
        e.currentTarget.style.transform = rotationAngle;
      }}
    >
      {/* Memory Content */}
      <p
        style={{
          fontSize: '0.975rem',
          lineHeight: '1.68',
          color: 'var(--ink-bone)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          maxWidth: '65ch',
          fontFamily: 'var(--font-body)',
        }}
      >
        {highlightedContent}
      </p>

      {/* Real Temporal Context Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '10px',
          borderTop: '1px solid var(--border-hairline)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          color: 'var(--ink-dust)',
        }}
      >
        <span>{formattedTime}</span>
        <time dateTime={new Date(dateValue).toISOString()} title={fullDate}>
          {fullDate}
        </time>
      </div>
    </article>
  );
}
