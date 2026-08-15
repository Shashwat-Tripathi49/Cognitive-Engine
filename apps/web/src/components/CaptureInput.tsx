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

  // Auto-resize textarea to fit content seamlessly
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
          : 'Failed to capture thought. Please try again.';
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
    <form
      onSubmit={handleSubmit}
      style={{
        width: '100%',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-md)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        transition: 'border-color var(--duration-fast), box-shadow var(--duration-fast)',
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent-primary)';
        e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(document.activeElement)) {
          e.currentTarget.style.borderColor = 'var(--border-subtle)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }
      }}
    >
      <label
        htmlFor="thought-input"
        style={{
          fontSize: '0.8125rem',
          fontWeight: 500,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Capture a Thought
      </label>

      <textarea
        id="thought-input"
        ref={textareaRef}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (error) setError(null);
        }}
        onKeyDown={handleKeyDown}
        placeholder="What are you thinking about right now? Jot down ideas, observations, or reflections..."
        disabled={isLoading}
        style={{
          width: '100%',
          minHeight: '110px',
          backgroundColor: 'transparent',
          color: 'var(--text-primary)',
          border: 'none',
          outline: 'none',
          resize: 'none',
          fontSize: '1.05rem',
          lineHeight: '1.6',
          fontFamily: 'var(--font-sans)',
        }}
      />

      {error && (
        <div
          role="alert"
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(225, 112, 85, 0.15)',
            border: '1px solid var(--semantic-error)',
            color: 'var(--semantic-error)',
            fontSize: '0.875rem',
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '10px',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <kbd
            style={{
              padding: '2px 5px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
            }}
          >
            ⌘/Ctrl + Enter
          </kbd>{' '}
          to capture
        </span>

        <button
          type="submit"
          disabled={isLoading || !text.trim()}
          style={{
            padding: '8px 20px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: !text.trim() || isLoading ? 'var(--border-subtle)' : 'var(--accent-primary)',
            color: !text.trim() || isLoading ? 'var(--text-muted)' : '#ffffff',
            fontWeight: 600,
            fontSize: '0.875rem',
            border: 'none',
            cursor: !text.trim() || isLoading ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: text.trim() && !isLoading ? 'var(--shadow-glow)' : 'none',
            transition: 'all var(--duration-fast) ease-out',
          }}
        >
          {isLoading ? (
            <>
              <span
                style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#ffffff',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              Capturing...
            </>
          ) : (
            <>
              Capture
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </>
          )}
        </button>
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </form>
  );
}
