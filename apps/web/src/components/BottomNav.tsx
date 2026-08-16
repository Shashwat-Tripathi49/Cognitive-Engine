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
      aria-label="Mode switcher dock"
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        backgroundColor: 'var(--surface-pure)',
        border: '1.5px solid var(--border-structural)',
        boxShadow: 'var(--shadow-dock)',
        display: 'flex',
        padding: '2px',
      }}
    >
      {/* Record Mode Tab */}
      <Link
        href="/"
        aria-current={isCapture ? 'page' : undefined}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          fontWeight: 500,
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: isCapture ? 'var(--ink-bone)' : 'transparent',
          color: isCapture ? 'var(--ink-inverse)' : 'var(--ink-zinc)',
          textDecoration: 'none',
          transition: 'all var(--duration-fast)',
          cursor: 'pointer',
        }}
      >
        <span style={{ opacity: isCapture ? 0.7 : 0.4 }}>[01]</span>
        <span>RECORD</span>
      </Link>

      {/* Recall Mode Tab */}
      <Link
        href="/search"
        aria-current={isSearch ? 'page' : undefined}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          fontWeight: 500,
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: isSearch ? 'var(--ink-bone)' : 'transparent',
          color: isSearch ? 'var(--ink-inverse)' : 'var(--ink-zinc)',
          textDecoration: 'none',
          transition: 'all var(--duration-fast)',
          cursor: 'pointer',
        }}
      >
        <span style={{ opacity: isSearch ? 0.7 : 0.4 }}>[02]</span>
        <span>RECALL</span>
      </Link>
    </nav>
  );
}
