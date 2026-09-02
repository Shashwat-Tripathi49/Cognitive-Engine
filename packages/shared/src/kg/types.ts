import { z } from 'zod';

/**
 * First-Class Supported Entity Types — Knowledge Graph Ontology v1
 */
export const VALID_ENTITY_TYPES = [
  'Person',
  'Project',
  'Organization',
  'Place',
  'Tool',
  'Topic',
  'Goal',
] as const;

export type EntityType = (typeof VALID_ENTITY_TYPES)[number];

export const entityTypeSchema = z.enum(VALID_ENTITY_TYPES);

/**
 * Explicitly Rejected Entity Types (Phase 2 Exclusions)
 */
export const REJECTED_ENTITY_TYPES = [
  'Emotion',
  'Mood',
  'Task',
  'Action Item',
  'Habit',
  'Routine',
  'Document',
  'File',
  'Insight',
  'Reflective Prompt',
] as const;

export type RejectedEntityType = (typeof REJECTED_ENTITY_TYPES)[number];

/**
 * Valid Relationship Types — Knowledge Graph Ontology v1
 */
export const VALID_RELATIONSHIP_TYPES = [
  'WORKED_ON',
  'COLLABORATED_WITH',
  'PREPARED_FOR',
  'USES_TECHNOLOGY',
  'BELONGS_TO',
  'LOCATED_AT',
  'MENTIONED_WITH',
] as const;

export type RelationshipType = (typeof VALID_RELATIONSHIP_TYPES)[number];

export const relationshipTypeSchema = z.enum(VALID_RELATIONSHIP_TYPES);

/**
 * Entity Resolution Decision Outcomes — 3-State Model
 */
export type ResolutionOutcome = 'RESOLVED' | 'AMBIGUOUS' | 'NO_MATCH';

/**
 * Entity Status Enum
 */
export type CanonicalEntityStatus = 'ACTIVE' | 'MERGED' | 'ARCHIVED';

/**
 * Alias Status Enum
 */
export type EntityAliasStatus =
  | 'PROPOSED'
  | 'ACTIVE'
  | 'AMBIGUOUS'
  | 'REVOKED'
  | 'SUPERSEDED';

/**
 * Candidate Confirmation Status Enum
 */
export type ConfirmationStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'DISMISSED';

/**
 * Canonical Entity Domain Model
 */
export interface CanonicalEntity {
  id: string;
  userId: string;
  canonicalName: string;
  entityType: EntityType;
  status: CanonicalEntityStatus;
  mergedIntoId?: string | null;
  currentCanonicalId?: string | null;
  description?: string | null;
  aliases?: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Entity Alias Domain Model
 */
export interface EntityAlias {
  id: string;
  userId: string;
  canonicalId: string;
  aliasName: string;
  normalizedAlias: string;
  status: EntityAliasStatus;
  verificationActor: string;
  sourceMemoryId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Entity Resolution Provenance Domain Model
 */
export interface EntityResolutionProvenance {
  id: string;
  userId: string;
  mentionId: string;
  sourceFragmentId: string;
  sourceFragmentRevisionId?: string | null;
  sourceContentHash: string;
  sourceMemoryId?: string | null;
  canonicalId?: string | null;
  surfaceMention: string;
  resolutionMethod: string;
  similarityScore?: number | null;
  separationMargin?: number | null;
  resolverVersion: string;
  decidedBy: string;
  createdAt: Date;
}

/**
 * Candidate Confirmation Queue Item Domain Model
 */
export interface CandidateConfirmationItem {
  id: string;
  userId: string;
  surfaceMention: string;
  entityType: EntityType;
  suggestedCanonicalId?: string | null;
  similarityScore?: number | null;
  sourceMemoryId?: string | null;
  sourceFragmentId?: string | null;
  status: ConfirmationStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Graph Relationship Domain Model (Bitemporal Assertions)
 */
export interface GraphRelationship {
  id: string;
  userId: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationType: RelationshipType;
  confidence: number;
  evidenceCount: number;
  sourceFragmentId: string;
  sourceMemoryId?: string | null;
  sourceContentHash: string;
  extractionRunId?: string | null;
  status: string;
  assertedAt: Date;
  validAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Resolution Result Object returned by the Layered Hybrid Resolver
 */
export interface ResolutionResult {
  outcome: ResolutionOutcome;
  canonicalId?: string;
  confidence: number;
  similarityScore?: number;
  separationMargin?: number;
  resolutionMethod: string;
  suggestedCanonicalId?: string;
}

/**
 * End-to-End Fragment Processing Result
 */
export interface ProcessFragmentResult {
  fragmentId: string;
  entitiesExtracted: number;
  entitiesResolved: number;
  entitiesCreated: number;
  entitiesAmbiguous: number;
  relationshipsCreated: number;
  resolvedEntities: {
    mention: string;
    entityType: EntityType;
    outcome: ResolutionOutcome;
    canonicalId?: string;
    canonicalName?: string;
    resolutionMethod: string;
    confidence: number;
  }[];
  graphRelationships: GraphRelationship[];
  provenanceIds: string[];
  executionTimeMs: number;
}

/**
 * Subgraph Query Options
 */
export interface SubgraphQueryOptions {
  entityId?: string;
  fragmentId?: string;
  relationTypes?: RelationshipType[];
  maxDepth?: number; // Default 1, max 3
  limit?: number;
}

/**
 * Subgraph Query Result
 */
export interface SubgraphResult {
  nodes: CanonicalEntity[];
  edges: GraphRelationship[];
}
