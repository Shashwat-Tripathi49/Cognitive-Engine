import React from 'react';
import { tokens } from './index';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  isMonospace?: boolean;
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'sm',
  isMonospace = true,
  style,
  ...props
}: BadgeProps) {
  const variantStyles: Record<NonNullable<BadgeProps['variant']>, React.CSSProperties> = {
    neutral: {
      backgroundColor: tokens.colors.surfaceRaised,
      color: tokens.colors.inkStone,
      borderColor: tokens.colors.borderHairline,
    },
    success: {
      backgroundColor: tokens.colors.statusSuccessBg,
      color: tokens.colors.statusSuccess,
      borderColor: tokens.colors.statusSuccessBorder,
    },
    warning: {
      backgroundColor: tokens.colors.statusWarningBg,
      color: tokens.colors.statusWarning,
      borderColor: tokens.colors.statusWarningBorder,
    },
    error: {
      backgroundColor: tokens.colors.statusErrorBg,
      color: tokens.colors.statusError,
      borderColor: tokens.colors.statusErrorBorder,
    },
    info: {
      backgroundColor: tokens.colors.statusInfoBg,
      color: tokens.colors.statusInfo,
      borderColor: tokens.colors.statusInfoBorder,
    },
  };

  const sizeStyles: Record<'sm' | 'md', React.CSSProperties> = {
    sm: {
      fontSize: '0.65rem',
      padding: '2px 8px',
      letterSpacing: '0.08em',
    },
    md: {
      fontSize: '0.72rem',
      padding: '4px 10px',
      letterSpacing: '0.06em',
    },
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontFamily: isMonospace ? tokens.typography.fontMono : tokens.typography.fontDisplay,
        fontWeight: 600,
        textTransform: 'uppercase',
        borderRadius: tokens.radius.stamp,
        borderWidth: '1px',
        borderStyle: 'solid',
        lineHeight: 1.3,
        userSelect: 'none',
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}
