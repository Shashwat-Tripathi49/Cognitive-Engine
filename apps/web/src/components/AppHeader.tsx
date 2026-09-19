'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, SignInButton, useUser } from '@clerk/nextjs';

export function AppHeader() {
  const pathname = usePathname();
  const isCapture = pathname === '/' || pathname === '/capture';
  const isArchives = pathname.startsWith('/archives') || pathname === '/search';
  const isInsights = pathname.startsWith('/insights');
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
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxSizing: 'border-box',
        }}
      >
        {/* Left: Archival Crest Emblem & Brand Label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            href="/"
            aria-label="Cognitive Engine Home"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
            }}
          >
            {/* Archival Seal */}
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: 'var(--surface-raised)',
                border: '1.5px solid var(--ink-bone)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '1px 1.5px 0px rgba(0, 0, 0, 0.12)',
              }}
            >
              <svg
                width="18"
                height="18"
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

          {/* Framed Ledger Stamp Badge */}
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '3px 8px',
              border: '1px solid var(--border-structural)',
              backgroundColor: 'var(--surface-pure)',
              color: 'var(--ink-bone)',
              borderRadius: '1px',
              display: 'inline-block',
            }}
          >
            ARCHIVAL LEDGER
          </span>
        </div>

        {/* Center: Mode Tabs (RECORD | ARCHIVES | INSIGHTS) */}
        <nav
          role="tablist"
          aria-label="Navigation Mode"
          style={{
            display: 'flex',
            alignItems: 'center',
            border: '1.5px solid var(--ink-bone)',
            backgroundColor: 'var(--surface-pure)',
            boxShadow: '1.5px 1.5px 0px rgba(0, 0, 0, 0.12)',
            padding: '2px',
            gap: '2px',
            borderRadius: '1px',
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
              padding: '5px 14px',
              backgroundColor: isCapture ? 'var(--action-espresso)' : 'transparent',
              color: isCapture ? 'var(--ink-inverse)' : 'var(--ink-stone)',
              textDecoration: 'none',
              transition: 'all var(--duration-micro) var(--ease-precise)',
              cursor: 'pointer',
              borderRadius: '1px',
            }}
          >
            RECORD
          </Link>

          <Link
            href="/archives"
            role="tab"
            aria-selected={isArchives}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '5px 14px',
              backgroundColor: isArchives ? 'var(--action-espresso)' : 'transparent',
              color: isArchives ? 'var(--ink-inverse)' : 'var(--ink-stone)',
              textDecoration: 'none',
              transition: 'all var(--duration-micro) var(--ease-precise)',
              cursor: 'pointer',
              borderRadius: '1px',
            }}
          >
            ARCHIVES
          </Link>

          <Link
            href="/insights"
            role="tab"
            aria-selected={isInsights}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '5px 14px',
              backgroundColor: isInsights ? 'var(--action-espresso)' : 'transparent',
              color: isInsights ? 'var(--ink-inverse)' : 'var(--ink-stone)',
              textDecoration: 'none',
              transition: 'all var(--duration-micro) var(--ease-precise)',
              cursor: 'pointer',
              borderRadius: '1px',
            }}
          >
            INSIGHTS
          </Link>
        </nav>

        {/* Right: Auth & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {isLoaded && (
            <>
              {isSignedIn ? (
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: {
                        width: '28px',
                        height: '28px',
                        borderRadius: '1px',
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
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      padding: '5px 12px',
                      backgroundColor: 'var(--surface-pure)',
                      color: 'var(--ink-bone)',
                      border: '1px solid var(--border-structural)',
                      cursor: 'pointer',
                      borderRadius: '1px',
                    }}
                  >
                    SIGN IN
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
