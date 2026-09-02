import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { LayeredHybridEntityResolver } from '../resolution/resolver.js';
import { RESOLVER_CONSTANTS } from '../resolution/constants.js';
import { CanonicalEntity, EntityType } from '../types.js';

describe('Phase KG-03 — Layered Hybrid Entity Resolver V2', () => {
  const dummyUser = '00000000-0000-0000-0000-000000000001';

  const sampleCanonicals: CanonicalEntity[] = [
    {
      id: 'ent_expense_tracker',
      userId: dummyUser,
      canonicalName: 'Expense Tracker',
      entityType: 'Project',
      status: 'ACTIVE',
      aliases: ['personal finance tool', 'budgeting dashboard'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'ent_fittrack',
      userId: dummyUser,
      canonicalName: 'FitTrack',
      entityType: 'Project',
      status: 'ACTIVE',
      aliases: ['fitness tracker'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'ent_rahul',
      userId: dummyUser,
      canonicalName: 'Rahul',
      entityType: 'Person',
      status: 'ACTIVE',
      aliases: ['Rahul Sharma'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'ent_postgres',
      userId: dummyUser,
      canonicalName: 'PostgreSQL',
      entityType: 'Tool',
      status: 'ACTIVE',
      aliases: ['Postgres'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'ent_react',
      userId: dummyUser,
      canonicalName: 'React',
      entityType: 'Tool',
      status: 'ACTIVE',
      aliases: ['ReactJS'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'ent_fastapi',
      userId: dummyUser,
      canonicalName: 'FastAPI',
      entityType: 'Tool',
      status: 'ACTIVE',
      aliases: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  it('Layer 1: should intercept generic anaphora and ambiguous deictic references', async () => {
    const resolver = new LayeredHybridEntityResolver();

    const mentions = [
      'the project',
      'a tool',
      'my manager',
      'he',
      'they',
      '5k goal',
      'dashboard',
    ];

    for (const m of mentions) {
      const res = await resolver.resolve(m, 'Project', sampleCanonicals);
      expect(res.outcome).toBe('AMBIGUOUS');
      expect(res.resolutionMethod).toMatch(/L1_/);
    }
  });

  it('Layer 2: should resolve exact and normalized matches with 1.0 confidence', async () => {
    const resolver = new LayeredHybridEntityResolver();

    const res1 = await resolver.resolve('Expense Tracker', 'Project', sampleCanonicals);
    expect(res1.outcome).toBe('RESOLVED');
    expect(res1.canonicalId).toBe('ent_expense_tracker');
    expect(res1.confidence).toBe(1.0);
    expect(res1.resolutionMethod).toBe('L2_EXACT_NORMALIZED_MATCH');

    const res2 = await resolver.resolve('expense-tracker', 'Project', sampleCanonicals);
    expect(res2.outcome).toBe('RESOLVED');
    expect(res2.canonicalId).toBe('ent_expense_tracker');
  });

  it('Layer 3: should resolve verified active aliases with 1.0 confidence', async () => {
    const resolver = new LayeredHybridEntityResolver();

    const res1 = await resolver.resolve('personal finance tool', 'Project', sampleCanonicals);
    expect(res1.outcome).toBe('RESOLVED');
    expect(res1.canonicalId).toBe('ent_expense_tracker');
    expect(res1.resolutionMethod).toBe('L3_VERIFIED_ALIAS_MATCH');

    const res2 = await resolver.resolve('Rahul Sharma', 'Person', sampleCanonicals);
    expect(res2.outcome).toBe('RESOLVED');
    expect(res2.canonicalId).toBe('ent_rahul');
    expect(res2.resolutionMethod).toBe('L3_VERIFIED_ALIAS_MATCH');
  });

  it('Layer 4: Modifier Trap Gatekeeper must reject extension/sibling tools to prevent false merges', async () => {
    const resolver = new LayeredHybridEntityResolver();

    // "Postgres Operator" != "PostgreSQL"
    const res1 = await resolver.resolve('Postgres Operator', 'Tool', sampleCanonicals);
    expect(res1.outcome).toBe('NO_MATCH');
    expect(res1.resolutionMethod).toBe('L4_MODIFIER_TRAP_GATEKEEPER');

    // "FastAPI CLI" != "FastAPI"
    const res2 = await resolver.resolve('FastAPI CLI', 'Tool', sampleCanonicals);
    expect(res2.outcome).toBe('NO_MATCH');
    expect(res2.resolutionMethod).toBe('L4_MODIFIER_TRAP_GATEKEEPER');

    // "React Native" != "React"
    const res3 = await resolver.resolve('React Native', 'Tool', sampleCanonicals);
    expect(res3.outcome).toBe('NO_MATCH');
    expect(res3.resolutionMethod).toBe('L4_MODIFIER_TRAP_GATEKEEPER');
  });

  it('Layer 5: should resolve high-precision string variations (SequenceMatcher >= 0.85)', async () => {
    const resolver = new LayeredHybridEntityResolver();

    const res = await resolver.resolve('ExpenseTracker', 'Project', sampleCanonicals);
    expect(res.outcome).toBe('RESOLVED');
    expect(res.canonicalId).toBe('ent_expense_tracker');
    expect(res.similarityScore).toBeGreaterThanOrEqual(RESOLVER_CONSTANTS.STRING_SIM_THRESHOLD);
    expect(res.resolutionMethod).toBe('L5_STRING_SIMILARITY');
  });

  it('should evaluate the 90-case Experiment 004B Gold Benchmark with 0 false merges', async () => {
    const benchmarkPath = path.resolve(
      __dirname,
      '../../../../../experiments/journal-clustering/dataset/entity_resolution_004b_gold.json'
    );

    if (!fs.existsSync(benchmarkPath)) {
      console.warn('Benchmark dataset file not found, skipping gold run.');
      return;
    }

    const goldData = JSON.parse(fs.readFileSync(benchmarkPath, 'utf-8'));
    const canonicals: CanonicalEntity[] = goldData.canonical_entities.map((c: { id: string; canonical_name: string; type: EntityType; active_verified_aliases?: string[] }) => ({
      id: c.id,
      userId: dummyUser,
      canonicalName: c.canonical_name,
      entityType: c.type,
      status: 'ACTIVE' as const,
      aliases: c.active_verified_aliases || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const resolver = new LayeredHybridEntityResolver();

    let falseMergesGlobal = 0;
    let falseMergesHardNeg = 0;
    let resolvedCount = 0;

    for (const testCase of goldData.cases) {
      const mention = testCase.surfaceMention;
      const entityType = testCase.entityType as EntityType;
      const expectedOutcome = testCase.expectedOutcome;
      const expectedCid = testCase.canonicalEntityId;
      const category = testCase.category;

      const res = await resolver.resolve(mention, entityType, canonicals);

      if (res.outcome === 'RESOLVED') {
        resolvedCount++;
        if (expectedOutcome !== 'RESOLVED' || res.canonicalId !== expectedCid) {
          falseMergesGlobal++;
          if (category === 'CAT_H_Hard_Negative_Trap') {
            falseMergesHardNeg++;
          }
        }
      }
    }

    // Predeclared Safety Gates: ZERO FALSE MERGES
    expect(falseMergesGlobal).toBe(0);
    expect(falseMergesHardNeg).toBe(0);
    expect(resolvedCount).toBeGreaterThan(0);
  });
});
