'use client';

import React, { useMemo } from 'react';
import type { CognitiveFragment } from '@cognitive-engine/shared';
import { formatRelativeTime } from '../lib/utils';

interface FragmentCardProps {
  fragment: CognitiveFragment;
  index?: number;
  totalCount?: number;
}

export function FragmentCard({ fragment, index = 0, totalCount }: FragmentCardProps) {
  const formattedTime = formatRelativeTime(fragment.capturedAt);
  const fullDate = new Date(fragment.capturedAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const refCode = useMemo(() => {
    if (fragment.id && fragment.id.length >= 4) {
      return `REF: ${fragment.id.replace(/[^0-9a-zA-Z]/g, '').substring(0, 4).toUpperCase()}`;
    }
    return totalCount !== undefined
      ? `REF: ${String(totalCount - index).padStart(4, '0')}`
      : `#001`;
  }, [fragment.id, index, totalCount]);

  const rotationAngle = useMemo(() => {
    const angles = ['0deg', '-0.35deg', '0.3deg', '-0.25deg', '0.4deg'];
    return angles[index % angles.length];
  }, [index]);

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

      {/* Main Content: Left Icon Box + Text */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
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
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </div>

        <p
          style={{
            fontSize: '0.96rem',
            lineHeight: '1.65',
            color: 'var(--ink-bone)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxWidth: '65ch',
            fontFamily: 'var(--font-body)',
            flex: 1,
          }}
        >
          {fragment.content}
        </p>
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
            CAPTURE
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
          dateTime={new Date(fragment.capturedAt).toISOString()}
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
