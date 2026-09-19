import React from 'react';
import { tokens } from './index';

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        padding: '36px 24px',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        border: `1px dashed ${tokens.colors.borderStructural}`,
        backgroundColor: tokens.colors.surfaceRaised,
        borderRadius: tokens.radius.slip,
        boxSizing: 'border-box',
      }}
    >
      <span
        style={{
          fontFamily: tokens.typography.fontMono,
          fontSize: '0.68rem',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: tokens.colors.inkDust,
          fontWeight: 600,
        }}
      >
        INDEX // EMPTY
      </span>
      <h3
        style={{
          fontFamily: tokens.typography.fontHeadline,
          fontSize: '1.25rem',
          fontWeight: 700,
          color: tokens.colors.inkBone,
          letterSpacing: '-0.015em',
          margin: 0,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: '0.9rem',
          color: tokens.colors.inkStone,
          maxWidth: '60ch',
          lineHeight: '1.6',
          fontFamily: tokens.typography.fontSerif,
          fontStyle: 'italic',
          margin: 0,
        }}
      >
        {description}
      </p>
      {action && <div style={{ marginTop: '12px' }}>{action}</div>}
    </div>
  );
}
