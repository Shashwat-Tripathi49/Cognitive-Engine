'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { CognitiveFragment } from '@cognitive-engine/shared';
import { AppHeader } from '../components/AppHeader';
import { CaptureInput } from '../components/CaptureInput';
import { FragmentCard } from '../components/FragmentCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { BottomNav } from '../components/BottomNav';
import { useApi } from '../lib/api';

export default function CapturePage() {
  const [fragments, setFragments] = useState<CognitiveFragment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const api = useApi();

  const fetchRecentCaptures = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.listCaptures(1, 20);
      setFragments(response.data || []);
    } catch (err: unknown) {
      console.error('Failed to load recent thoughts:', err);
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to connect to Cognitive Engine API.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchRecentCaptures();
  }, [fetchRecentCaptures]);

  const handleCapture = async (text: string) => {
    setIsSubmitting(true);
    try {
      const newFragment = await api.createCapture(text);
      // Prepend the new fragment to state immediately
      setFragments((prev) => [newFragment, ...prev]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader />

      <main
        style={{
          flex: 1,
          maxWidth: '640px',
          width: '100%',
          margin: '0 auto',
          padding: '36px 20px 100px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '40px',
        }}
      >
        {/* Thought Writing Canvas */}
        <section aria-label="Thought Capture Canvas">
          <CaptureInput onCapture={handleCapture} isLoading={isSubmitting} />
        </section>

        {/* Recent Captured Thoughts Trail */}
        <section
          aria-label="Recent Thoughts Journal"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              paddingBottom: '10px',
              borderBottom: '1px solid var(--border-hairline)',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.25rem',
                fontWeight: 400,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              Recent Thoughts
            </h2>

            {fragments.length > 0 && (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                }}
              >
                {fragments.length} {fragments.length === 1 ? 'entry' : 'entries'}
              </span>
            )}
          </div>

          {/* Error Banner with Retry */}
          {error && (
            <div
              role="alert"
              style={{
                padding: '14px 18px',
                backgroundColor: 'var(--semantic-error-bg)',
                border: '1px solid var(--semantic-error)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <span style={{ fontSize: '0.875rem' }}>{error}</span>
              <button
                type="button"
                onClick={fetchRecentCaptures}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-hairline)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && !error && <LoadingSkeleton count={3} />}

          {/* Empty State */}
          {!isLoading && !error && fragments.length === 0 && (
            <EmptyState
              title="Your thinking canvas is open"
              description="Capture your first thought above to begin building your personal reflective archive."
            />
          )}

          {/* Populated Fragment Stream */}
          {!isLoading && !error && fragments.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              {fragments.map((fragment) => (
                <FragmentCard key={fragment.id} fragment={fragment} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Bespoke Framed Bottom Dock Navigation */}
      <BottomNav />
    </div>
  );
}
