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
            : 'Failed to search thoughts. Please check your connection.';
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
          maxWidth: '640px',
          width: '100%',
          margin: '0 auto',
          padding: '36px 20px 100px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '36px',
        }}
      >
        {/* Search Header & Prompt */}
        <section aria-label="Search Header" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
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
              What would you like to remember?
            </h1>
          </div>

          {/* Tactile Search Bar */}
          <form
            onSubmit={handleSubmit}
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-strong)',
              boxShadow: 'var(--shadow-paper)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search thoughts naturally — ideas, concepts, questions..."
              aria-label="Search memories query"
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
                  padding: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                }}
              >
                Clear
              </button>
            )}

            <button
              type="submit"
              disabled={!query.trim() || isSearching}
              style={{
                padding: '6px 14px',
                backgroundColor: !query.trim() || isSearching ? 'var(--bg-surface-subtle)' : 'var(--accent-ink)',
                color: !query.trim() || isSearching ? 'var(--text-muted)' : 'var(--text-inverse)',
                fontWeight: 500,
                fontSize: '0.85rem',
                fontFamily: 'var(--font-sans)',
                border: '1px solid var(--border-hairline)',
                cursor: !query.trim() || isSearching ? 'default' : 'pointer',
                transition: 'all var(--duration-fast) ease-out',
              }}
            >
              Search
            </button>
          </form>
        </section>

        {/* Results / States Section */}
        <section
          aria-label="Retrieved Memories"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {hasSearched && !isSearching && !error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                paddingBottom: '8px',
                borderBottom: '1px solid var(--border-hairline)',
              }}
            >
              <h2
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.15rem',
                  fontWeight: 400,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                Retrieved Memories
              </h2>

              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
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
                padding: '14px 18px',
                backgroundColor: 'var(--semantic-error-bg)',
                border: '1px solid var(--semantic-error)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <span style={{ fontSize: '0.875rem' }}>{error}</span>
              <button
                type="button"
                onClick={() => executeSearch(query.trim())}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-hairline)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
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
              title="Explore your memory archive"
              description="Type natural questions, ideas, or topics to resurface relevant previous thoughts."
            />
          )}

          {/* No Results State */}
          {hasSearched && !isSearching && !error && results.length === 0 && (
            <EmptyState
              title="No memories found"
              description={`We couldn't find any thoughts matching "${query}". Try searching with different phrasing or broader conceptual keywords.`}
            />
          )}

          {/* Results List */}
          {!isSearching && !error && results.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              {results.map((item, index) => (
                <MemoryResultCard key={item.memory.id || index} result={item} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Bespoke Framed Bottom Dock Navigation */}
      <BottomNav />
    </div>
  );
}
