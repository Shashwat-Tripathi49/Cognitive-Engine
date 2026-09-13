'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { AppHeader } from '../components/AppHeader';
import { BottomNav } from '../components/BottomNav';
import { useApi } from '../lib/api';

/**
 * RecordPage — Minimalist Thought Capture Surface
 *
 * Mental Model:
 * "I want to record something now."
 *
 * Responsibilities:
 * - Provides a calm, distraction-free writing surface for raw thoughts.
 * - Handles asynchronous ingestion through the Capture Engine (POST /capture).
 * - Displays accurate, non-hallucinatory processing feedback upon completion.
 * - Seamlessly guides the user to the Archives to inspect their accumulating thoughts.
 */
export default function RecordPage() {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
    details?: string;
  }>({ status: 'idle', message: '' });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const api = useApi();

  // Word count calculation
  const wordCount = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [text]);

  // Auto-focus textarea on page load
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Auto-resize textarea to fit writing naturally
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(160, textareaRef.current.scrollHeight)}px`;
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
        details: `Reference: #${fragment.id.slice(0, 8)}`,
      });

      if (textareaRef.current) {
        textareaRef.current.style.height = '160px';
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

      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '760px',
          margin: '0 auto',
          padding: '56px 24px 120px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}
      >
        {/* Subtle Framing Marks for Calm Editorial Focus */}
        <div style={{ width: '100%', position: 'relative' }}>
          <header
            style={{
              marginBottom: '32px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: 'var(--ink-dust)',
                fontWeight: 600,
              }}
            >
              RECORD // PRESENT MOMENT
            </span>
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: '2.25rem',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                color: 'var(--ink-bone)',
                lineHeight: 1.25,
                margin: 0,
              }}
            >
              What is preoccupying your attention right now?
            </h1>
          </header>

          {/* Tactile Writing Slip Card */}
          <div style={{ position: 'relative', width: '100%' }}>
            {/* Tilted Backing Slip */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'var(--surface-raised)',
                border: '1.5px solid var(--border-structural)',
                transform: 'rotate(0.35deg) translate(4px, 5px)',
                zIndex: 0,
              }}
            />

            <form
              onSubmit={handleSubmit}
              style={{
                position: 'relative',
                zIndex: 1,
                width: '100%',
                backgroundColor: 'var(--surface-pure)',
                border: '1.5px solid var(--ink-bone)',
                boxShadow: 'var(--shadow-slip)',
                padding: '28px 32px 24px 32px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}
            >
              {/* Corner Architectural Crop Marks */}
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
                  userSelect: 'none',
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
                  userSelect: 'none',
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
                  userSelect: 'none',
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
                  userSelect: 'none',
                }}
              >
                ┘
              </span>

              {/* Textarea Label & Keyboard Shortcut Helper */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border-hairline)',
                  paddingBottom: '8px',
                }}
              >
                <label
                  htmlFor="record-textarea"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--ink-dust)',
                    fontWeight: 600,
                  }}
                >
                  Raw Thought Observation
                </label>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem',
                    color: 'var(--ink-dust)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {wordCount > 0 ? `${wordCount} words · ` : ''}⌘+ENTER to record
                </span>
              </div>

              {/* Thought Textarea */}
              <textarea
                id="record-textarea"
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write freely. Your thoughts are privately normalized, hashed, and indexed..."
                disabled={isSubmitting}
                rows={5}
                style={{
                  width: '100%',
                  backgroundColor: 'transparent',
                  color: 'var(--ink-bone)',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  fontSize: '1.25rem',
                  lineHeight: '1.7',
                  fontFamily: 'var(--font-serif)',
                  padding: '4px 0',
                }}
              />

              {/* Action Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-hairline)',
                }}
              >
                <Link
                  href="/archives"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    color: 'var(--ink-stone)',
                    textDecoration: 'none',
                    letterSpacing: '0.04em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'color var(--duration-fast)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink-bone)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink-stone)')}
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
                        ? 'var(--surface-raised)'
                        : 'var(--action-espresso)',
                    color:
                      !text.trim() || isSubmitting
                        ? 'var(--ink-dust)'
                        : 'var(--ink-inverse)',
                    border: '1.5px solid var(--ink-bone)',
                    padding: '10px 26px',
                    cursor: !text.trim() || isSubmitting ? 'default' : 'pointer',
                    transition: 'all var(--duration-fast)',
                    boxShadow:
                      text.trim() && !isSubmitting
                        ? '2px 2px 0px rgba(0,0,0,0.25)'
                        : 'none',
                  }}
                >
                  {isSubmitting ? 'RECORDING...' : 'RECORD'}
                </button>
              </div>
            </form>
          </div>

          {/* Feedback & Status Banner */}
          {feedback.status === 'success' && (
            <div
              role="status"
              style={{
                marginTop: '24px',
                padding: '16px 20px',
                backgroundColor: 'var(--surface-pure)',
                border: '1.5px solid var(--ink-bone)',
                boxShadow: 'var(--shadow-slip)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontFamily: 'var(--font-body)',
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
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.68rem',
                      color: 'var(--ink-dust)',
                    }}
                  >
                    {feedback.details}
                  </span>
                )}
              </div>

              <Link
                href="/archives"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: '6px 14px',
                  backgroundColor: 'var(--surface-raised)',
                  border: '1px solid var(--border-structural)',
                  color: 'var(--ink-bone)',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
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
                marginTop: '24px',
                padding: '14px 18px',
                backgroundColor: 'var(--accent-ochre-bg)',
                border: '1.5px solid var(--accent-ochre)',
                color: 'var(--ink-bone)',
                fontFamily: 'var(--font-body)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '0.875rem' }}>{feedback.message}</span>
              <button
                type="button"
                onClick={() => handleSubmit()}
                style={{
                  padding: '5px 12px',
                  backgroundColor: 'var(--surface-pure)',
                  border: '1px solid var(--border-structural)',
                  color: 'var(--ink-bone)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                RETRY
              </button>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
