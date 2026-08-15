'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { MemorySearchResult } from '@cognitive-engine/shared';
import { AppHeader } from '../../components/AppHeader';
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
            : 'Failed to search thoughts. Please check API connection.';
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader />

      <main
        style={{
          flex: 1,
          maxWidth: '720px',
          width: '100%',
          margin: '0 auto',
          padding: '32px 20px 64px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
        }}
      >
        {/* Search Bar Input */}
        <section aria-label="Semantic Search Bar">
          <form
            onSubmit={handleSubmit}
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-md)',
              padding: '6px 8px 6px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
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
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-secondary)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>

            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search thoughts semantically using natural language..."
              aria-label="Search thoughts query"
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                border: 'none',
                outline: 'none',
                fontSize: '1rem',
                fontFamily: 'var(--font-sans)',
              }}
            />

            {query && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear search query"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}

            <button
              type="submit"
              disabled={!query.trim() || isSearching}
              style={{
                padding: '8px 18px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: !query.trim() || isSearching ? 'var(--border-subtle)' : 'var(--accent-primary)',
                color: !query.trim() || isSearching ? 'var(--text-muted)' : '#ffffff',
                fontWeight: 600,
                fontSize: '0.875rem',
                border: 'none',
                cursor: !query.trim() || isSearching ? 'default' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all var(--duration-fast) ease-out',
              }}
            >
              Search
            </button>
          </form>
        </section>

        {/* Search Results / States Section */}
        <section
          aria-label="Memory Search Results"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Section Heading when query active */}
          {hasSearched && !isSearching && !error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '8px',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <h2
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Semantic Matches
              </h2>

              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                }}
              >
                {results.length} {results.length === 1 ? 'match' : 'matches'}
              </span>
            </div>
          )}

          {/* Error Banner with Retry */}
          {error && (
            <div
              role="alert"
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'rgba(225, 112, 85, 0.12)',
                border: '1px solid var(--semantic-error)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: 'var(--text-primary)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--semantic-error)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span style={{ fontSize: '0.875rem' }}>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => executeSearch(query.trim())}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8125rem',
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

          {/* Initial Pre-Search Invitation State */}
          {!hasSearched && !isSearching && (
            <EmptyState
              title="Explore your thoughts semantically"
              description="Type keywords, concepts, or natural questions to resurface relevant past memories and thought patterns."
              icon={
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(0, 210, 255, 0.12)',
                    color: 'var(--accent-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
              }
            />
          )}

          {/* No Results Found State */}
          {hasSearched && !isSearching && !error && results.length === 0 && (
            <EmptyState
              title="No thoughts found"
              description={`We couldn't find any memories matching "${query}". Try searching with different phrasing or broader conceptual keywords.`}
            />
          )}

          {/* Populated Search Results List */}
          {!isSearching && !error && results.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {results.map((item, index) => (
                <MemoryResultCard key={item.memory.id || index} result={item} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
