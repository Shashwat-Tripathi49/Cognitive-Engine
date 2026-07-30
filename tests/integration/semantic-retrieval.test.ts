import { describe, it, expect } from 'vitest';
import { MemoryEngine } from '../../packages/shared/src/memory/engine.js';
import { DrizzleMemoryRepository } from '../../packages/shared/src/memory/repository.js';
import { MiniLMEmbeddingProvider } from '../../packages/shared/src/memory/embedding-provider.js';
import { CognitiveFragment } from '../../packages/shared/src/capture/types.js';

describe('Workstream 1: Production Semantic Retrieval Integration Test', () => {
  it('should retrieve top-5 semantic memories using real MiniLM embeddings', async () => {
    const repository = new DrizzleMemoryRepository();
    const provider = new MiniLMEmbeddingProvider();
    const engine = new MemoryEngine(repository, undefined, provider);
    const userId = 'user_val_prod_001';

    // 25 Realistic Memories across 9 target topics
    const seedCorpus: Array<{ id: string; text: string; category: string }> = [
      // Topic 1: Expense Tracker
      { id: 'mem_01', category: 'Expense Tracker', text: 'Built the transaction synchronization module for the expense tracker app with Drizzle ORM.' },
      { id: 'mem_02', category: 'Expense Tracker', text: 'Fixed a race condition in the budgeting ledger batch writer.' },
      { id: 'mem_03', category: 'Expense Tracker', text: 'Designed crisp dark mode mockups for financial expense tracking charts.' },

      // Topic 2: CAT Preparation
      { id: 'mem_04', category: 'CAT Preparation', text: 'Solved 15 Data Interpretation sets for CAT 2026 practice.' },
      { id: 'mem_05', category: 'CAT Preparation', text: 'Revised Quantitative Aptitude geometry formulas and speed distance problems.' },
      { id: 'mem_06', category: 'CAT Preparation', text: 'Took a full-length CAT mock exam and scored in the 98th percentile on VARC.' },

      // Topic 3: Gym & Fitness
      { id: 'mem_07', category: 'Gym', text: 'Completed heavy leg day workout including squats and Romanian deadlifts.' },
      { id: 'mem_08', category: 'Gym', text: 'Hit a personal record on barbell bench press with 100kg for 5 clean reps.' },
      { id: 'mem_09', category: 'Gym', text: 'Tracked daily macro intake ensuring 160g of protein for muscle recovery.' },

      // Topic 4: Placements
      { id: 'mem_10', category: 'Placements', text: 'Practiced system design questions focusing on rate limiters and load balancing for placement interviews.' },
      { id: 'mem_11', category: 'Placements', text: 'Updated my software engineering resume to highlight monorepo architecture and vector search.' },
      { id: 'mem_12', category: 'Placements', text: 'Mock technical interview with senior engineer covering graph algorithms and dynamic programming.' },

      // Topic 5: React
      { id: 'mem_13', category: 'React', text: 'Refactored custom React hooks to prevent unnecessary component re-renders.' },
      { id: 'mem_14', category: 'React', text: 'Migrated web dashboard to Next.js 15 App Router using React Server Components.' },
      { id: 'mem_15', category: 'React', text: 'Implemented dynamic UI animations using TailwindCSS and Framer Motion.' },

      // Topic 6: Node.js
      { id: 'mem_16', category: 'Node.js', text: 'Optimized Node.js backend API response latency using asynchronous worker streams.' },
      { id: 'mem_17', category: 'Node.js', text: 'Configured Hono API server middleware for Bearer JWT token verification.' },
      { id: 'mem_18', category: 'Node.js', text: 'Debugged memory leak in Node.js event loop caused by unclosed database connections.' },

      // Topic 7: Travel
      { id: 'mem_19', category: 'Travel', text: 'Booked flights and itinerary for summer mountain hiking trip to Himachal.' },
      { id: 'mem_20', category: 'Travel', text: 'Explored local street food markets and historical temples in Kyoto during vacation.' },

      // Topic 8: Relationships
      { id: 'mem_21', category: 'Relationships', text: 'Had a long meaningful phone call with parents discussing career goals and weekend plans.' },
      { id: 'mem_22', category: 'Relationships', text: 'Celebrated best friend birthday dinner at an Italian restaurant downtown.' },

      // Topic 9: Finances
      { id: 'mem_23', category: 'Finances', text: 'Allocated monthly savings into low-cost index funds and long-term equity portfolio.' },
      { id: 'mem_24', category: 'Finances', text: 'Reviewed credit card monthly spending statements and trimmed recurring subscriptions.' },
      { id: 'mem_25', category: 'Finances', text: 'Created an emergency fund liquidity plan covering 6 months of living expenses.' }
    ];

    console.log('Seeding 25 realistic memories using real MiniLM embedding provider...');

    for (const item of seedCorpus) {
      const fragment: CognitiveFragment = {
        id: item.id,
        userId,
        content: item.text,
        modality: 'text',
        source: 'journal',
        metadata: { category: item.category },
        contentHash: `hash_${item.id}`,
        capturedAt: new Date()
      };
      await engine.createMemoryFromFragment(fragment);
    }

    const testQueries = [
      'budget app',
      'frontend project',
      'placement preparation',
      'workout',
      'money management',
      'career advice'
    ];

    console.log('\n=======================================================');
    console.log('VERBATIM RETRIEVAL EVALUATION REPORT');
    console.log('=======================================================\n');

    for (const query of testQueries) {
      const results = await engine.searchSimilarMemories(userId, query, { topK: 5 });
      console.log(`\n-------------------------------------------------------`);
      console.log(`QUERY: "${query}"`);
      console.log(`-------------------------------------------------------`);
      expect(results.length).toBe(5);

      results.forEach((res, rank) => {
        console.log(`Rank ${rank + 1} [Sim: ${res.similarity.toFixed(4)}]: "${res.memory.content}"`);
      });
    }

    console.log('\n=======================================================\n');
  }, 120000);
});
