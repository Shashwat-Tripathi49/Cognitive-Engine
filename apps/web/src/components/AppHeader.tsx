'use client';

import React from 'react';
import Link from 'next/link';
import { UserButton, SignInButton, useUser } from '@clerk/nextjs';

export function AppHeader() {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <header
      style={{
        width: '100%',
        borderBottom: '1px solid var(--border-hairline)',
        backgroundColor: 'var(--bg-canvas)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <div
        style={{
          maxWidth: '680px',
          margin: '0 auto',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Editorial Brand Mark */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '8px',
            textDecoration: 'none',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: '1.45rem',
              fontWeight: 400,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            Cognitive Engine
          </span>
        </Link>

        {/* Right side: Auth Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isLoaded && (
            <>
              {isSignedIn ? (
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: {
                        width: '28px',
                        height: '28px',
                        borderRadius: '2px',
                        border: '1px solid var(--border-strong)',
                      },
                    },
                  }}
                />
              ) : (
                <SignInButton mode="modal">
                  <button
                    type="button"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      padding: '6px 12px',
                      backgroundColor: 'transparent',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-hairline)',
                      borderRadius: 'var(--radius-xs)',
                      cursor: 'pointer',
                      transition: 'border-color var(--duration-fast)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-strong)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-hairline)';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                  >
                    Sign In
                  </button>
                </SignInButton>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
