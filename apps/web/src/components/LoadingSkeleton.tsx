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
        gap: '10px',
        width: '100%',
      }}
      aria-busy="true"
      aria-label="Loading thoughts"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            backgroundColor: 'var(--surface-pure)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-slip)',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            boxShadow: 'var(--shadow-entry)',
          }}
        >
          <div
            style={{
              height: '13px',
              width: `${Math.floor(70 + (i * 13) % 25)}%`,
              backgroundColor: 'var(--surface-raised)',
              borderRadius: 'var(--radius-stamp)',
              animation: 'pulse 1.6s ease-in-out infinite',
            }}
          />
          <div
            style={{
              height: '13px',
              width: `${Math.floor(40 + (i * 19) % 35)}%`,
              backgroundColor: 'var(--surface-raised)',
              borderRadius: 'var(--radius-stamp)',
              animation: 'pulse 1.6s ease-in-out infinite',
            }}
          />
        </div>
      ))}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.8;
          }
          50% {
            opacity: 0.35;
          }
        }
      `}</style>
    </div>
  );
}
