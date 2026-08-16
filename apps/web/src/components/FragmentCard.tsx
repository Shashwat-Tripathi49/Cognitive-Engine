'use client';

import React, { useMemo } from 'react';
import type { CognitiveFragment } from '@cognitive-engine/shared';
import { formatRelativeTime } from '../lib/utils';

interface FragmentCardProps {
  fragment: CognitiveFragment;
  index?: number;
}

export function FragmentCard({ fragment, index = 0 }: FragmentCardProps) {
  const formattedTime = formatRelativeTime(fragment.capturedAt);
  const fullDate = new Date(fragment.capturedAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const rotationAngle = useMemo(() => {
    const angles = ['0deg', '-0.3deg', '0.25deg', '-0.2deg', '0.3deg'];
    return angles[index % angles.length];
  }, [index]);

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
        {fragment.content}
      </p>

      {/* Real Temporal Context */}
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
        <time
          dateTime={new Date(fragment.capturedAt).toISOString()}
          title={fullDate}
        >
          {fullDate}
        </time>
      </div>
    </article>
  );
}
