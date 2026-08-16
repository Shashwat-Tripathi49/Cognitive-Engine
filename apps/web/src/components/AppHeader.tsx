'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, SignInButton, useUser } from '@clerk/nextjs';

export function AppHeader() {
  const pathname = usePathname();
  const isCapture = pathname === '/' || pathname === '/capture';
  const isSearch = pathname === '/search';
  const { isSignedIn, isLoaded } = useUser();

  return (
    <header
      style={{
        width: '100%',
        backgroundColor: 'var(--canvas-bg)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        borderBottom: '1px solid var(--border-hairline)',
      }}
    >
      <div
        style={{
          maxWidth: '820px',
          margin: '0 auto',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left: Avatar & CE Monogram */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              backgroundColor: 'var(--surface-raised)',
              border: '1px solid var(--border-structural)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              fontWeight: 700,
              color: 'var(--ink-bone)',
            }}
          >
            CE
          </div>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              color: 'var(--ink-bone)',
            }}
          >
            COGNITIVE ENGINE
          </span>
        </Link>

        {/* Center: Framed Horizontal Mode Toggle (CAPTURE | SEARCH) */}
        <nav
          role="tablist"
          aria-label="Mode Selection"
          style={{
            display: 'flex',
            alignItems: 'center',
            border: '1px solid var(--border-structural)',
            backgroundColor: 'var(--surface-pure)',
            boxShadow: '1px 1.5px 0px rgba(0, 0, 0, 0.12)',
            padding: '2px',
            gap: '2px',
          }}
        >
          <Link
            href="/"
            role="tab"
            aria-selected={isCapture}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '4px 12px',
              backgroundColor: isCapture ? 'var(--ink-bone)' : 'transparent',
              color: isCapture ? 'var(--ink-inverse)' : 'var(--ink-zinc)',
              textDecoration: 'none',
              transition: 'all var(--duration-fast)',
              cursor: 'pointer',
            }}
          >
            CAPTURE
          </Link>

          <Link
            href="/search"
            role="tab"
            aria-selected={isSearch}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '4px 12px',
              backgroundColor: isSearch ? 'var(--ink-bone)' : 'transparent',
              color: isSearch ? 'var(--ink-inverse)' : 'var(--ink-zinc)',
              textDecoration: 'none',
              transition: 'all var(--duration-fast)',
              cursor: 'pointer',
            }}
          >
            SEARCH
          </Link>
        </nav>

        {/* Right: Auth / Menu Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isLoaded && (
            <>
              {isSignedIn ? (
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: {
                        width: '24px',
                        height: '24px',
                        borderRadius: '0px',
                        border: '1px solid var(--border-structural)',
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
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      padding: '3px 8px',
                      backgroundColor: 'transparent',
                      color: 'var(--ink-zinc)',
                      border: '1px solid var(--border-structural)',
                      cursor: 'pointer',
                    }}
                  >
                    SIGN IN
                  </button>
                </SignInButton>
              )}
            </>
          )}

          {/* Three dots menu indicator */}
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '1rem',
              color: 'var(--ink-bone)',
              lineHeight: 1,
              userSelect: 'none',
            }}
          >
            ⋮
          </span>
        </div>
      </div>
    </header>
  );
}
