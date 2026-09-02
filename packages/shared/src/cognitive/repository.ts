import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { candidateFindings, CandidateFindingSelect } from '../db/schema.js';
import { CandidateFinding, FindingType } from '../reasoning/types.js';

export interface ListFindingsOptions {
  findingType?: FindingType;
  limit?: number;
  offset?: number;
}

export interface ICognitiveRepository {
  saveCandidateFinding(finding: CandidateFinding): Promise<void>;
  saveCandidateFindings(findings: CandidateFinding[]): Promise<void>;
  getCandidateFinding(id: string, userId: string): Promise<CandidateFinding | null>;
  listCandidateFindings(userId: string, options?: ListFindingsOptions): Promise<CandidateFinding[]>;
}

/**
 * Production Drizzle ORM Repository for Candidate Findings
 */
export class DrizzleCognitiveRepository implements ICognitiveRepository {
  async saveCandidateFinding(finding: CandidateFinding): Promise<void> {
    await this.saveCandidateFindings([finding]);
  }

  async saveCandidateFindings(findings: CandidateFinding[]): Promise<void> {
    if (findings.length === 0) return;

    await db.insert(candidateFindings).values(
      findings.map((f) => ({
        id: f.id,
        userId: f.userId,
        findingType: f.findingType,
        summary: f.summary,
        statement: f.statement,
        subjectEntityId: f.subjectEntityId || null,
        objectEntityId: f.objectEntityId || null,
        involvedEntityIds: f.involvedEntityIds || [],
        involvedMemoryIds: f.involvedMemoryIds || [],
        involvedRelationshipIds: f.involvedRelationshipIds || [],
        temporalStart: f.temporalScope.startDate,
        temporalEnd: f.temporalScope.endDate,
        deterministicMetrics: f.deterministicMetrics || {},
        discoveryAlgorithm: f.discoveryAlgorithm,
        discoveryVersion: f.discoveryVersion,
        discoveryConfidence: f.discoveryConfidence,
        provenanceReferences: f.provenanceReferences || [],
        metadata: f.metadata || {},
      }))
    );
  }

  async getCandidateFinding(id: string, userId: string): Promise<CandidateFinding | null> {
    const rows = await db
      .select()
      .from(candidateFindings)
      .where(and(eq(candidateFindings.id, id), eq(candidateFindings.userId, userId)))
      .limit(1);

    if (rows.length === 0) return null;
    return this.mapRowToFinding(rows[0]);
  }

  async listCandidateFindings(
    userId: string,
    options: ListFindingsOptions = {}
  ): Promise<CandidateFinding[]> {
    const { findingType, limit = 50, offset = 0 } = options;

    const conditions = [eq(candidateFindings.userId, userId)];
    if (findingType) {
      conditions.push(eq(candidateFindings.findingType, findingType));
    }

    const rows = await db
      .select()
      .from(candidateFindings)
      .where(and(...conditions))
      .orderBy(desc(candidateFindings.createdAt))
      .limit(limit)
      .offset(offset);

    return rows.map((r) => this.mapRowToFinding(r));
  }

  private mapRowToFinding(row: CandidateFindingSelect): CandidateFinding {
    return {
      id: row.id,
      userId: row.userId,
      findingType: row.findingType as FindingType,
      summary: row.summary,
      statement: row.statement,
      subjectEntityId: row.subjectEntityId || undefined,
      objectEntityId: row.objectEntityId || undefined,
      involvedEntityIds: (row.involvedEntityIds as string[]) || [],
      involvedMemoryIds: (row.involvedMemoryIds as string[]) || [],
      involvedRelationshipIds: (row.involvedRelationshipIds as string[]) || [],
      temporalScope: {
        startDate: row.temporalStart,
        endDate: row.temporalEnd,
      },
      deterministicMetrics: (row.deterministicMetrics as CandidateFinding['deterministicMetrics']) || {
        distinctFragmentCount: 0,
      },
      discoveryAlgorithm: row.discoveryAlgorithm,
      discoveryVersion: row.discoveryVersion,
      discoveryConfidence: row.discoveryConfidence,
      provenanceReferences: (row.provenanceReferences as CandidateFinding['provenanceReferences']) || [],
      metadata: (row.metadata as Record<string, unknown>) || {},
    };
  }
}

/**
 * In-Memory Cognitive Repository for fast, isolated testing
 */
export class InMemoryCognitiveRepository implements ICognitiveRepository {
  private findings = new Map<string, CandidateFinding>();

  async saveCandidateFinding(finding: CandidateFinding): Promise<void> {
    this.findings.set(`${finding.userId}:${finding.id}`, { ...finding });
  }

  async saveCandidateFindings(findings: CandidateFinding[]): Promise<void> {
    for (const f of findings) {
      await this.saveCandidateFinding(f);
    }
  }

  async getCandidateFinding(id: string, userId: string): Promise<CandidateFinding | null> {
    const finding = this.findings.get(`${userId}:${id}`);
    return finding ? { ...finding } : null;
  }

  async listCandidateFindings(
    userId: string,
    options: ListFindingsOptions = {}
  ): Promise<CandidateFinding[]> {
    const { findingType, limit = 50, offset = 0 } = options;

    const all = Array.from(this.findings.values()).filter((f) => f.userId === userId);

    const filtered = findingType ? all.filter((f) => f.findingType === findingType) : all;

    // Deterministic sort: temporalScope.endDate DESC, id ASC
    filtered.sort((a, b) => {
      const timeDiff = b.temporalScope.endDate.getTime() - a.temporalScope.endDate.getTime();
      return timeDiff !== 0 ? timeDiff : a.id.localeCompare(b.id);
    });

    return filtered.slice(offset, offset + limit);
  }

  clear() {
    this.findings.clear();
  }
}
