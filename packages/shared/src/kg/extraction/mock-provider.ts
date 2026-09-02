import {
  EntityExtractionProvider,
  StructuredExtractionResult,
  ExtractedEntityMention,
} from './types.js';
import { ExtractionValidator } from './validator.js';

/**
 * Built-in dictionary of standard entities across the benchmark and typical thoughts
 */
const DEFAULT_MOCK_ENTITIES: { pattern: RegExp; name: string; type: string }[] = [
  // People
  { pattern: /\b(Rahul(?:\s+Sharma)?)\b/i, name: 'Rahul', type: 'Person' },
  { pattern: /\b(Priya(?:\s+Patel)?)\b/i, name: 'Priya', type: 'Person' },
  { pattern: /\b(Vikram(?:\s+Mehta)?)\b/i, name: 'Vikram', type: 'Person' },
  { pattern: /\b(Ananya(?:\s+Roy)?)\b/i, name: 'Ananya', type: 'Person' },
  { pattern: /\b(Arjun(?:\s+Gupta)?)\b/i, name: 'Arjun', type: 'Person' },
  { pattern: /\b(Neha(?:\s+Deshmukh)?)\b/i, name: 'Neha', type: 'Person' },

  // Projects
  { pattern: /\b(Expense\s+Tracker)\b/i, name: 'Expense Tracker', type: 'Project' },
  { pattern: /\b(FitTrack)\b/i, name: 'FitTrack', type: 'Project' },
  { pattern: /\b(Portfolio\s+CMS)\b/i, name: 'Portfolio CMS', type: 'Project' },
  { pattern: /\b(Cognitive\s+Engine)\b/i, name: 'Cognitive Engine', type: 'Project' },
  { pattern: /\b(Workout\s+Logger)\b/i, name: 'Workout Logger', type: 'Project' },

  // Tools & Technologies
  { pattern: /\b(React(?:JS)?)\b/i, name: 'React', type: 'Tool' },
  { pattern: /\b(React\s+Native)\b/i, name: 'React Native', type: 'Tool' },
  { pattern: /\b(Node\.js)\b/i, name: 'Node.js', type: 'Tool' },
  { pattern: /\b(PostgreSQL|Postgres)\b/i, name: 'PostgreSQL', type: 'Tool' },
  { pattern: /\b(Postgres\s+Operator)\b/i, name: 'Postgres Operator', type: 'Tool' },
  { pattern: /\b(Drizzle(?:\s+ORM)?)\b/i, name: 'Drizzle ORM', type: 'Tool' },
  { pattern: /\b(Next\.js)\b/i, name: 'Next.js', type: 'Tool' },
  { pattern: /\b(TypeScript)\b/i, name: 'TypeScript', type: 'Tool' },
  { pattern: /\b(Tailwind(?:\s+CSS)?)\b/i, name: 'Tailwind CSS', type: 'Tool' },
  { pattern: /\b(FastAPI)\b/i, name: 'FastAPI', type: 'Tool' },
  { pattern: /\b(FastAPI\s+CLI)\b/i, name: 'FastAPI CLI', type: 'Tool' },
  { pattern: /\b(Redis)\b/i, name: 'Redis', type: 'Tool' },
  { pattern: /\b(Docker)\b/i, name: 'Docker', type: 'Tool' },
  { pattern: /\b(GraphQL)\b/i, name: 'GraphQL', type: 'Tool' },
  { pattern: /\b(WebSocket)\b/i, name: 'WebSocket', type: 'Tool' },

  // Organizations
  { pattern: /\b(Tech\s+Corp)\b/i, name: 'Tech Corp', type: 'Organization' },
  { pattern: /\b(University)\b/i, name: 'University', type: 'Organization' },
  { pattern: /\b(Google)\b/i, name: 'Google', type: 'Organization' },

  // Places
  { pattern: /\b(Bangalore)\b/i, name: 'Bangalore', type: 'Place' },
  { pattern: /\b(Mumbai)\b/i, name: 'Mumbai', type: 'Place' },
  { pattern: /\b(Himachal)\b/i, name: 'Himachal', type: 'Place' },
  { pattern: /\b(Kyoto)\b/i, name: 'Kyoto', type: 'Place' },

  // Topics
  { pattern: /\b(Vector\s+Search)\b/i, name: 'Vector Search', type: 'Topic' },
  { pattern: /\b(System\s+Design)\b/i, name: 'System Design', type: 'Topic' },
  { pattern: /\b(Distributed\s+Systems)\b/i, name: 'Distributed Systems', type: 'Topic' },
  { pattern: /\b(Quantitative\s+Aptitude)\b/i, name: 'Quantitative Aptitude', type: 'Topic' },
  { pattern: /\b(Machine\s+Learning)\b/i, name: 'Machine Learning', type: 'Topic' },

  // Goals
  { pattern: /\b(CAT\s+2026\s+Preparation)\b/i, name: 'CAT 2026 Preparation', type: 'Goal' },
  { pattern: /\b(Placement\s+Preparation)\b/i, name: 'Placement Preparation', type: 'Goal' },
  { pattern: /\b(Marathon\s+Training)\b/i, name: 'Marathon Training', type: 'Goal' },
];

/**
 * Deterministic Mock Extraction Provider (for fast tests and offline development)
 */
export class DeterministicMockExtractionProvider implements EntityExtractionProvider {
  readonly providerName = 'mock-deterministic';
  readonly modelName = 'mock-regex-extractor-v1';

  private customRules: { pattern: RegExp; name: string; type: string }[] = [];
  private staticResponses = new Map<string, ExtractedEntityMention[]>();

  constructor(customRules?: { pattern: RegExp; name: string; type: string }[]) {
    if (customRules) {
      this.customRules = customRules;
    }
  }

  setStaticResponse(text: string, entities: ExtractedEntityMention[]) {
    this.staticResponses.set(text.trim(), entities);
  }

  async extractEntities(
    text: string,
    _context?: {
      fragmentId?: string;
      userId?: string;
      capturedAt?: Date;
    }
  ): Promise<StructuredExtractionResult> {
    const startTime = Date.now();
    const cleanText = (text || '').trim();

    // Check if a static response was registered
    if (this.staticResponses.has(cleanText)) {
      const entities = this.staticResponses.get(cleanText)!;
      return {
        entities: ExtractionValidator.validate(entities, cleanText),
        metadata: {
          providerName: this.providerName,
          model: this.modelName,
          promptVersion: 'V1_Exhaustive_Mock',
          extractionRunId: `mock_run_${Math.random().toString(36).substring(2, 9)}`,
          latencyMs: Date.now() - startTime,
        },
      };
    }

    const candidateEntities: { name: string; type: string; confidence: 'HIGH' }[] = [];
    const rules = [...DEFAULT_MOCK_ENTITIES, ...this.customRules];

    for (const rule of rules) {
      const match = cleanText.match(rule.pattern);
      if (match && match[1]) {
        candidateEntities.push({
          name: match[1],
          type: rule.type,
          confidence: 'HIGH',
        });
      }
    }

    const validated = ExtractionValidator.validate({ entities: candidateEntities }, cleanText);

    return {
      entities: validated,
      metadata: {
        providerName: this.providerName,
        model: this.modelName,
        promptVersion: 'V1_Exhaustive_Mock',
        extractionRunId: `mock_run_${Math.random().toString(36).substring(2, 9)}`,
        latencyMs: Date.now() - startTime,
      },
    };
  }
}
