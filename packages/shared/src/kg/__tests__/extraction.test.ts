import { describe, it, expect } from 'vitest';
import { ExtractionValidator } from '../extraction/validator.js';
import { DeterministicMockExtractionProvider } from '../extraction/mock-provider.js';

describe('Phase KG-02 — Entity Extraction Adapter & Validation', () => {
  it('should parse valid structured entity extraction JSON', () => {
    const rawPayload = JSON.stringify({
      entities: [
        { name: 'Rahul', type: 'Person', confidence: 'HIGH' },
        { name: 'Expense Tracker', type: 'Project', confidence: 'HIGH' },
        { name: 'React', type: 'Tool', confidence: 'HIGH' },
      ],
    });

    const validated = ExtractionValidator.validate(
      rawPayload,
      'Worked with Rahul on Expense Tracker using React today.'
    );

    expect(validated).toHaveLength(3);
    expect(validated[0]).toEqual({
      name: 'Rahul',
      type: 'Person',
      confidence: 'HIGH',
      startOffset: 12,
      endOffset: 17,
    });
    expect(validated[1]).toEqual({
      name: 'Expense Tracker',
      type: 'Project',
      confidence: 'HIGH',
      startOffset: 21,
      endOffset: 36,
    });
    expect(validated[2]).toEqual({
      name: 'React',
      type: 'Tool',
      confidence: 'HIGH',
      startOffset: 43,
      endOffset: 48,
    });
  });

  it('should strictly reject disqualified ontology types (Emotion, Task, Habit, Document, Insight)', () => {
    const rawPayload = {
      entities: [
        { name: 'Frustrated', type: 'Emotion' },
        { name: 'Fix bug #42', type: 'Task' },
        { name: 'Daily 5km run', type: 'Habit' },
        { name: 'resume.pdf', type: 'Document' },
        { name: 'Need better work-life balance', type: 'Insight' },
        { name: 'FitTrack', type: 'Project' },
      ],
    };

    const validated = ExtractionValidator.validate(rawPayload);

    expect(validated).toHaveLength(1);
    expect(validated[0].name).toBe('FitTrack');
    expect(validated[0].type).toBe('Project');
  });

  it('should safely handle malformed JSON strings without throwing unhandled exceptions', () => {
    expect(() => ExtractionValidator.validate('NOT_JSON')).toThrow();

    const emptyValid = ExtractionValidator.validate({});
    expect(emptyValid).toEqual([]);

    const nullValid = ExtractionValidator.validate(null);
    expect(nullValid).toEqual([]);
  });

  it('should deduplicate repeated entities within the same extraction', () => {
    const rawPayload = {
      entities: [
        { name: 'PostgreSQL', type: 'Tool' },
        { name: 'postgresql', type: 'Tool' },
        { name: 'PostgreSQL', type: 'Tool' },
      ],
    };

    const validated = ExtractionValidator.validate(rawPayload);
    expect(validated).toHaveLength(1);
    expect(validated[0].name).toBe('PostgreSQL');
  });

  it('should extract entities deterministically using DeterministicMockExtractionProvider', async () => {
    const provider = new DeterministicMockExtractionProvider();
    const text = 'Met Rahul in Bangalore to discuss the Expense Tracker built with Drizzle ORM and PostgreSQL.';

    const result = await provider.extractEntities(text);

    expect(result.entities.length).toBeGreaterThanOrEqual(4);
    const names = result.entities.map((e) => e.name);
    expect(names).toContain('Rahul');
    expect(names).toContain('Bangalore');
    expect(names).toContain('Expense Tracker');
    expect(names).toContain('Drizzle ORM');
    expect(result.metadata.model).toBe('mock-regex-extractor-v1');
    expect(result.metadata.extractionRunId).toBeDefined();
  });
});
