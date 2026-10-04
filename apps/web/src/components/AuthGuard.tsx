'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { usePathname, useRouter } from 'next/navigation';

/**
 * AuthGuard ensures that unauthenticated visitors are immediately redirected
 * to the custom /sign-in page before any protected UI is rendered, preventing
 * content flashes upon initial deployment link visits or page reloads.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = pathname?.startsWith('/sign-in') || pathname?.startsWith('/sign-up');

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn && !isPublic) {
      const redirectParam =
        pathname && pathname !== '/'
          ? `?redirect_url=${encodeURIComponent(pathname)}`
          : '';
      router.replace(`/sign-in${redirectParam}`);
    } else if (isSignedIn && isPublic) {
      router.replace('/');
    }
  }, [isLoaded, isSignedIn, isPublic, pathname, router]);

  // For non-public routes: do not render children until authentication is verified
  if (!isPublic && (!isLoaded || !isSignedIn)) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0f',
          color: '#8052ff',
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '0.8rem',
          letterSpacing: '0.08em',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            border: '2px solid rgba(128, 82, 255, 0.2)',
            borderTopColor: '#8052ff',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <span style={{ color: '#888899', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          Verifying access…
        </span>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
}
