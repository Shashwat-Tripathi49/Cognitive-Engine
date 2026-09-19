'use client';

import React, { useState } from 'react';
import type { MemorySearchResult } from '@cognitive-engine/shared';
import { Badge } from '@cognitive-engine/ui';

interface MemoryResultCardProps {
  result: MemorySearchResult;
  index?: number;
  query?: string;
}

export function MemoryResultCard({ result, query = '' }: MemoryResultCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const { memory, sourceFragment, similarity } = result;
  const content = memory.content || sourceFragment?.content || '';
  const dateValue = memory.createdAt || sourceFragment?.capturedAt || new Date();
  const capturedDate = new Date(dateValue);

  const timeFormatted = capturedDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const dateFormatted = capturedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const refId = (memory.id || sourceFragment?.id || '').slice(0, 8);
  const similarityPct = typeof similarity === 'number' ? Math.round(similarity * 100) : null;

  // Highlight query keywords softly
  const renderHighlightedContent = (text: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || trimmedQuery.length < 2) return text;

    const words = trimmedQuery
      .split(/\s+/)
      .filter((w) => w.length > 1)
      .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    if (words.length === 0) return text;

    try {
      const regex = new RegExp(`(${words.join('|')})`, 'gi');
      const parts = text.split(regex);

      return parts.map((part, i) => {
        if (regex.test(part)) {
          return (
            <mark
              key={i}
              style={{
                backgroundColor: 'var(--highlight-bg)',
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
      return text;
    }
  };

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
      {/* Column 1: Time Stamp */}
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

      {/* Column 2: Content & Search Metadata */}
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
          {renderHighlightedContent(content)}
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
            REF #{refId}
          </Badge>

          {similarityPct !== null && (
            <Badge variant="info" size="sm">
              {similarityPct}% RELEVANCE
            </Badge>
          )}

          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              color: 'var(--ink-dust)',
              letterSpacing: '0.04em',
            }}
          >
            SEMANTIC MATCH
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
