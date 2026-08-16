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
      aria-label="Navigation dock"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        backgroundColor: 'var(--bg-surface)',
        border: '1.5px solid var(--text-primary)',
        boxShadow: 'var(--shadow-dock)',
        display: 'flex',
        alignItems: 'center',
        padding: '3px',
      }}
    >
      {/* Capture Mode Button */}
      <Link
        href="/"
        aria-label="Capture thought"
        aria-current={isCapture ? 'page' : undefined}
        title="Capture Mode"
        style={{
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isCapture ? 'var(--text-primary)' : 'transparent',
          color: isCapture ? 'var(--bg-canvas)' : 'var(--text-primary)',
          transition: 'all var(--duration-fast) ease-out',
          cursor: 'pointer',
        }}
      >
        {/* Subtle Stipple Grid / Ink Thought Icon (as in reference) */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="square"
          strokeLinejoin="miter"
          aria-hidden="true"
        >
          {/* Writing Quill / Note Icon */}
          <path d="M12 19l7-7 3 3-7 7-3-3z" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          <path d="M2 2l7.586 7.586" />
          <circle cx="11" cy="11" r="2" />
        </svg>
      </Link>

      {/* Divider */}
      <div
        style={{
          width: '1px',
          height: '24px',
          backgroundColor: 'var(--border-hairline)',
        }}
      />

      {/* Search Mode Button */}
      <Link
        href="/search"
        aria-label="Search memories"
        aria-current={isSearch ? 'page' : undefined}
        title="Remember & Search"
        style={{
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isSearch ? 'var(--text-primary)' : 'transparent',
          color: isSearch ? 'var(--bg-canvas)' : 'var(--text-primary)',
          transition: 'all var(--duration-fast) ease-out',
          cursor: 'pointer',
        }}
      >
        {/* Architectural Lens / Diamond Search Icon */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="square"
          strokeLinejoin="miter"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <path d="M11 8v6M8 11h6" />
        </svg>
      </Link>
    </nav>
  );
}
