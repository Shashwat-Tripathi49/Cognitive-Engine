'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';

interface CaptureInputProps {
  onCapture: (text: string) => Promise<void>;
  isLoading?: boolean;
}

export function CaptureInput({ onCapture, isLoading = false }: CaptureInputProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Dynamic Word Count
  const wordCount = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [text]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(120, textareaRef.current.scrollHeight)}px`;
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
        textareaRef.current.style.height = '120px';
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to record thought. Please check your connection.';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
      {/* Editorial Prompt */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.68rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--accent-moss)',
            fontWeight: 500,
          }}
        >
          Session: Unstructured Thought
        </span>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: '1.5rem',
            fontWeight: 400,
            lineHeight: 1.35,
            letterSpacing: '-0.01em',
            color: 'var(--ink-bone)',
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
          border: '1px solid var(--border-structural)',
          boxShadow: 'var(--shadow-slip)',
          borderRadius: 'var(--radius-slip)',
          padding: '20px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
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
            minHeight: '95px',
            backgroundColor: 'transparent',
            color: 'var(--ink-bone)',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontSize: '0.975rem',
            lineHeight: '1.68',
            fontFamily: 'var(--font-body)',
          }}
        />

        {error && (
          <div
            role="alert"
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--accent-ochre-bg)',
              border: '1px solid var(--accent-ochre)',
              color: 'var(--accent-ochre)',
              fontSize: '0.85rem',
              fontFamily: 'var(--font-body)',
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
            paddingTop: '12px',
            borderTop: '1px solid var(--border-hairline)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              color: 'var(--ink-dust)',
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{wordCount} {wordCount === 1 ? 'WD' : 'WDS'}</span>
            <span>·</span>
            <span>⌘+ENTER</span>
          </div>

          <button
            type="submit"
            disabled={isLoading || !text.trim()}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.82rem',
              fontWeight: 600,
              letterSpacing: '-0.01em',
              backgroundColor: !text.trim() || isLoading ? 'var(--surface-raised)' : 'var(--ink-bone)',
              color: !text.trim() || isLoading ? 'var(--ink-dust)' : 'var(--ink-inverse)',
              border: 'none',
              padding: '8px 18px',
              borderRadius: 'var(--radius-stamp)',
              cursor: !text.trim() || isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: text.trim() && !isLoading ? 'var(--shadow-entry)' : 'none',
              transition: 'background-color var(--duration-fast)',
            }}
          >
            {isLoading ? 'Recording...' : 'Record Thought'}
          </button>
        </div>
      </form>
    </div>
  );
}
