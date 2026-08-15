'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AppHeader() {
  const pathname = usePathname();
  const isCapture = pathname === '/' || pathname === '/capture';
  const isSearch = pathname === '/search';

  return (
    <header
      style={{
        width: '100%',
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'rgba(10, 10, 15, 0.8)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
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
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 3v3m0 12v3M3 12h3m12 0h3" />
            </svg>
          </div>
          <span
            style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            Cognitive Engine
          </span>
        </Link>

        {/* Minimal Thought Modes Toggle */}
        <nav
          aria-label="Application navigation"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <Link
            href="/"
            aria-current={isCapture ? 'page' : undefined}
            style={{
              padding: '6px 16px',
              fontSize: '0.875rem',
              fontWeight: isCapture ? 600 : 400,
              borderRadius: 'var(--radius-full)',
              color: isCapture ? 'var(--text-primary)' : 'var(--text-secondary)',
              backgroundColor: isCapture ? 'var(--accent-primary)' : 'transparent',
              transition: 'all var(--duration-fast) ease-out',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <svg
              width="14"
              height="14"
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
            Capture
          </Link>

          <Link
            href="/search"
            aria-current={isSearch ? 'page' : undefined}
            style={{
              padding: '6px 16px',
              fontSize: '0.875rem',
              fontWeight: isSearch ? 600 : 400,
              borderRadius: 'var(--radius-full)',
              color: isSearch ? 'var(--text-primary)' : 'var(--text-secondary)',
              backgroundColor: isSearch ? 'var(--accent-primary)' : 'transparent',
              transition: 'all var(--duration-fast) ease-out',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Search
          </Link>
        </nav>
      </div>
    </header>
  );
}
