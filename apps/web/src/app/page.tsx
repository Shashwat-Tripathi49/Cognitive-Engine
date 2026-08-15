'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { CognitiveFragment } from '@cognitive-engine/shared';
import { AppHeader } from '../components/AppHeader';
import { CaptureInput } from '../components/CaptureInput';
import { FragmentCard } from '../components/FragmentCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
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
          maxWidth: '720px',
          width: '100%',
          margin: '0 auto',
          padding: '32px 20px 64px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '32px',
        }}
      >
        {/* Thought Input Section */}
        <section aria-label="Thought Capture Surface">
          <CaptureInput onCapture={handleCapture} isLoading={isSubmitting} />
        </section>

        {/* Recent Captured Thoughts Section */}
        <section
          aria-label="Recent Thoughts Trail"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '8px',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <h2
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Recent Thoughts
            </h2>

            {fragments.length > 0 && (
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                }}
              >
                {fragments.length} {fragments.length === 1 ? 'thought' : 'thoughts'}
              </span>
            )}
          </div>

          {/* Error Banner with Retry */}
          {error && (
            <div
              role="alert"
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'rgba(225, 112, 85, 0.12)',
                border: '1px solid var(--semantic-error)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: 'var(--text-primary)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--semantic-error)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span style={{ fontSize: '0.875rem' }}>{error}</span>
              </div>
              <button
                type="button"
                onClick={fetchRecentCaptures}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8125rem',
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
              title="Your thinking space is ready"
              description="Capture your first thought above to begin building your cognitive trail."
            />
          )}

          {/* Populated Fragment List */}
          {!isLoading && !error && fragments.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {fragments.map((fragment) => (
                <FragmentCard key={fragment.id} fragment={fragment} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
