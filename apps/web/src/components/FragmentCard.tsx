'use client';

import React, { useMemo } from 'react';
import type { CognitiveFragment } from '@cognitive-engine/shared';
import { formatRelativeTime } from '../lib/utils';

interface FragmentCardProps {
  fragment: CognitiveFragment;
  index?: number;
}

// Generate consistent archival reference number from ID or index
function getRefId(id: string | undefined, index: number): string {
  if (!id) return String(1000 + index * 37);
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return String(Math.abs(hash % 9000) + 1000);
}

// Extract tags from content
function extractTags(content: string): string[] {
  const words = content
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 5);

  const unique = Array.from(new Set(words.map((w) => w.toUpperCase())));
  if (unique.length >= 2) return unique.slice(0, 2);
  if (unique.length === 1) return [unique[0], 'LEDGER'];
  return ['LEDGER', 'THOUGHT'];
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

  const refId = useMemo(() => getRefId(fragment.id, index), [fragment.id, index]);
  const tags = useMemo(() => extractTags(fragment.content), [fragment.content]);

  // Extract a high-impact title and body
  const { title, body } = useMemo(() => {
    const parts = fragment.content.split(/\n|\.\s+/);
    if (parts.length > 1 && parts[0].trim().length > 3 && parts[0].trim().length < 60) {
      return {
        title: parts[0].trim(),
        body: fragment.content.slice(parts[0].length).trim().replace(/^\.?\s*/, ''),
      };
    }
    if (fragment.content.length > 50) {
      const breakIdx = fragment.content.lastIndexOf(' ', 42);
      const cutoff = breakIdx > 15 ? breakIdx : 42;
      return {
        title: fragment.content.slice(0, cutoff),
        body: fragment.content.slice(cutoff).trim(),
      };
    }
    return {
      title: fragment.content,
      body: '',
    };
  }, [fragment.content]);

  const rotationAngle = useMemo(() => {
    const angles = ['0deg', '-0.3deg', '0.35deg', '-0.25deg', '0.2deg'];
    return angles[index % angles.length];
  }, [index]);

  return (
    <article
      style={{
        backgroundColor: 'var(--surface-pure)',
        border: '1.5px solid var(--ink-bone)',
        boxShadow: 'var(--shadow-card)',
        padding: '22px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        transform: rotationAngle,
        transition: 'transform var(--duration-fast), box-shadow var(--duration-fast)',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '3px 4px 0px rgba(0,0,0,0.18)';
        e.currentTarget.style.transform = 'none';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
        e.currentTarget.style.transform = rotationAngle;
      }}
    >
      {/* Top Header Row: Archival Ref Stamp */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          width: '100%',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            color: 'var(--ink-dust)',
            fontWeight: 600,
            letterSpacing: '0.08em',
          }}
        >
          REF: {refId}
        </span>
      </div>

      {/* Main Content Layout with Icon Glyph */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        {/* Archival Document Icon Box */}
        <div
          style={{
            width: '40px',
            height: '40px',
            flexShrink: 0,
            backgroundColor: 'var(--surface-raised)',
            border: '1px solid var(--border-structural)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--ink-bone)"
            strokeWidth="2"
            strokeLinecap="square"
            aria-hidden="true"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </div>

        {/* Title and Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontFamily: 'var(--font-headline)',
              fontSize: '1.45rem',
              fontWeight: 700,
              lineHeight: '1.25',
              letterSpacing: '-0.015em',
              color: 'var(--ink-bone)',
            }}
          >
            {title}
          </h3>

          {body && (
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.02rem',
                lineHeight: '1.6',
                color: 'var(--ink-stone)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {body}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Row: Taxonomy Tag Pills & Archival Metadata */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          paddingTop: '12px',
          borderTop: '1px solid var(--border-hairline)',
        }}
      >
        {/* Taxonomy Tags */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                padding: '4px 10px',
                backgroundColor: 'var(--tag-bg)',
                color: 'var(--ink-stone)',
                border: '1px solid var(--border-hairline)',
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Timestamp */}
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.68rem',
            color: 'var(--ink-dust)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>{formattedTime}</span>
          <span>•</span>
          <time dateTime={new Date(fragment.capturedAt).toISOString()} title={fullDate}>
            {fullDate}
          </time>
        </div>
      </div>
    </article>
  );
}
