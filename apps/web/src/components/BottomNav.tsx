'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function BottomNav() {
  const pathname = usePathname();
  const isCapture = pathname === '/' || pathname === '/capture';
  const isArchives = pathname.startsWith('/archives') || pathname === '/search';
  const isInsights = pathname.startsWith('/insights');

  return (
    <nav
      aria-label="Tactile quick navigation dock"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        backgroundColor: 'var(--surface-pure)',
        border: '1.5px solid var(--ink-bone)',
        boxShadow: 'var(--shadow-dock)',
        display: 'flex',
        alignItems: 'center',
        padding: '3px',
        gap: '4px',
      }}
    >
      {/* 1. Record / Capture Note Icon */}
      <Link
        href="/"
        aria-label="Capture Mode"
        aria-current={isCapture ? 'page' : undefined}
        title="Record Thought"
        style={{
          width: '42px',
          height: '42px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isCapture ? 'var(--action-espresso)' : 'transparent',
          color: isCapture ? 'var(--ink-inverse)' : 'var(--ink-bone)',
          textDecoration: 'none',
          transition: 'all var(--duration-fast)',
          cursor: 'pointer',
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      </Link>

      {/* 2. Archives Directory Icon */}
      <Link
        href="/archives"
        aria-label="Archives"
        aria-current={isArchives ? 'page' : undefined}
        title="Archives & Search"
        style={{
          width: '42px',
          height: '42px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isArchives ? 'var(--action-espresso)' : 'transparent',
          color: isArchives ? 'var(--ink-inverse)' : 'var(--ink-bone)',
          textDecoration: 'none',
          transition: 'all var(--duration-fast)',
          cursor: 'pointer',
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="square"
          strokeLinejoin="miter"
          aria-hidden="true"
        >
          <polyline points="21 8 21 21 3 21 3 8" />
          <rect x="1" y="3" width="22" height="5" />
          <line x1="10" y1="12" x2="14" y2="12" />
        </svg>
      </Link>

      {/* 3. Insights / Cognitive Patterns Icon */}
      <Link
        href="/insights"
        aria-label="Insights"
        aria-current={isInsights ? 'page' : undefined}
        title="Cognitive Insights"
        style={{
          width: '42px',
          height: '42px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isInsights ? 'var(--action-espresso)' : 'transparent',
          color: isInsights ? 'var(--ink-inverse)' : 'var(--ink-bone)',
          textDecoration: 'none',
          transition: 'all var(--duration-fast)',
          cursor: 'pointer',
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      </Link>
    </nav>
  );
}
