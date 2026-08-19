'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { MemorySearchResult } from '@cognitive-engine/shared';
import { AppHeader } from '../../components/AppHeader';
import { MemoryResultCard } from '../../components/MemoryResultCard';
import { EmptyState } from '../../components/EmptyState';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { BottomNav } from '../../components/BottomNav';
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
          {/* Left Column: Query Registry Box */}
          <div className="workbench-input-pane">
            {/* Section Header with Stitch Framing Marks */}
            <section
              aria-label="Search Introduction"
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

            {/* The Stitch Signature Search Box */}
            <section aria-label="Search Surface" style={{ position: 'relative', width: '100%' }}>
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
                onSubmit={handleSubmit}
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
                    htmlFor="memory-search-input"
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

                  {query && (
                    <button
                      type="button"
                      onClick={handleClear}
                      aria-label="Clear search input"
                      style={{
                        background: 'none',
                        border: 'none',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.7rem',
                        color: 'var(--ink-dust)',
                        cursor: 'pointer',
                        letterSpacing: '0.04em',
                      }}
                    >
                      CLEAR [ESC]
                    </button>
                  )}
                </div>

                {/* Input Row with Lens Icon */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                  }}
                >
                  <svg
                    width="20"
                    height="20"
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
                    placeholder="memory consolidation, hypothesis..."
                    aria-label="Search memories"
                    style={{
                      flex: 1,
                      minWidth: 0,
                      backgroundColor: 'transparent',
                      color: 'var(--ink-bone)',
                      border: 'none',
                      borderBottom: '1.5px solid var(--border-structural)',
                      borderRadius: 0,
                      outline: 'none',
                      fontSize: '1.1rem',
                      lineHeight: '1.6',
                      fontFamily: 'var(--font-serif)',
                      paddingBottom: '4px',
                    }}
                  />

                  {/* High Contrast Tactile SEARCH Button */}
                  <button
                    type="submit"
                    disabled={!query.trim() || isSearching}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      backgroundColor: !query.trim() || isSearching ? 'var(--surface-raised)' : 'var(--action-espresso)',
                      color: !query.trim() || isSearching ? 'var(--ink-dust)' : 'var(--ink-inverse)',
                      border: '1.5px solid var(--ink-bone)',
                      padding: '10px 24px',
                      cursor: !query.trim() || isSearching ? 'default' : 'pointer',
                      transition: 'all var(--duration-fast)',
                      boxShadow: query.trim() && !isSearching ? '2px 2px 0px rgba(0,0,0,0.25)' : 'none',
                      flexShrink: 0,
                    }}
                  >
                    {isSearching ? 'SEARCHING...' : 'SEARCH'}
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
                <span>SYS.RETRIEVAL</span>
                <span>EMBEDDINGS // ACTIVE</span>
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  color: 'var(--ink-stone)',
                }}
              >
                Similarity ranking retrieves thoughts by conceptual meaning and historical context rather than strict keyword match.
              </p>
            </div>
          </div>

          {/* Right Column: Retrieved Entries Stream */}
          <div className="workbench-stream-pane">
            <section
              aria-label="Retrieved Thoughts Stream"
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

                {hasSearched && !isSearching && !error && (
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      color: 'var(--ink-stone)',
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
              {isSearching && <LoadingSkeleton count={3} />}

              {/* Pre-Search State */}
              {!hasSearched && !isSearching && (
                <EmptyState
                  title="Query the memory index"
                  description="Type a concept, person, project, theory, or reflection above to retrieve related historical entries."
                />
              )}

              {/* No Results Found State */}
              {hasSearched && !isSearching && !error && results.length === 0 && (
                <EmptyState
                  title="No entries surfaced"
                  description="Try describing the concept with broader terms or alternative associations."
                />
              )}

              {/* Populated Memory Stream */}
              {!isSearching && !error && results.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '18px',
                    width: '100%',
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
