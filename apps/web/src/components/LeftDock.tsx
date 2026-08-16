'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function LeftDock() {
  const pathname = usePathname();
  const isCapture = pathname === '/' || pathname === '/capture';
  const isSearch = pathname === '/search';

  const handleScrollToRecent = (e: React.MouseEvent) => {
    if (pathname === '/' || pathname === '/capture') {
      const recentSection = document.getElementById('recent-stream-section');
      if (recentSection) {
        e.preventDefault();
        recentSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <aside
      aria-label="Application dock"
      style={{
        position: 'fixed',
        left: '20px',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 30,
      }}
      className="left-dock-container"
    >
      {/* 1. Capture / Write Mode Icon */}
      <Link
        href="/"
        aria-label="Capture Mode"
        title="Capture Mode"
        style={{
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isCapture ? 'var(--surface-pure)' : 'transparent',
          border: isCapture ? '1.5px solid var(--ink-bone)' : '1px solid var(--border-hairline)',
          boxShadow: isCapture ? '1.5px 2px 0px rgba(0, 0, 0, 0.15)' : 'none',
          color: 'var(--ink-bone)',
          transition: 'all var(--duration-fast)',
          cursor: 'pointer',
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="square"
          strokeLinejoin="miter"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </Link>

      {/* 2. Search / Recall Mode Icon (Framed square when active) */}
      <Link
        href="/search"
        aria-label="Search Mode"
        title="Search Memories"
        style={{
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isSearch ? 'var(--surface-pure)' : 'transparent',
          border: isSearch ? '1.5px solid var(--ink-bone)' : '1px solid var(--border-hairline)',
          boxShadow: isSearch ? '1.5px 2px 0px rgba(0, 0, 0, 0.15)' : 'none',
          color: 'var(--ink-bone)',
          transition: 'all var(--duration-fast)',
          cursor: 'pointer',
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="square"
          strokeLinejoin="miter"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </Link>

      {/* 3. Recent Stream / Archive Icon */}
      <Link
        href="/#recent-stream-section"
        onClick={handleScrollToRecent}
        aria-label="Recent Stream Archive"
        title="Scroll to Recent Stream Archive"
        style={{
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
          border: '1px solid var(--border-hairline)',
          color: 'var(--ink-dust)',
          transition: 'all var(--duration-fast)',
          cursor: 'pointer',
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="square"
          strokeLinejoin="miter"
        >
          <polyline points="21 8 21 21 3 21 3 8" />
          <rect x="1" y="3" width="22" height="5" />
          <line x1="10" y1="12" x2="14" y2="12" />
        </svg>
      </Link>

      <style jsx>{`
        @media (max-width: 900px) {
          .left-dock-container {
            display: none !important;
          }
        }
      `}</style>
    </aside>
  );
}
