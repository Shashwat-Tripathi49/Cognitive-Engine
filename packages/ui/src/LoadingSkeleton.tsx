import React from 'react';
import { tokens } from './index';

export interface LoadingSkeletonProps {
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
      aria-label="Loading archival entries"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            backgroundColor: tokens.colors.surfacePure,
            border: `1px solid ${tokens.colors.borderHairline}`,
            borderRadius: tokens.radius.slip,
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            boxShadow: tokens.shadows.card,
          }}
        >
          <div
            style={{
              height: '14px',
              width: `${Math.floor(65 + (i * 13) % 25)}%`,
              backgroundColor: tokens.colors.surfaceRaised,
              borderRadius: tokens.radius.stamp,
              animation: 'ce-pulse 1.8s ease-in-out infinite',
            }}
          />
          <div
            style={{
              height: '14px',
              width: `${Math.floor(40 + (i * 19) % 35)}%`,
              backgroundColor: tokens.colors.surfaceRaised,
              borderRadius: tokens.radius.stamp,
              animation: 'ce-pulse 1.8s ease-in-out infinite',
            }}
          />
        </div>
      ))}
    </div>
  );
}
