'use client';

import React from 'react';

interface LoadingSkeletonProps {
  count?: number;
}

export function LoadingSkeleton({ count = 3 }: LoadingSkeletonProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
      }}
      aria-busy="true"
      aria-label="Loading content"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div
            style={{
              height: '14px',
              width: `${Math.floor(75 + (i * 12) % 20)}%`,
              backgroundColor: 'var(--bg-surface-hover)',
              borderRadius: 'var(--radius-xs)',
              animation: 'pulse 1.6s ease-in-out infinite',
            }}
          />
          <div
            style={{
              height: '14px',
              width: `${Math.floor(45 + (i * 17) % 35)}%`,
              backgroundColor: 'var(--bg-surface-hover)',
              borderRadius: 'var(--radius-xs)',
              animation: 'pulse 1.6s ease-in-out infinite',
            }}
          />
          <div
            style={{
              height: '10px',
              width: '20%',
              backgroundColor: 'var(--bg-surface-hover)',
              borderRadius: 'var(--radius-xs)',
              marginTop: '6px',
              animation: 'pulse 1.6s ease-in-out infinite',
            }}
          />
        </div>
      ))}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 0.25;
          }
        }
      `}</style>
    </div>
  );
}
