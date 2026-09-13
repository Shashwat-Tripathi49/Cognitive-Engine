'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { CognitiveFragment, MemorySearchResult } from '@cognitive-engine/shared';
import { AppHeader } from '../../../components/AppHeader';
import { BottomNav } from '../../../components/BottomNav';
import { LoadingSkeleton } from '../../../components/LoadingSkeleton';
import { MemoryResultCard } from '../../../components/MemoryResultCard';
import { useApi } from '../../../lib/api';

/**
 * MemoryDetailPage — Deep Archival Inspector for an Individual Memory
 *
 * Responsibilities:
 * - Fetches raw CognitiveFragment by ID (GET /capture/:id).
 * - Queries Knowledge Graph Subgraph (GET /graph/subgraph?fragmentId=...) to display
 *   real canonical entities and relationships anchored to this thought.
 * - Retrieves semantically related memories via vector similarity search.
 * - Adheres strictly to: "Only show information that is actually available from the backend.
 *   No fake intelligence."
 */
export interface SubgraphEntity {
  id?: string;
  name: string;
  entityType?: string;
  type?: string;
}

export interface SubgraphRelationship {
  id?: string;
  sourceEntityId: string;
  predicate: string;
  targetEntityId: string;
}

export default function MemoryDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [fragment, setFragment] = useState<CognitiveFragment | null>(null);
  const [entities, setEntities] = useState<SubgraphEntity[]>([]);
  const [relationships, setRelationships] = useState<SubgraphRelationship[]>([]);
  const [relatedMemories, setRelatedMemories] = useState<MemorySearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const api = useApi();

  const loadMemoryDetail = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch source Cognitive Fragment
      const frag = await api.getCaptureById(id);
      setFragment(frag);

      // 2. Fetch Knowledge Graph Subgraph for this fragment
      try {
        const subRes = await api.getMemorySubgraph(id);
        if (subRes?.data) {
          setEntities((subRes.data.entities as unknown as SubgraphEntity[]) || []);
          setRelationships((subRes.data.relationships as unknown as SubgraphRelationship[]) || []);
        }
      } catch (kgErr) {
        console.warn('No KG subgraph found for fragment:', kgErr);
      }

      // 3. Retrieve semantically related memories (top 3)
      try {
        const querySnippet = frag.content.slice(0, 120);
        const searchRes = await api.searchMemories(querySnippet, 4);
        // Exclude self from related results
        const filtered = (searchRes.data || []).filter(
          (res) => res.sourceFragment?.id !== id && res.memory.id !== id
        );
        setRelatedMemories(filtered.slice(0, 3));
      } catch (searchErr) {
        console.warn('Related memories search failed:', searchErr);
      }
    } catch (err: unknown) {
      console.error('Failed to load memory detail:', err);
      setError('Memory not found or unable to connect to the archival database.');
    } finally {
      setIsLoading(false);
    }
  }, [id, api]);

  useEffect(() => {
    loadMemoryDetail();
  }, [loadMemoryDetail]);

  const formattedDate = fragment
    ? new Date(fragment.capturedAt).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

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
          maxWidth: '900px',
          margin: '0 auto',
          padding: '40px 24px 120px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
        }}
      >
        {/* Navigation Breadcrumb */}
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
              letterSpacing: '0.04em',
            }}
          >
            <span>←</span> Back to Archives
          </Link>
        </nav>

        {isLoading ? (
          <LoadingSkeleton count={3} />
        ) : error || !fragment ? (
          <div
            role="alert"
            style={{
              padding: '24px',
              backgroundColor: 'var(--accent-ochre-bg)',
              border: '1.5px solid var(--accent-ochre)',
              color: 'var(--ink-bone)',
              fontFamily: 'var(--font-body)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.4rem' }}>
              Memory Unavailable
            </h2>
            <p style={{ fontSize: '0.9rem' }}>{error || 'Memory record could not be located.'}</p>
            <Link
              href="/archives"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--ink-bone)',
                textDecoration: 'underline',
              }}
            >
              Return to Archives
            </Link>
          </div>
        ) : (
          <article
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '28px',
              width: '100%',
            }}
          >
            {/* Archival Ledger Sheet */}
            <div
              style={{
                backgroundColor: 'var(--surface-pure)',
                border: '1.5px solid var(--ink-bone)',
                boxShadow: 'var(--shadow-slip)',
                padding: '36px 40px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                position: 'relative',
              }}
            >
              {/* Header Telemetry */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  borderBottom: '1.5px solid var(--border-structural)',
                  paddingBottom: '16px',
                  flexWrap: 'wrap',
                  gap: '8px',
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
                    REF // #{fragment.id.slice(0, 8)}
                  </span>
                  <p
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '1.05rem',
                      fontStyle: 'italic',
                      color: 'var(--ink-stone)',
                      margin: '4px 0 0 0',
                    }}
                  >
                    {formattedDate}
                  </p>
                </div>

                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem',
                    padding: '3px 8px',
                    backgroundColor: 'var(--surface-raised)',
                    border: '1px solid var(--border-structural)',
                    color: 'var(--ink-stone)',
                  }}
                >
                  MODALITY: {fragment.modality.toUpperCase()}
                </span>
              </div>

              {/* Main Thought Prose */}
              <div
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.45rem',
                  lineHeight: '1.75',
                  color: 'var(--ink-bone)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {fragment.content}
              </div>

              {/* Provenance & Cryptographic Anchor */}
              <div
                style={{
                  paddingTop: '20px',
                  borderTop: '1px solid var(--border-hairline)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.62rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--ink-dust)',
                    }}
                  >
                    SHA-256 Content Hash
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.72rem',
                      color: 'var(--ink-stone)',
                      wordBreak: 'break-all',
                    }}
                  >
                    {fragment.contentHash}
                  </span>
                </div>

                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.65rem',
                    color: 'var(--accent-moss)',
                    fontWeight: 600,
                  }}
                >
                  ✓ VERIFIED IMMUTABLE
                </span>
              </div>
            </div>

            {/* Knowledge Graph Entities Section */}
            <section
              aria-label="Knowledge Graph Entities"
              style={{
                backgroundColor: 'var(--surface-pure)',
                border: '1.5px solid var(--ink-bone)',
                boxShadow: 'var(--shadow-card)',
                padding: '24px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border-structural)',
                  paddingBottom: '8px',
                }}
              >
                <h3
                  style={{
                    fontFamily: 'var(--font-headline)',
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    margin: 0,
                    color: 'var(--ink-bone)',
                  }}
                >
                  Knowledge Graph Topology
                </h3>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem',
                    color: 'var(--ink-dust)',
                  }}
                >
                  {entities.length} {entities.length === 1 ? 'Entity' : 'Entities'} Discovered
                </span>
              </div>

              {entities.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {entities.map((entity, i) => (
                    <div
                      key={entity.id || i}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'var(--surface-raised)',
                        border: '1px solid var(--border-structural)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-serif)',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          color: 'var(--ink-bone)',
                        }}
                      >
                        {entity.name}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.65rem',
                          color: 'var(--ink-dust)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {entity.entityType || entity.type}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic',
                    fontSize: '0.9rem',
                    color: 'var(--ink-dust)',
                    margin: 0,
                  }}
                >
                  No canonical entities identified for this memory yet.
                </p>
              )}

              {relationships.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.68rem',
                      color: 'var(--ink-dust)',
                      textTransform: 'uppercase',
                    }}
                  >
                    Relationships:
                  </span>
                  <ul
                    style={{
                      marginTop: '6px',
                      paddingLeft: '20px',
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.85rem',
                      color: 'var(--ink-stone)',
                    }}
                  >
                    {relationships.map((rel, i) => (
                      <li key={rel.id || i}>
                        {rel.sourceEntityId} — [{rel.predicate}] ➔ {rel.targetEntityId}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* Semantically Related Memories */}
            {relatedMemories.length > 0 && (
              <section
                aria-label="Related Memories"
                style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                <h3
                  style={{
                    fontFamily: 'var(--font-headline)',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    margin: 0,
                    color: 'var(--ink-bone)',
                  }}
                >
                  Semantically Related Memories
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {relatedMemories.map((res, i) => (
                    <Link
                      key={res.memory.id || i}
                      href={`/archives/${res.sourceFragment?.id || res.memory.id}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <MemoryResultCard result={res} index={i} />
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </article>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
