'use client';

import React from 'react';

interface LoadingSkeletonProps {
  count?: number;
}

export function LoadingSkeleton({ count = 3 }: LoadingSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading content"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div
            className="skeleton-line"
            style={{
              width: `${75 + (i % 3) * 10}%`,
              height: '16px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
            }}
          />
          <div
            className="skeleton-line"
            style={{
              width: `${40 + (i % 2) * 20}%`,
              height: '14px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
            }}
          />
        </div>
      ))}

      <style jsx>{`
        .skeleton-line {
          animation: skeleton-pulse 1.5s ease-in-out infinite;
        }

        @keyframes skeleton-pulse {
          0% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
