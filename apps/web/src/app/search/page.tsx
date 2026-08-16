'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { MemorySearchResult } from '@cognitive-engine/shared';
import { AppHeader } from '../../components/AppHeader';
import { LeftDock } from '../../components/LeftDock';
import { MemoryResultCard } from '../../components/MemoryResultCard';
import { EmptyState } from '../../components/EmptyState';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { useApi } from '../../lib/api';

export default function MemorySearchPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<MemorySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const api = useApi();

  // Focus search input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounce query input by 350ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const executeSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery) {
        setResults([]);
        setHasSearched(false);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      setError(null);
      setHasSearched(true);

      try {
        const response = await api.searchMemories(searchQuery, 15);
        setResults(response.data || []);
      } catch (err: unknown) {
        console.error('Semantic search failed:', err);
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to retrieve memories. Please check your connection.';
        setError(message);
      } finally {
        setIsSearching(false);
      }
    },
    [api]
  );

  useEffect(() => {
    executeSearch(debouncedQuery);
  }, [debouncedQuery, executeSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      executeSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    setDebouncedQuery('');
    setResults([]);
    setHasSearched(false);
    setError(null);
    inputRef.current?.focus();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--canvas-bg)' }}>
      {/* Top Masthead */}
      <AppHeader />

      {/* Left Icon Dock */}
      <LeftDock />

      {/* Main Column */}
      <main
        style={{
          flex: 1,
          maxWidth: '740px',
          width: '100%',
          margin: '0 auto',
          padding: '28px 24px 80px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '36px',
          position: 'relative',
        }}
      >
        {/* Top Section: Heading + Subtitle with Crop Marks */}
        <section
          aria-label="Search Introduction"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            position: 'relative',
            paddingTop: '6px',
          }}
        >
          {/* Subtle Crop Marks */}
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
            Query Registry
          </h1>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--ink-dust)',
              fontWeight: 500,
            }}
          >
            SYS.INDEX // AWAITING INPUT
          </span>
        </section>

        {/* The Signature Stitch Search Box Container */}
        <section aria-label="Search Surface" style={{ position: 'relative' }}>
          {/* Tilted Backing Slip */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'var(--surface-raised)',
              border: '1.5px solid var(--border-structural)',
              transform: 'rotate(0.5deg) translate(3px, 4px)',
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
              boxShadow: '2.5px 3.5px 0px rgba(0, 0, 0, 0.15)',
              padding: '20px 24px 18px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* Corner Crop Marks */}
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: '5px',
                left: '7px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
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
                top: '5px',
                right: '7px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
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
                bottom: '5px',
                left: '7px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
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
                bottom: '5px',
                right: '7px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
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
                paddingLeft: '28px',
              }}
            >
              <label
                htmlFor="memory-search-input"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.68rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--ink-dust)',
                  fontWeight: 500,
                }}
              >
                SUBJECT / KEYWORD
              </label>

              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  aria-label="Clear search input"
                  style={{
                    background: 'none',
                    border: 'none',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem',
                    color: 'var(--ink-dust)',
                    cursor: 'pointer',
                    letterSpacing: '0.04em',
                  }}
                >
                  CLEAR [ESC]
                </button>
              )}
            </div>

            {/* Input Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              {/* Search Lens Icon */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--ink-bone)"
                strokeWidth="2.2"
                strokeLinecap="square"
                strokeLinejoin="miter"
                aria-hidden="true"
                style={{ flexShrink: 0 }}
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>

              <input
                id="memory-search-input"
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search thoughts naturally..."
                aria-label="Search memories"
                style={{
                  flex: 1,
                  minWidth: 0,
                  backgroundColor: 'transparent',
                  color: 'var(--ink-bone)',
                  border: 'none',
                  borderBottom: '1px solid var(--border-structural)',
                  borderRadius: 0,
                  outline: 'none',
                  fontSize: '1rem',
                  lineHeight: '1.6',
                  fontFamily: 'var(--font-body)',
                  paddingBottom: '4px',
                }}
              />

              <button
                type="submit"
                disabled={!query.trim() || isSearching}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  backgroundColor: !query.trim() || isSearching ? 'var(--surface-raised)' : 'var(--ink-bone)',
                  color: !query.trim() || isSearching ? 'var(--ink-dust)' : 'var(--ink-inverse)',
                  border: '1px solid var(--ink-bone)',
                  padding: '8px 20px',
                  cursor: !query.trim() || isSearching ? 'default' : 'pointer',
                  transition: 'all var(--duration-fast)',
                  boxShadow: query.trim() && !isSearching ? '1.5px 2px 0px rgba(0,0,0,0.2)' : 'none',
                  flexShrink: 0,
                }}
              >
                EXECUTE
              </button>
            </div>
          </form>
        </section>

        {/* Results Section */}
        <section
          aria-label="Retrieved Thoughts Stream"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          {/* Result Section Header */}
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
              Retrieved Entries
            </h2>

            {hasSearched && !isSearching && !error && (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  color: 'var(--ink-dust)',
                }}
              >
                {results.length} {results.length === 1 ? 'Result Found' : 'Results Found'}
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
                onClick={() => executeSearch(query.trim())}
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
          {isSearching && <LoadingSkeleton count={3} />}

          {/* Pre-Search State */}
          {!hasSearched && !isSearching && (
            <EmptyState
              title="What are you trying to remember?"
              description="Search for a person, project, idea, conversation, or reflection."
            />
          )}

          {/* No Results Found State */}
          {hasSearched && !isSearching && !error && results.length === 0 && (
            <EmptyState
              title="Nothing surfaced for that search"
              description="Try describing the thought differently or using broader conceptual keywords."
            />
          )}

          {/* Populated Memory Stream (Stitch Stacked Cards) */}
          {!isSearching && !error && results.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
              }}
            >
              {results.map((item, index) => (
                <MemoryResultCard
                  key={item.memory.id || index}
                  result={item}
                  index={index}
                  query={query}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
