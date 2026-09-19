'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@cognitive-engine/ui';

interface CaptureInputProps {
  onCapture: (text: string) => Promise<void>;
  isLoading?: boolean;
  autoFocus?: boolean;
}

export function CaptureInput({
  onCapture,
  isLoading = false,
  autoFocus = false,
}: CaptureInputProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Dynamic Word Count
  const wordCount = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [text]);

  // Focus textarea on mount if requested
  useEffect(() => {
    if (autoFocus) {
      textareaRef.current?.focus();
    }
  }, [autoFocus]);

  // Auto-resize textarea to fit text naturally
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
          : 'Unable to record thought. Please verify your connection.';
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
      {/* Editorial Prompt Header */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.68rem',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--status-success)',
            fontWeight: 600,
          }}
        >
          RECORD // PRESENT MOMENT
        </span>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: '1.85rem',
            fontWeight: 400,
            lineHeight: 1.25,
            letterSpacing: '-0.015em',
            color: 'var(--ink-bone)',
            margin: 0,
          }}
        >
          What is preoccupying your attention right now?
        </h1>
      </section>

      {/* Tactile Writing Slip Card */}
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          backgroundColor: 'var(--surface-pure)',
          border: '1.5px solid var(--border-structural)',
          boxShadow: 'var(--shadow-slip)',
          borderRadius: 'var(--radius-slip)',
          padding: '24px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxSizing: 'border-box',
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
            minHeight: '120px',
            backgroundColor: 'transparent',
            color: 'var(--ink-bone)',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontSize: '1.18rem',
            lineHeight: '1.7',
            fontFamily: 'var(--font-serif)',
            padding: '2px 0',
            boxSizing: 'border-box',
          }}
        />

        {error && (
          <div
            role="alert"
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--status-error-bg)',
              border: '1px solid var(--status-error-border)',
              color: 'var(--status-error)',
              fontSize: '0.85rem',
              fontFamily: 'var(--font-body)',
              borderRadius: 'var(--radius-stamp)',
            }}
          >
            {error}
          </div>
        )}

        {/* Footer Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '14px',
            borderTop: '1px solid var(--border-hairline)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              color: 'var(--ink-dust)',
              letterSpacing: '0.06em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{wordCount} {wordCount === 1 ? 'WORD' : 'WORDS'}</span>
            <span>·</span>
            <span>⌘+ENTER TO RECORD</span>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            disabled={!text.trim() || isLoading}
          >
            {isLoading ? 'RECORDING...' : 'RECORD'}
          </Button>
        </div>
      </form>
    </div>
  );
}
