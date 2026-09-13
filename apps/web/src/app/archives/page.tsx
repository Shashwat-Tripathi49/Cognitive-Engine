'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import type { CognitiveFragment, MemorySearchResult } from '@cognitive-engine/shared';
import { AppHeader } from '../../components/AppHeader';
import { BottomNav } from '../../components/BottomNav';
import { FragmentCard } from '../../components/FragmentCard';
import { MemoryResultCard } from '../../components/MemoryResultCard';
import { EmptyState } from '../../components/EmptyState';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { useApi } from '../../lib/api';

type TimeFilter = 'all' | 'today' | 'week' | 'earlier';

function ArchivesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<TimeFilter>('all');

  // Chronological fragments
  const [fragments, setFragments] = useState<CognitiveFragment[]>([]);
  const [isFeedLoading, setIsFeedLoading] = useState(true);

  // Semantic search results
  const [searchResults, setSearchResults] = useState<MemorySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const api = useApi();

  // Keep debounced query synced with typing (300ms debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
      // Mirror query to URL search parameters for bookmarkability
      const currentUrlQuery = searchParams.get('q') || '';
      if (query.trim() !== currentUrlQuery) {
        const nextParams = new URLSearchParams(searchParams.toString());
        if (query.trim()) {
          nextParams.set('q', query.trim());
        } else {
          nextParams.delete('q');
        }
        router.replace(`/archives${nextParams.toString() ? `?${nextParams.toString()}` : ''}`, {
          scroll: false,
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, router, searchParams]);

  // Fetch chronological fragments for Browse mode
  const fetchChronologicalFeed = useCallback(async () => {
    setIsFeedLoading(true);
    setError(null);
    try {
      const response = await api.listCaptures(1, 40);
      setFragments(response.data || []);
    } catch (err: unknown) {
      console.error('Failed to load archives feed:', err);
      setError('Unable to load memory ledger. Please verify your connection.');
    } finally {
      setIsFeedLoading(false);
    }
  }, [api]);

  // Execute semantic search when query is active
  const executeSemanticSearch = useCallback(
    async (searchTerm: string) => {
      if (!searchTerm) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const response = await api.searchMemories(searchTerm, 20);
        setSearchResults(response.data || []);
      } catch (err: unknown) {
        console.error('Semantic search failed:', err);
        setError('Semantic search request failed. Please check your connection.');
      } finally {
        setIsSearching(false);
      }
    },
    [api]
  );

  // Load feed on mount
  useEffect(() => {
    fetchChronologicalFeed();
  }, [fetchChronologicalFeed]);

  // Trigger search when debouncedQuery changes
  useEffect(() => {
    if (debouncedQuery) {
      executeSemanticSearch(debouncedQuery);
    } else {
      setSearchResults([]);
    }
  }, [debouncedQuery, executeSemanticSearch]);

  const handleClearSearch = () => {
    setQuery('');
    setDebouncedQuery('');
    setSearchResults([]);
    searchInputRef.current?.focus();
  };

  // Group fragments by date for chronological display
  const groupedFragments = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const weekStart = todayStart - 7 * 86400000;

    const groups: {
      today: CognitiveFragment[];
      yesterday: CognitiveFragment[];
      week: CognitiveFragment[];
      earlier: CognitiveFragment[];
    } = {
      today: [],
      yesterday: [],
      week: [],
      earlier: [],
    };

    for (const frag of fragments) {
      const time = new Date(frag.capturedAt).getTime();
      if (time >= todayStart) {
        groups.today.push(frag);
      } else if (time >= yesterdayStart) {
        groups.yesterday.push(frag);
      } else if (time >= weekStart) {
        groups.week.push(frag);
      } else {
        groups.earlier.push(frag);
      }
    }

    if (activeFilter === 'today') {
      return { today: groups.today, yesterday: [], week: [], earlier: [] };
    }
    if (activeFilter === 'week') {
      return {
        today: groups.today,
        yesterday: groups.yesterday,
        week: groups.week,
        earlier: [],
      };
    }
    if (activeFilter === 'earlier') {
      return { today: [], yesterday: [], week: [], earlier: groups.earlier };
    }

    return groups;
  }, [fragments, activeFilter]);

  const totalFilteredCount =
    groupedFragments.today.length +
    groupedFragments.yesterday.length +
    groupedFragments.week.length +
    groupedFragments.earlier.length;

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
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '40px 24px 120px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '32px',
        }}
      >
        {/* Archives Header & Integrated Search Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              borderBottom: '1.5px solid var(--border-structural)',
              paddingBottom: '16px',
            }}
          >
            <div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.68rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: 'var(--ink-dust)',
                  fontWeight: 600,
                }}
              >
                ARCHIVES // MEMORY LEDGER
              </span>
              <h1
                style={{
                  fontFamily: 'var(--font-headline)',
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  letterSpacing: '-0.025em',
                  color: 'var(--ink-bone)',
                  margin: '4px 0 0 0',
                }}
              >
                Your Memories
              </h1>
            </div>

            <Link
              href="/"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '6px 14px',
                backgroundColor: 'var(--action-espresso)',
                color: 'var(--ink-inverse)',
                textDecoration: 'none',
                border: '1.5px solid var(--ink-bone)',
              }}
            >
              + Record Thought
            </Link>
          </div>

          {/* Search Box Inside Archives */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              backgroundColor: 'var(--surface-pure)',
              border: '1.5px solid var(--ink-bone)',
              boxShadow: 'var(--shadow-slip)',
              padding: '16px 20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>

              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search memories by keyword, person, or semantic concept..."
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'transparent',
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.15rem',
                  color: 'var(--ink-bone)',
                }}
              />

              {query && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  style={{
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--ink-dust)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    padding: '4px 8px',
                  }}
                >
                  CLEAR
                </button>
              )}
            </div>

            {/* Filter Chips Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                paddingTop: '8px',
                borderTop: '1px solid var(--border-hairline)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.65rem',
                  color: 'var(--ink-dust)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginRight: '6px',
                }}
              >
                Filter:
              </span>

              {(['all', 'today', 'week', 'earlier'] as TimeFilter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setActiveFilter(f)}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '3px 10px',
                    border: '1px solid var(--border-structural)',
                    backgroundColor:
                      activeFilter === f ? 'var(--action-espresso)' : 'var(--surface-raised)',
                    color: activeFilter === f ? 'var(--ink-inverse)' : 'var(--ink-stone)',
                    cursor: 'pointer',
                    transition: 'all var(--duration-fast)',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            style={{
              padding: '14px 18px',
              backgroundColor: 'var(--accent-ochre-bg)',
              border: '1.5px solid var(--accent-ochre)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-body)',
              color: 'var(--ink-bone)',
            }}
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={fetchChronologicalFeed}
              style={{
                padding: '4px 12px',
                backgroundColor: 'var(--surface-pure)',
                border: '1px solid var(--border-structural)',
                color: 'var(--ink-bone)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                cursor: 'pointer',
              }}
            >
              RETRY
            </button>
          </div>
        )}

        {/* ============================================================
            MODE 1: SEMANTIC SEARCH RESULTS
           ============================================================ */}
        {debouncedQuery ? (
          <section aria-label="Semantic Search Results" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '8px',
                borderBottom: '1px solid var(--border-structural)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--ink-stone)',
                  letterSpacing: '0.04em',
                }}
              >
                Search: &ldquo;{debouncedQuery}&rdquo;
              </span>

              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--ink-dust)',
                }}
              >
                {isSearching
                  ? 'Retrieving embeddings...'
                  : `${searchResults.length} ${searchResults.length === 1 ? 'relevant memory' : 'relevant memories'}`}
              </span>
            </div>

            {isSearching ? (
              <LoadingSkeleton count={3} />
            ) : searchResults.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {searchResults.map((result, idx) => (
                  <Link
                    key={result.memory.id || idx}
                    href={`/archives/${result.sourceFragment?.id || result.memory.id}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <MemoryResultCard result={result} index={idx} query={debouncedQuery} />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No Relevant Memories Found"
                description={`No memories matched your semantic query for "${debouncedQuery}". Try broader search terms or record a new thought.`}
              />
            )}
          </section>
        ) : (
          /* ============================================================
              MODE 2: CHRONOLOGICAL BROWSE FEED
             ============================================================ */
          <section aria-label="Chronological Memory Ledger" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {isFeedLoading ? (
              <LoadingSkeleton count={4} />
            ) : totalFilteredCount === 0 ? (
              <EmptyState
                title="Your Archive is Empty"
                description="No thoughts have been recorded in this ledger yet. Visit Record to capture your first reflection."
              />
            ) : (
              <>
                {/* TODAY */}
                {groupedFragments.today.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        borderBottom: '1px solid var(--border-structural)',
                        paddingBottom: '6px',
                      }}
                    >
                      <h2
                        style={{
                          fontFamily: 'var(--font-headline)',
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          color: 'var(--ink-bone)',
                          margin: 0,
                        }}
                      >
                        Today
                      </h2>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.68rem',
                          color: 'var(--ink-dust)',
                        }}
                      >
                        ({groupedFragments.today.length})
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {groupedFragments.today.map((frag, idx) => (
                        <Link
                          key={frag.id}
                          href={`/archives/${frag.id}`}
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <FragmentCard fragment={frag} index={idx} />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* YESTERDAY */}
                {groupedFragments.yesterday.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        borderBottom: '1px solid var(--border-structural)',
                        paddingBottom: '6px',
                      }}
                    >
                      <h2
                        style={{
                          fontFamily: 'var(--font-headline)',
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          color: 'var(--ink-bone)',
                          margin: 0,
                        }}
                      >
                        Yesterday
                      </h2>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.68rem',
                          color: 'var(--ink-dust)',
                        }}
                      >
                        ({groupedFragments.yesterday.length})
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {groupedFragments.yesterday.map((frag, idx) => (
                        <Link
                          key={frag.id}
                          href={`/archives/${frag.id}`}
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <FragmentCard fragment={frag} index={idx} />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* THIS WEEK */}
                {groupedFragments.week.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        borderBottom: '1px solid var(--border-structural)',
                        paddingBottom: '6px',
                      }}
                    >
                      <h2
                        style={{
                          fontFamily: 'var(--font-headline)',
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          color: 'var(--ink-bone)',
                          margin: 0,
                        }}
                      >
                        Earlier This Week
                      </h2>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.68rem',
                          color: 'var(--ink-dust)',
                        }}
                      >
                        ({groupedFragments.week.length})
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {groupedFragments.week.map((frag, idx) => (
                        <Link
                          key={frag.id}
                          href={`/archives/${frag.id}`}
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <FragmentCard fragment={frag} index={idx} />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* EARLIER */}
                {groupedFragments.earlier.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        borderBottom: '1px solid var(--border-structural)',
                        paddingBottom: '6px',
                      }}
                    >
                      <h2
                        style={{
                          fontFamily: 'var(--font-headline)',
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          color: 'var(--ink-bone)',
                          margin: 0,
                        }}
                      >
                        Earlier Entries
                      </h2>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.68rem',
                          color: 'var(--ink-dust)',
                        }}
                      >
                        ({groupedFragments.earlier.length})
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {groupedFragments.earlier.map((frag, idx) => (
                        <Link
                          key={frag.id}
                          href={`/archives/${frag.id}`}
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <FragmentCard fragment={frag} index={idx} />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

export default function ArchivesPage() {
  return (
    <Suspense
      fallback={
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
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '40px 24px 120px 24px',
            }}
          >
            <LoadingSkeleton count={4} />
          </main>
          <BottomNav />
        </div>
      }
    >
      <ArchivesContent />
    </Suspense>
  );
}
