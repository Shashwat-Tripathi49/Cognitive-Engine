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

  // Calculate deterministic reference ID from real UUID/id
  const refCode = useMemo(() => {
    const id = memory.id || sourceFragment?.id || '';
    if (id.length >= 4) {
      return `REF: ${id.replace(/[^0-9a-zA-Z]/g, '').substring(0, 4).toUpperCase()}`;
    }
    return `REF: ${String(index + 1001)}`;
  }, [memory.id, sourceFragment?.id, index]);

  // Subtle controlled rotation for editorial paper feel
  const rotationAngle = useMemo(() => {
    const angles = ['0deg', '-0.35deg', '0.3deg', '-0.25deg', '0.4deg'];
    return angles[index % angles.length];
  }, [index]);

  // Highlight query keywords softly if present
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
                backgroundColor: 'rgba(20, 23, 26, 0.09)',
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
        boxShadow: '2px 3px 0px rgba(0, 0, 0, 0.12)',
        padding: '20px 22px',
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
      {/* Top Header: Ref code */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: 'var(--ink-dust)',
            letterSpacing: '0.06em',
          }}
        >
          {refCode}
        </span>
      </div>

      {/* Main Content Row: Left Icon Box + Text */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        {/* Left Icon Box (Stitch Stamp) */}
        <div
          style={{
            width: '32px',
            height: '32px',
            border: '1px solid var(--border-structural)',
            backgroundColor: 'var(--surface-raised)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '2px',
          }}
        >
          {index % 3 === 0 ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          ) : index % 3 === 1 ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M10 2v7.31M14 9.3V1.99M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          )}
        </div>

        {/* Text Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p
            style={{
              fontSize: '0.96rem',
              lineHeight: '1.65',
              color: 'var(--ink-bone)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxWidth: '65ch',
              fontFamily: 'var(--font-body)',
            }}
          >
            {highlightedContent}
          </p>
        </div>
      </div>

      {/* Footer Tags & Timestamp */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '10px',
          borderTop: '1px solid var(--border-hairline)',
        }}
      >
        <div style={{ display: 'flex', gap: '6px' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '2px 6px',
              backgroundColor: 'var(--surface-raised)',
              border: '1px solid var(--border-hairline)',
              color: 'var(--ink-zinc)',
            }}
          >
            MEMORY
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '2px 6px',
              backgroundColor: 'var(--surface-raised)',
              border: '1px solid var(--border-hairline)',
              color: 'var(--ink-zinc)',
            }}
          >
            {formattedTime}
          </span>
        </div>

        <time
          dateTime={new Date(dateValue).toISOString()}
          title={fullDate}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.68rem',
            color: 'var(--ink-dust)',
          }}
        >
          {fullDate}
        </time>
      </div>
    </article>
  );
}
