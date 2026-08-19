'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { CognitiveFragment } from '@cognitive-engine/shared';
import { AppHeader } from '../components/AppHeader';
import { FragmentCard } from '../components/FragmentCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { BottomNav } from '../components/BottomNav';
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
      await api.createCapture(trimmed);
      setText('');
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
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--canvas-bg)',
      }}
    >
      {/* Top Masthead Navigation spanning full width */}
      <AppHeader />

      {/* Main Full-Screen Layout */}
      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '1600px',
          margin: '0 auto',
          padding: '32px 36px 120px 36px',
        }}
      >
        <div className="workbench-layout">
          {/* Left Column: Query / Capture Registry Box */}
          <div className="workbench-input-pane">
            {/* Section Header with Stitch Framing Marks */}
            <section
              aria-label="Capture Introduction"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                position: 'relative',
                paddingTop: '6px',
                marginBottom: '24px',
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
                  fontSize: '0.85rem',
                  color: 'var(--ink-dust)',
                  lineHeight: 1,
                  userSelect: 'none',
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
                  fontSize: '0.85rem',
                  color: 'var(--ink-dust)',
                  lineHeight: 1,
                  userSelect: 'none',
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
                Query Registry
              </h1>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: 'var(--ink-dust)',
                  fontWeight: 600,
                }}
              >
                SYS.INDEX // AWAITING INPUT
              </span>
            </section>

            {/* The Stitch Signature Writing Slip */}
            <section aria-label="Journal Input Surface" style={{ position: 'relative', width: '100%' }}>
              {/* Tilted Backing Slip */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'var(--surface-raised)',
                  border: '1.5px solid var(--border-structural)',
                  transform: 'rotate(0.4deg) translate(3px, 4px)',
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
                  boxShadow: 'var(--shadow-slip)',
                  padding: '24px 26px 20px 26px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                {/* Corner Crop Marks Inside Box */}
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

                {/* Field Label Row */}
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
                      letterSpacing: '0.1em',
                      color: 'var(--ink-dust)',
                      fontWeight: 600,
                    }}
                  >
                    SUBJECT / KEYWORD
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
                  placeholder="Record an observation, reflection, or concept to index..."
                  disabled={isSubmitting}
                  rows={4}
                  style={{
                    width: '100%',
                    backgroundColor: 'transparent',
                    color: 'var(--ink-bone)',
                    border: 'none',
                    borderBottom: '1.5px solid var(--border-structural)',
                    borderRadius: 0,
                    outline: 'none',
                    resize: 'vertical',
                    minHeight: '110px',
                    fontSize: '1.1rem',
                    lineHeight: '1.65',
                    fontFamily: 'var(--font-serif)',
                    paddingBottom: '8px',
                  }}
                />

                {/* Submit Action — High Contrast Tactile RECORD Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
                  <button
                    type="submit"
                    disabled={!text.trim() || isSubmitting}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      backgroundColor: !text.trim() || isSubmitting ? 'var(--surface-raised)' : 'var(--action-espresso)',
                      color: !text.trim() || isSubmitting ? 'var(--ink-dust)' : 'var(--ink-inverse)',
                      border: '1.5px solid var(--ink-bone)',
                      padding: '10px 24px',
                      cursor: !text.trim() || isSubmitting ? 'default' : 'pointer',
                      transition: 'all var(--duration-fast)',
                      boxShadow: text.trim() && !isSubmitting ? '2px 2px 0px rgba(0,0,0,0.25)' : 'none',
                    }}
                  >
                    {isSubmitting ? 'RECORDING...' : 'RECORD'}
                  </button>
                </div>
              </form>
            </section>

            {/* Archival System Telemetry Card */}
            <div
              style={{
                marginTop: '28px',
                padding: '18px 20px',
                backgroundColor: 'var(--surface-pure)',
                border: '1px solid var(--border-structural)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.68rem',
                  color: 'var(--ink-dust)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                <span>SYS.TELEMETRY</span>
                <span>STATUS // ACTIVE</span>
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  color: 'var(--ink-stone)',
                }}
              >
                Entries recorded here are automatically anchored to your personal thinking ledger with bitemporal timestamps and vector embeddings.
              </p>
            </div>
          </div>

          {/* Right Column: Retrieved Entries Stream */}
          <div className="workbench-stream-pane">
            <section
              id="recent-stream-section"
              aria-label="Recent Stream"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                width: '100%',
              }}
            >
              {/* Section Heading with Count Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  paddingBottom: '12px',
                  borderBottom: '1.5px solid var(--border-structural)',
                }}
              >
                <h2
                  style={{
                    fontFamily: 'var(--font-headline)',
                    fontSize: '2rem',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    color: 'var(--ink-bone)',
                  }}
                >
                  Retrieved Entries
                </h2>

                {fragments.length > 0 && (
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      color: 'var(--ink-stone)',
                    }}
                  >
                    {fragments.length} {fragments.length === 1 ? 'Result Found' : 'Results Found'}
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
                      padding: '5px 14px',
                      backgroundColor: 'var(--surface-pure)',
                      border: '1px solid var(--border-structural)',
                      color: 'var(--ink-bone)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      fontWeight: 600,
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
                    gap: '18px',
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
          </div>
        </div>
      </main>

      {/* Floating Bottom Quick Dock */}
      <BottomNav />

      {/* Responsive Full-Screen Workbench Styles */}
      <style jsx>{`
        .workbench-layout {
          display: grid;
          grid-template-columns: 460px 1fr;
          gap: 48px;
          align-items: start;
          width: 100%;
        }
        .workbench-input-pane {
          position: sticky;
          top: 80px;
        }
        .workbench-stream-pane {
          width: 100%;
          min-width: 0;
        }
        @media (max-width: 1080px) {
          .workbench-layout {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .workbench-input-pane {
            position: static;
          }
        }
      `}</style>
    </div>
  );
}
