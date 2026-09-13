'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { AppHeader } from '../components/AppHeader';
import { BottomNav } from '../components/BottomNav';
import { JournalCalendar } from '../components/JournalCalendar';
import { useApi } from '../lib/api';

/**
 * RecordPage — Full-Screen Open Journal Spread
 *
 * Mental Model & Layout:
 * - The entire DOM is transformed into an open notebook spread across the screen:
 *   - LEFT PAGE: The Thought Ingestion / Record Composer (writing directly on paper).
 *   - CENTER BINDING: Subtle shadow crease and stitch spine binding the pages.
 *   - RIGHT PAGE: The Ultra-Soft Botanical Calendar Spread inspired by bullet journal art.
 * - Maximizes viewport coverage edge-to-edge for an authentic, immersive writing desk feeling.
 */
export default function RecordPage() {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [feedback, setFeedback] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
    details?: string;
  }>({ status: 'idle', message: '' });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const api = useApi();

  // Dynamic word count calculation
  const wordCount = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [text]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Auto-resize textarea to fit text naturally
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(260, textareaRef.current.scrollHeight)}px`;
    }
  }, [text]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    setFeedback({ status: 'idle', message: '' });

    try {
      const fragment = await api.createCapture(trimmed);
      setText('');
      setFeedback({
        status: 'success',
        message: 'Thought captured and anchored to your memory ledger.',
        details: `Ref #${fragment.id.slice(0, 8)} · ${new Date(
          fragment.capturedAt
        ).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      });

      if (textareaRef.current) {
        textareaRef.current.style.height = '260px';
        textareaRef.current.focus();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to record thought. Please verify your connection.';
      setFeedback({
        status: 'error',
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formattedSelectedDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

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
      <AppHeader />

      {/* Semantic Main Container with clean, comfortable breathing room */}
      <main
        id="main-content"
        role="main"
        aria-label="Cognitive Record Ledger"
        style={{
          flex: 1,
          maxWidth: '1240px',
          width: '100%',
          margin: '0 auto',
          padding: '36px 24px 80px 24px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Top Status & Date Header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 2px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: '#6E5A48',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              COGNITIVE JOURNAL // ARCHIVAL LEDGER
            </span>
            <span style={{ color: 'rgba(110, 90, 70, 0.4)', fontSize: '0.75rem' }}>·</span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--accent-moss)',
                fontWeight: 600,
              }}
            >
              {formattedSelectedDate}
            </span>
          </div>

          <Link
            href="/archives"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              color: '#5A4635',
              textDecoration: 'none',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              padding: '4px 10px',
              borderRadius: '3px',
              border: '1px solid rgba(110, 90, 70, 0.25)',
              backgroundColor: 'rgba(255, 255, 255, 0.4)',
            }}
          >
            Archives & Search →
          </Link>
        </header>

        {/* Responsive Two-Column DOM Grid: Record Composer (Left) + Botanical Calendar (Right) */}
        <div className="record-page-grid">
          {/* ============================================================
              LEFT STANDALONE CARD: RECORD / THOUGHT COMPOSER
             ============================================================ */}
          <section
            aria-labelledby="record-prompt-heading"
            style={{
              backgroundColor: '#FAF8F3',
              borderRadius: '8px',
              border: '1.5px solid rgba(80, 65, 50, 0.22)',
              boxShadow:
                '0 12px 32px rgba(43, 35, 26, 0.08), 0 2px 6px rgba(43, 35, 26, 0.04)',
              padding: '36px 36px 32px 36px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxSizing: 'border-box',
              minHeight: '520px',
            }}
          >
            {/* Subtle Archival Margin Red/Tan Guide Line */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: '26px',
                width: '1px',
                backgroundColor: 'rgba(184, 93, 54, 0.25)',
                pointerEvents: 'none',
              }}
            />

            {/* Faint Dotted Paper Texture on Composer */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage:
                  'radial-gradient(rgba(90, 75, 60, 0.14) 1px, transparent 1px)',
                backgroundSize: '18px 18px',
                backgroundPosition: '9px 9px',
                zIndex: 0,
                pointerEvents: 'none',
                opacity: 0.6,
              }}
            />

            {/* Card Content */}
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
              }}
            >
              {/* Header Meta */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.14em',
                    color: '#8C7A68',
                    fontWeight: 600,
                  }}
                >
                  ENTRY // PRESENT OBSERVATION
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem',
                    color: 'var(--accent-moss)',
                    fontWeight: 600,
                  }}
                >
                  {formattedSelectedDate}
                </span>
              </div>

              {/* Thought Writing Prompt */}
              <h1
                id="record-prompt-heading"
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: '2.1rem',
                  fontWeight: 400,
                  letterSpacing: '-0.02em',
                  color: '#281E15',
                  lineHeight: 1.25,
                  margin: 0,
                }}
              >
                What is preoccupying your attention right now?
              </h1>

              {/* Clean Writing Textarea Surface */}
              <form
                onSubmit={handleSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px dashed rgba(110, 92, 75, 0.25)',
                    paddingBottom: '6px',
                  }}
                >
                  <label
                    htmlFor="record-textarea"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.65rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: '#8C7A68',
                      fontWeight: 600,
                    }}
                  >
                    Journal Observation
                  </label>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.65rem',
                      color: '#8C7A68',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {wordCount > 0 ? `${wordCount} words · ` : ''}⌘+ENTER to record
                  </span>
                </div>

                <textarea
                  id="record-textarea"
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Write freely. Thoughts are normalized, cryptographically hashed, and anchored to your memory ledger..."
                  disabled={isSubmitting}
                  rows={8}
                  style={{
                    width: '100%',
                    backgroundColor: 'transparent',
                    color: '#281E15',
                    border: 'none',
                    outline: 'none',
                    resize: 'none',
                    fontSize: '1.25rem',
                    lineHeight: '1.75',
                    fontFamily: 'var(--font-serif)',
                    padding: '8px 0',
                    boxSizing: 'border-box',
                  }}
                />

                {/* Submit Action Bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(110, 92, 75, 0.2)',
                  }}
                >
                  <Link
                    href="/archives"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      color: '#6E5C4B',
                      textDecoration: 'none',
                      letterSpacing: '0.04em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>Explore Archives</span>
                    <span aria-hidden="true">→</span>
                  </Link>

                  <button
                    type="submit"
                    disabled={!text.trim() || isSubmitting}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      backgroundColor:
                        !text.trim() || isSubmitting
                          ? 'rgba(110, 92, 75, 0.15)'
                          : '#281E15',
                      color:
                        !text.trim() || isSubmitting
                          ? '#8C7A68'
                          : '#FAF8F3',
                      border: '1.5px solid #281E15',
                      padding: '10px 28px',
                      cursor: !text.trim() || isSubmitting ? 'default' : 'pointer',
                      transition: 'all var(--duration-fast)',
                      boxShadow:
                        text.trim() && !isSubmitting
                          ? '2px 2px 0px rgba(0,0,0,0.2)'
                          : 'none',
                      borderRadius: '3px',
                    }}
                  >
                    {isSubmitting ? 'RECORDING...' : 'RECORD'}
                  </button>
                </div>
              </form>
            </div>

            {/* Feedback Notifications inside Left Card */}
            <div style={{ position: 'relative', zIndex: 1, marginTop: '16px' }}>
              {feedback.status === 'success' && (
                <div
                  role="status"
                  style={{
                    padding: '14px 18px',
                    backgroundColor: 'rgba(250, 248, 243, 0.98)',
                    border: '1.5px solid #281E15',
                    boxShadow: '2px 2px 0px rgba(0,0,0,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontFamily: 'var(--font-body)',
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: 'var(--accent-moss)',
                        letterSpacing: '0.04em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>✓</span> {feedback.message}
                    </span>
                    {feedback.details && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#8C7A68' }}>
                        {feedback.details}
                      </span>
                    )}
                  </div>

                  <Link
                    href="/archives"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      padding: '5px 12px',
                      backgroundColor: '#EFECE4',
                      border: '1px solid #6E5C4B',
                      color: '#281E15',
                      textDecoration: 'none',
                      borderRadius: '2px',
                    }}
                  >
                    View Archives →
                  </Link>
                </div>
              )}

              {feedback.status === 'error' && (
                <div
                  role="alert"
                  style={{
                    padding: '12px 16px',
                    backgroundColor: 'rgba(184, 93, 54, 0.12)',
                    border: '1.5px solid #B85D36',
                    color: '#281E15',
                    fontFamily: 'var(--font-body)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderRadius: '4px',
                  }}
                >
                  <span style={{ fontSize: '0.85rem' }}>{feedback.message}</span>
                  <button
                    type="button"
                    onClick={() => handleSubmit()}
                    style={{
                      padding: '4px 10px',
                      backgroundColor: '#FAF8F3',
                      border: '1px solid #B85D36',
                      color: '#281E15',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                      borderRadius: '2px',
                    }}
                  >
                    RETRY
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* ============================================================
              RIGHT STANDALONE CARD: SEPARATE JOURNAL CALENDAR COMPANION
             ============================================================ */}
          <aside
            aria-labelledby="calendar-heading"
            style={{
              display: 'flex',
              justifyContent: 'center',
              width: '100%',
            }}
          >
            <JournalCalendar
              selectedDate={selectedDate}
              onSelectDate={(date) => setSelectedDate(date)}
            />
          </aside>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
