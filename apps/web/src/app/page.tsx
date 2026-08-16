'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { CognitiveFragment } from '@cognitive-engine/shared';
import { AppHeader } from '../components/AppHeader';
import { FragmentCard } from '../components/FragmentCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { useApi } from '../lib/api';

export default function CapturePage() {
  const [fragments, setFragments] = useState<CognitiveFragment[]>([]);
  const [text, setText] = useState('');
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
    } catch {
      setError('Local memory database is currently offline. Start PostgreSQL container to sync live entries.');
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchRecentCaptures();
  }, [fetchRecentCaptures]);

  const handleCapture = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      // 1. Submit capture to server
      await api.createCapture(trimmed);
      setText('');
      // 2. Revalidate canonical state from server database
      await fetchRecentCaptures();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to record thought. Please check your database connection.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleCapture();
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--canvas-bg)' }}>
      {/* Top Masthead Navigation */}
      <AppHeader />

      {/* Main Column */}
      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '760px',
          margin: '0 auto',
          padding: '36px 24px 80px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '36px',
          position: 'relative',
        }}
      >
        {/* Heading Section */}
        <section
          aria-label="Capture Introduction"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            position: 'relative',
            paddingTop: '6px',
          }}
        >
          {/* Corner Crop Marks */}
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '-12px',
              left: '-8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--ink-dust)',
              opacity: 0.5,
              lineHeight: 1,
            }}
          >
            ┌
          </span>
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '-12px',
              right: '-8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--ink-dust)',
              opacity: 0.5,
              lineHeight: 1,
            }}
          >
            ┐
          </span>

          <h1
            style={{
              fontFamily: 'var(--font-headline)',
              fontSize: '2.5rem',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              color: 'var(--ink-bone)',
              lineHeight: 1.1,
            }}
          >
            Capture a thought
          </h1>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--ink-dust)',
              fontWeight: 500,
            }}
          >
            Personal Thinking Ledger
          </span>
        </section>

        {/* The Signature Writing Slip */}
        <section aria-label="Journal Input Surface" style={{ position: 'relative', width: '100%' }}>
          {/* Tilted Backing Slip */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'var(--surface-raised)',
              border: '1.5px solid var(--border-structural)',
              transform: 'rotate(0.35deg) translate(3px, 4px)',
              zIndex: 0,
            }}
          />

          <form
            onSubmit={handleCapture}
            style={{
              position: 'relative',
              zIndex: 1,
              width: '100%',
              backgroundColor: 'var(--surface-pure)',
              border: '1.5px solid var(--ink-bone)',
              boxShadow: '2.5px 3.5px 0px rgba(0, 0, 0, 0.15)',
              padding: '20px 24px 18px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {/* Corner Crop Marks */}
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: '6px',
                left: '8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--ink-bone)',
                lineHeight: 1,
              }}
            >
              ┌
            </span>
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: '6px',
                right: '8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--ink-bone)',
                lineHeight: 1,
              }}
            >
              ┐
            </span>
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                bottom: '6px',
                left: '8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--ink-bone)',
                lineHeight: 1,
              }}
            >
              └
            </span>
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                bottom: '6px',
                right: '8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--ink-bone)',
                lineHeight: 1,
              }}
            >
              ┘
            </span>

            {/* Field Label */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <label
                htmlFor="capture-input-area"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--ink-dust)',
                  fontWeight: 500,
                }}
              >
                New Entry
              </label>

              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  color: 'var(--ink-dust)',
                  letterSpacing: '0.04em',
                }}
              >
                ⌘+ENTER
              </span>
            </div>

            {/* Writing Textarea */}
            <textarea
              id="capture-input-area"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What is preoccupying your attention right now? Record a reflection, observation, or idea..."
              disabled={isSubmitting}
              rows={4}
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                color: 'var(--ink-bone)',
                border: 'none',
                borderBottom: '1px solid var(--border-structural)',
                borderRadius: 0,
                outline: 'none',
                resize: 'vertical',
                minHeight: '90px',
                fontSize: '1.05rem',
                lineHeight: '1.65',
                fontFamily: 'var(--font-body)',
                paddingBottom: '8px',
              }}
            />

            {/* Submit Action */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
              <button
                type="submit"
                disabled={!text.trim() || isSubmitting}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  backgroundColor: !text.trim() || isSubmitting ? 'var(--surface-raised)' : 'var(--ink-bone)',
                  color: !text.trim() || isSubmitting ? 'var(--ink-dust)' : 'var(--ink-inverse)',
                  border: '1px solid var(--ink-bone)',
                  padding: '8px 20px',
                  cursor: !text.trim() || isSubmitting ? 'default' : 'pointer',
                  transition: 'all var(--duration-fast)',
                  boxShadow: text.trim() && !isSubmitting ? '1.5px 2px 0px rgba(0,0,0,0.2)' : 'none',
                }}
              >
                {isSubmitting ? 'Recording...' : 'Record Thought'}
              </button>
            </div>
          </form>
        </section>

        {/* Recent Captured Stream Section */}
        <section
          id="recent-stream-section"
          aria-label="Recent Stream"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              paddingBottom: '8px',
              borderBottom: '1.5px solid var(--border-structural)',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-headline)',
                fontSize: '1.65rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: 'var(--ink-bone)',
              }}
            >
              Recent Stream
            </h2>

            {fragments.length > 0 && (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  color: 'var(--ink-dust)',
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
                backgroundColor: 'var(--accent-ochre-bg)',
                border: '1px solid var(--accent-ochre)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: 'var(--ink-bone)',
                fontFamily: 'var(--font-body)',
              }}
            >
              <span style={{ fontSize: '0.875rem' }}>{error}</span>
              <button
                type="button"
                onClick={fetchRecentCaptures}
                style={{
                  padding: '4px 12px',
                  backgroundColor: 'var(--surface-pure)',
                  border: '1px solid var(--border-structural)',
                  color: 'var(--ink-bone)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
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
              title="Your thinking ledger is open"
              description="Record your first observation or thought above to begin building your indexed personal memory stream."
            />
          )}

          {/* Populated Fragment Stream */}
          {!isLoading && !error && fragments.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                width: '100%',
              }}
            >
              {fragments.map((fragment, index) => (
                <FragmentCard
                  key={fragment.id}
                  fragment={fragment}
                  index={index}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
