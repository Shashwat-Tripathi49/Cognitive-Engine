'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function BottomNav() {
  const pathname = usePathname();
  const isCapture = pathname === '/' || pathname === '/capture';
  const isSearch = pathname === '/search';

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

      {/* 2. Recall / Search Lens Icon */}
      <Link
        href="/search"
        aria-label="Search Mode"
        aria-current={isSearch ? 'page' : undefined}
        title="Search Memories"
        style={{
          width: '42px',
          height: '42px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isSearch ? 'var(--action-espresso)' : 'transparent',
          color: isSearch ? 'var(--ink-inverse)' : 'var(--ink-bone)',
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
          strokeWidth="2.2"
          strokeLinecap="square"
          strokeLinejoin="miter"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </Link>

      {/* 3. Archival Storage Box Icon */}
      <Link
        href="/search"
        aria-label="Archive Directory"
        title="Archive Directory"
        style={{
          width: '42px',
          height: '42px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
          color: 'var(--ink-bone)',
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
    </nav>
  );
}
