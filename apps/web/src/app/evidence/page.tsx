"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { CognitiveFragment } from '@cognitive-engine/shared';
import { AppHeader } from '@/components/AppHeader';
import { BottomNav } from '@/components/BottomNav';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { useApi } from '@/lib/api';

export default function EvidencePage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<'all' | 'findings' | 'fragments'>('findings');

  const [findings, setFindings] = useState<
    | Array<{
        id: string;
        findingType?: string;
        confidence?: number;
        description?: string;
        title?: string;
        sourceFragmentIds?: string[];
      }>
    | []
  >([]);
  const [fragments, setFragments] = useState<CognitiveFragment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const api = useApi();

  const loadFindings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setFindings([]);

    try {
      const res = await api.getCognitiveFindings();
      const data = res.data as Array<{
        id: string;
        findingType?: string;
        confidence?: number;
        description?: string;
        title?: string;
        sourceFragmentIds?: string[];
      }> || [];
      setFindings(data);
    } catch (err) {
      console.warn('Failed to load cognitive findings:', err);
      setError('Could not load cognitive findings.');
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  const loadFragments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setFragments([]);

    try {
      const res = await api.listCaptures(1, 40);
      const data = res.data as CognitiveFragment[] || [];
      setFragments(data);
    } catch (err) {
      console.warn('Failed to load fragments:', err);
      setError('Could not load fragments.');
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadFindings();
    loadFragments();
  }, [loadFindings, loadFragments]);

  const groupedFragments = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const weekStart = todayStart - 7 * 86400000;

    const groups = {
      today: [] as CognitiveFragment[],
      yesterday: [] as CognitiveFragment[],
      week: [] as CognitiveFragment[],
      earlier: [] as CognitiveFragment[],
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

    return groups;
  }, [fragments]);

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
        <nav aria-label="Breadcrumb">
          <Link
            href="/archives"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: 'var(--ink-stone)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>←</span> Back to Archives
          </Link>
        </nav>

        {/* Archives Header */}
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
              EVIDENCE INDEX // COGNITIVE FINDINGS
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
              Cognitive Findings
            </h1>
          </div>

          {/* Search Box */}
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
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search findings..."
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
              {['all', 'findings', 'fragments'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setActiveFilter(f as 'all' | 'findings' | 'fragments')}
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
              onClick={loadFindings}
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

        {/* Findings List */}
        {findings.length > 0 && (
          <section
            aria-label="Cognitive Findings"
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            {findings.map((finding, fi) => {
              const sourceFragments = finding.sourceFragmentIds || [];

              return (
                <article
                  key={finding.id}
                  style={{
                    backgroundColor: 'var(--surface-pure)',
                    border: '1.5px solid var(--ink-bone)',
                    boxShadow: 'var(--shadow-card)',
                    padding: '24px 28px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid var(--border-hairline)',
                      paddingBottom: '10px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.72rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: 'var(--accent-moss)',
                        fontWeight: 600,
                      }}
                    >
                      FINDING // {finding.findingType || 'PATTERN'}
                    </span>

                    {finding.confidence !== undefined && (
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          backgroundColor: 'var(--surface-raised)',
                          border: '1px solid var(--border-structural)',
                          color: 'var(--ink-stone)',
                        }}
                      >
                        CONFIDENCE: {(finding.confidence * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>

                  <h3
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '1.35rem',
                      lineHeight: '1.4',
                      color: 'var(--ink-bone)',
                      margin: 0,
                    }}
                  >
                    {finding.description || finding.title || 'Emerging cognitive pattern detected'}
                  </h3>

                  {/* Source Fragment Links */}
                  {sourceFragments.length > 0 && (
                    <div
                      style={{
                        marginTop: '12px',
                        padding: '16px 20px',
                        backgroundColor: 'var(--surface-raised)',
                        border: '1px solid var(--border-structural)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.68rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: 'var(--ink-dust)',
                          fontWeight: 600,
                        }}
                      >
                        Source Fragments Linked: {sourceFragments.length}
                      </span>

                      <p
                        style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '0.85rem',
                          lineHeight: '1.5',
                          color: 'var(--ink-stone)',
                          margin: 0,
                        }}
                      >
                        The following {sourceFragments.length} source fragment{'s are' +
                          (sourceFragments.length > 1 ? '' : '') } linked to this finding:
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {sourceFragments.map((fId: string, idx) => (
                          <Link
                            key={idx}
                            href={`/archives/${fId}`}
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.72rem',
                              color: 'var(--ink-bone)',
                              textDecoration: 'underline',
                            }}
                          >
                            Fragment #{fId.slice(0, 8)}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {!sourceFragments.length && (
                    <p
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontStyle: 'italic',
                        fontSize: '0.85rem',
                        color: 'var(--ink-dust)',
                        margin: 0,
                      }}
                    >
                      No source fragments linked to this finding. Record more thoughts
                      for the Cognitive Engine to detect and link patterns.
                    </p>
                  )}
                </article>
              );
            })}
          </section>
        )}

        {/* Empty State - No Findings */}
        {findings.length === 0 && !error && (
          <div
            style={{
              backgroundColor: 'var(--surface-pure)',
              border: '1.5px solid var(--ink-bone)',
              boxShadow: 'var(--shadow-slip)',
              padding: '48px 36px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}
          >
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
              EVIDENCE INDEX // NO FINDINGS
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-headline)',
                fontSize: '1.85rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--ink-bone)',
                maxWidth: '600px',
              }}
            >
              No cognitive findings yet
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.05rem',
                lineHeight: '1.6',
                color: 'var(--ink-stone)',
                maxWidth: '560px',
                margin: 0,
              }}
            >
              No cognitive patterns have been detected. Record more observations for
              the Cognitive Engine to surface recurring topics and validated claims.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <Link
                href="/"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: '10px 22px',
                  backgroundColor: 'var(--action-espresso)',
                  color: 'var(--ink-inverse)',
                  textDecoration: 'none',
                  border: '1.5px solid var(--ink-bone)',
                }}
              >
                Record a Thought →
              </Link>

              <Link
                href="/archives"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: '10px 22px',
                  backgroundColor: 'var(--surface-raised)',
                  color: 'var(--ink-bone)',
                  textDecoration: 'none',
                  border: '1px solid var(--border-structural)',
                }}
              >
                Browse Archives
              </Link>
            </div>
          </div>
        )}

        {/* Fragments Browser */}
        {fragments.length > 0 && (
          <section
            aria-label="Cognitive Fragments"
            style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
          >
            {fragments.map((frag, fi) => (
              <div
                key={frag.id}
                style={{
                  backgroundColor: 'var(--surface-pure)',
                  border: '1px solid var(--border-structural)',
                  borderRadius: 'var(--radius-stamp)',
                  padding: '20px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'background-color var(--duration-micro) var(--ease-precise)',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.1rem',
                    lineHeight: '1.5',
                    color: 'var(--ink-bone)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {frag.content}
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.68rem',
                      color: 'var(--ink-dust)',
                      textTransform: 'uppercase',
                    }}
                  >
                    REF // {frag.id.slice(0, 8)}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.68rem',
                      color: 'var(--accent-moss)',
                      fontWeight: 600,
                    }}
                  >
                    ✓ IMMUTABLE
                  </span>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Fragments Empty State */}
        {fragments.length === 0 && !isLoading && !error && (
          <div
            style={{
              backgroundColor: 'var(--surface-pure)',
              border: '1.5px solid var(--ink-bone)',
              boxShadow: 'var(--shadow-slip)',
              padding: '48px 36px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}
          >
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
              EVIDENCE INDEX // NO FRAGMENTS
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-headline)',
                fontSize: '1.85rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--ink-bone)',
                maxWidth: '600px',
              }}
            >
              No captured thoughts yet
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.05rem',
                lineHeight: '1.6',
                color: 'var(--ink-stone)',
                maxWidth: '560px',
                margin: 0,
              }}
            >
              No thoughts have been recorded in this ledger yet. Visit Record to capture
              your first reflection.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <Link
                href="/"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: '10px 22px',
                  backgroundColor: 'var(--action-espresso)',
                  color: 'var(--ink-inverse)',
                  textDecoration: 'none',
                  border: '1.5px solid var(--ink-bone)',
                }}
              >
                Record a Thought →
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
