'use client';

import React, { useState, useRef, useEffect } from 'react';

interface CaptureInputProps {
  onCapture: (text: string) => Promise<void>;
  isLoading?: boolean;
}

export function CaptureInput({ onCapture, isLoading = false }: CaptureInputProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea seamlessly
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(140, textareaRef.current.scrollHeight)}px`;
    }
  }, [text]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    try {
      await onCapture(trimmed);
      setText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = '140px';
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to save thought. Please check your connection.';
      setError(message);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Human-scale gentle thought prompt */}
      <div style={{ paddingBottom: '4px' }}>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.75rem',
            fontWeight: 400,
            lineHeight: 1.3,
            color: 'var(--text-primary)',
            letterSpacing: '-0.015em',
          }}
        >
          What is occupying your mind today?
        </h1>
      </div>

      {/* Tactile Writing Card */}
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
          boxShadow: 'var(--shadow-paper)',
          padding: '24px 24px 18px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          transition: 'box-shadow var(--duration-normal), border-color var(--duration-normal)',
          position: 'relative',
        }}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Begin typing freely — an observation, an idea, a question, or a reflection..."
          disabled={isLoading}
          aria-label="Capture thought content"
          style={{
            width: '100%',
            minHeight: '130px',
            backgroundColor: 'transparent',
            color: 'var(--text-primary)',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontSize: '1.05rem',
            lineHeight: '1.7',
            fontFamily: 'var(--font-sans)',
          }}
        />

        {error && (
          <div
            role="alert"
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--semantic-error-bg)',
              border: '1px solid var(--semantic-error)',
              color: 'var(--semantic-error)',
              fontSize: '0.85rem',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {error}
          </div>
        )}

        {/* Paper Footer / Metadata Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '14px',
            borderTop: '1px solid var(--border-hairline)',
          }}
        >
          {/* Subtle Session / Mode Ticker (as in reference) */}
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              userSelect: 'none',
            }}
          >
            UNSTRUCTURED CAPTURE
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                display: 'none',
              }}
              className="keyboard-hint"
            >
              ⌘+Enter
            </span>

            <button
              type="submit"
              disabled={isLoading || !text.trim()}
              style={{
                padding: '8px 18px',
                backgroundColor: !text.trim() || isLoading ? 'var(--bg-surface-subtle)' : 'var(--accent-ink)',
                color: !text.trim() || isLoading ? 'var(--text-muted)' : 'var(--text-inverse)',
                fontFamily: 'var(--font-sans)',
                fontWeight: 500,
                fontSize: '0.85rem',
                border: '1px solid var(--border-hairline)',
                cursor: !text.trim() || isLoading ? 'not-allowed' : 'pointer',
                transition: 'all var(--duration-fast) ease-out',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {isLoading ? 'Recording...' : 'Capture Thought'}
            </button>
          </div>
        </div>
      </form>

      <style jsx>{`
        @media (min-width: 640px) {
          .keyboard-hint {
            display: inline-block !important;
          }
        }
      `}</style>
    </div>
  );
}
