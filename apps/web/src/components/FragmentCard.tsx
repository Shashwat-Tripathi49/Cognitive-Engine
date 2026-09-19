'use client';

import React, { useState } from 'react';
import type { CognitiveFragment } from '@cognitive-engine/shared';
import { Badge } from '@cognitive-engine/ui';

interface FragmentCardProps {
  fragment: CognitiveFragment;
  index?: number;
}

export function FragmentCard({ fragment }: FragmentCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const capturedDate = new Date(fragment.capturedAt);
  const timeFormatted = capturedDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const dateFormatted = capturedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const wordCount = fragment.content.trim().split(/\s+/).length;

  return (
    <article
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '100%',
        backgroundColor: isHovered ? 'var(--surface-raised)' : 'var(--surface-pure)',
        border: '1px solid var(--border-structural)',
        borderRadius: 'var(--radius-stamp)',
        boxShadow: isHovered ? 'var(--shadow-slip)' : 'none',
        padding: '18px 22px',
        display: 'grid',
        gridTemplateColumns: '70px minmax(0, 1fr) auto',
        gap: '20px',
        alignItems: 'baseline',
        transform: isHovered ? 'translateX(3px)' : 'none',
        transition: `all var(--duration-micro) var(--ease-precise)`,
        boxSizing: 'border-box',
        cursor: 'pointer',
      }}
    >
      {/* Column 1: Ledger Time Stamp */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '2px',
          userSelect: 'none',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--ink-bone)',
            letterSpacing: '0.04em',
          }}
        >
          {timeFormatted}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.62rem',
            color: 'var(--ink-dust)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {dateFormatted}
        </span>
      </div>

      {/* Column 2: Human Thought Content & Metadata */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          minWidth: 0,
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.18rem',
            lineHeight: '1.65',
            color: 'var(--ink-bone)',
            margin: 0,
            wordBreak: 'break-word',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {fragment.content}
        </p>

        {/* Metadata Strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <Badge variant="neutral" size="sm">
            REF #{fragment.id.slice(0, 8)}
          </Badge>

          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              color: 'var(--ink-dust)',
              letterSpacing: '0.04em',
            }}
          >
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </span>

          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              color: 'var(--ink-dust)',
            }}
          >
            ·
          </span>

          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              color: 'var(--ink-dust)',
              textTransform: 'uppercase',
            }}
          >
            {fragment.modality}
          </span>
        </div>
      </div>

      {/* Column 3: Subtle Action Affordance */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isHovered ? 'var(--ink-bone)' : 'var(--ink-dust)',
          transform: isHovered ? 'translateX(2px)' : 'none',
          transition: `all var(--duration-micro) var(--ease-precise)`,
          paddingLeft: '8px',
        }}
        aria-hidden="true"
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '1rem',
            fontWeight: 700,
          }}
        >
          →
        </span>
      </div>
    </article>
  );
}
