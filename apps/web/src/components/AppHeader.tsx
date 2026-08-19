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
        borderBottom: '1.5px solid var(--border-structural)',
      }}
    >
      <div
        style={{
          width: '100%',
          padding: '12px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left: Vintage Archival Crest Emblem & Brand Label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
            }}
          >
            {/* Vintage CE Archival Crest Seal */}
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--surface-raised)',
                border: '1.5px solid var(--ink-bone)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '1px 1.5px 0px rgba(0, 0, 0, 0.15)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Classical Archival Engraving Stamp SVG */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--ink-bone)"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M6 20v-2a6 6 0 0 1 12 0v2" />
                <circle cx="12" cy="12" r="10" strokeDasharray="1 2" strokeWidth="1" />
              </svg>
            </div>

            <span
              style={{
                fontFamily: 'var(--font-headline)',
                fontSize: '1.15rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--ink-bone)',
              }}
            >
              CE
            </span>
          </Link>

          {/* Framed Archive Stamp Badge */}
          <Link
            href="/search"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '4px 10px',
              border: '1.5px solid var(--ink-bone)',
              backgroundColor: 'var(--surface-pure)',
              color: 'var(--ink-bone)',
              boxShadow: '1.5px 1.5px 0px rgba(0, 0, 0, 0.12)',
              transform: 'rotate(-0.5deg)',
              display: 'inline-block',
              transition: 'transform var(--duration-fast)',
            }}
          >
            ARCHIVE
          </Link>
        </div>

        {/* Center: Framed Mode Toggle (RECORD | SEARCH) */}
        <nav
          role="tablist"
          aria-label="Mode Selection"
          style={{
            display: 'flex',
            alignItems: 'center',
            border: '1.5px solid var(--ink-bone)',
            backgroundColor: 'var(--surface-pure)',
            boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.12)',
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
              fontSize: '0.72rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '6px 18px',
              backgroundColor: isCapture ? 'var(--action-espresso)' : 'transparent',
              color: isCapture ? 'var(--ink-inverse)' : 'var(--ink-stone)',
              textDecoration: 'none',
              transition: 'all var(--duration-fast)',
              cursor: 'pointer',
            }}
          >
            RECORD
          </Link>

          <Link
            href="/search"
            role="tab"
            aria-selected={isSearch}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '6px 18px',
              backgroundColor: isSearch ? 'var(--action-espresso)' : 'transparent',
              color: isSearch ? 'var(--ink-inverse)' : 'var(--ink-stone)',
              textDecoration: 'none',
              transition: 'all var(--duration-fast)',
              cursor: 'pointer',
            }}
          >
            SEARCH
          </Link>
        </nav>

        {/* Right: User Auth & Three-Dot Archival Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isLoaded && (
            <>
              {isSignedIn ? (
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: {
                        width: '28px',
                        height: '28px',
                        borderRadius: '0px',
                        border: '1.5px solid var(--ink-bone)',
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
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      padding: '5px 12px',
                      backgroundColor: 'transparent',
                      color: 'var(--ink-bone)',
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

          {/* Three-Dot Archival Context Indicator */}
          <span
            aria-hidden="true"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--ink-bone)',
              lineHeight: 1,
              userSelect: 'none',
              cursor: 'default',
            }}
          >
            ⋮
          </span>
        </div>
      </div>
    </header>
  );
}
