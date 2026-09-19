import React from 'react';
import { tokens } from './index';

export interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'canvas' | 'pure' | 'raised' | 'card';
  hasSlipShadow?: boolean;
  hasFramingMarks?: boolean;
}

export function Surface({
  children,
  variant = 'pure',
  hasSlipShadow = false,
  hasFramingMarks = false,
  style,
  ...props
}: SurfaceProps) {
  const variantStyles: Record<NonNullable<SurfaceProps['variant']>, React.CSSProperties> = {
    canvas: {
      backgroundColor: tokens.colors.canvasParchment,
      borderColor: 'transparent',
    },
    pure: {
      backgroundColor: tokens.colors.surfacePure,
      borderColor: tokens.colors.borderStructural,
    },
    raised: {
      backgroundColor: tokens.colors.surfaceRaised,
      borderColor: tokens.colors.borderHairline,
    },
    card: {
      backgroundColor: tokens.colors.surfacePure,
      borderColor: tokens.colors.inkBone,
      boxShadow: tokens.shadows.card,
    },
  };

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: tokens.radius.slip,
        borderWidth: '1.5px',
        borderStyle: 'solid',
        boxShadow: hasSlipShadow ? tokens.shadows.slip : undefined,
        boxSizing: 'border-box',
        ...variantStyles[variant],
        ...style,
      }}
      {...props}
    >
      {hasFramingMarks && (
        <>
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '4px',
              left: '6px',
              fontSize: '10px',
              color: tokens.colors.inkDust,
              fontFamily: tokens.typography.fontMono,
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          >
            ┌
          </span>
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '4px',
              right: '6px',
              fontSize: '10px',
              color: tokens.colors.inkDust,
              fontFamily: tokens.typography.fontMono,
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          >
            ┐
          </span>
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              bottom: '4px',
              left: '6px',
              fontSize: '10px',
              color: tokens.colors.inkDust,
              fontFamily: tokens.typography.fontMono,
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          >
            └
          </span>
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              bottom: '4px',
              right: '6px',
              fontSize: '10px',
              color: tokens.colors.inkDust,
              fontFamily: tokens.typography.fontMono,
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          >
            ┘
          </span>
        </>
      )}
      {children}
    </div>
  );
}
