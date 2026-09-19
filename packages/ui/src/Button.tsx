import React from 'react';
import { tokens } from './index';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      style,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isInteractive = !disabled && !isLoading;

    const baseStyles: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontFamily: tokens.typography.fontDisplay,
      fontWeight: 600,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      borderRadius: tokens.radius.stamp,
      cursor: isInteractive ? 'pointer' : 'not-allowed',
      opacity: disabled ? 0.45 : 1,
      transition: `all ${tokens.motion.duration.micro} ${tokens.motion.easing.precise}`,
      outline: 'none',
      userSelect: 'none',
      textDecoration: 'none',
      border: 'none',
      boxSizing: 'border-box',
    };

    const sizeStyles: Record<'sm' | 'md', React.CSSProperties> = {
      sm: {
        fontSize: '0.72rem',
        padding: '5px 12px',
        height: '28px',
      },
      md: {
        fontSize: '0.8rem',
        padding: '8px 18px',
        height: '38px',
      },
    };

    const variantStyles: Record<NonNullable<ButtonProps['variant']>, React.CSSProperties> = {
      primary: {
        backgroundColor: tokens.colors.actionEspresso,
        color: tokens.colors.inkInverse,
        border: `1.5px solid ${tokens.colors.inkBone}`,
        boxShadow: isInteractive ? tokens.shadows.slip : 'none',
      },
      secondary: {
        backgroundColor: tokens.colors.surfacePure,
        color: tokens.colors.inkBone,
        border: `1.5px solid ${tokens.colors.borderStructural}`,
        boxShadow: isInteractive ? '1px 1.5px 0px rgba(0, 0, 0, 0.08)' : 'none',
      },
      ghost: {
        backgroundColor: 'transparent',
        color: tokens.colors.inkStone,
        border: '1px solid transparent',
      },
      danger: {
        backgroundColor: tokens.colors.statusErrorBg,
        color: tokens.colors.statusError,
        border: `1px solid ${tokens.colors.statusErrorBorder}`,
      },
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={!isInteractive}
        style={{
          ...baseStyles,
          ...sizeStyles[size],
          ...variantStyles[variant],
          ...style,
        }}
        onMouseEnter={(e) => {
          if (!isInteractive) return;
          if (variant === 'primary') {
            e.currentTarget.style.backgroundColor = tokens.colors.actionEspressoHover;
          } else if (variant === 'secondary' || variant === 'ghost') {
            e.currentTarget.style.backgroundColor = tokens.colors.surfaceRaised;
          }
        }}
        onMouseLeave={(e) => {
          if (!isInteractive) return;
          if (variant === 'primary') {
            e.currentTarget.style.backgroundColor = tokens.colors.actionEspresso;
          } else if (variant === 'secondary') {
            e.currentTarget.style.backgroundColor = tokens.colors.surfacePure;
          } else if (variant === 'ghost') {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
        {...props}
      >
        {isLoading && (
          <span
            aria-hidden="true"
            style={{
              width: '12px',
              height: '12px',
              border: `2px solid currentColor`,
              borderRightColor: 'transparent',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'ce-spin 0.7s linear infinite',
            }}
          />
        )}
        {!isLoading && leftIcon}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
