import {
  ReflectionInputBundle,
  LLMReflectionResponse,
  ReflectionValidationResult,
  ValidationGateResult,
  GroundedProposition,
} from './types.js';

// Number words to digits mapping for quantitative checking
const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
};

export class ReflectionValidator {
  /**
   * Evaluates all 5 validation gates deterministically.
   */
  validate(bundle: ReflectionInputBundle, response: LLMReflectionResponse): ReflectionValidationResult {
    const gates: ValidationGateResult[] = [];

    // Gate G1: Exact Fact-Tuple Validation
    const g1 = this.validateGateG1(bundle, response.propositions);
    gates.push(g1);
    if (!g1.passed) {
      return { passed: false, gates, failureReason: g1.error, auditTimestamp: new Date() };
    }

    // Gate G2: Typed Quantitative Grounding
    const g2 = this.validateGateG2(bundle, response.reflectionText);
    gates.push(g2);
    if (!g2.passed) {
      return { passed: false, gates, failureReason: g2.error, auditTimestamp: new Date() };
    }

    // Gate G3: Anti-Causal & Sequence Integrity
    const g3 = this.validateGateG3(response.reflectionText);
    gates.push(g3);
    if (!g3.passed) {
      return { passed: false, gates, failureReason: g3.error, auditTimestamp: new Date() };
    }

    // Gate G4: Anti-Psychological & Anti-Coaching Audit
    const g4 = this.validateGateG4(response.reflectionText);
    gates.push(g4);
    if (!g4.passed) {
      return { passed: false, gates, failureReason: g4.error, auditTimestamp: new Date() };
    }

    // Gate G5: Segment-to-Realization Frame Verification
    const g5 = this.validateGateG5(bundle, response);
    gates.push(g5);
    if (!g5.passed) {
      return { passed: false, gates, failureReason: g5.error, auditTimestamp: new Date() };
    }

    return {
      passed: true,
      gates,
      auditTimestamp: new Date(),
    };
  }

  /**
   * Gate G1: Exact Fact-Tuple Validation
   */
  private validateGateG1(
    bundle: ReflectionInputBundle,
    propositions: readonly GroundedProposition[]
  ): ValidationGateResult {
    if (!propositions || propositions.length === 0) {
      return { gate: 'G1', passed: false, error: 'Propositions array cannot be empty' };
    }

    const { entities, relationships, temporalSpan, metrics } = bundle.authorizedFacts;

    const factMap = new Map<string, { type: string; fact: unknown }>();
    entities.forEach((e) => factMap.set(e.factId, { type: 'ENTITY', fact: e }));
    relationships.forEach((r) => factMap.set(r.factId, { type: 'RELATIONSHIP', fact: r }));
    factMap.set(temporalSpan.factId, { type: 'TEMPORAL_SPAN', fact: temporalSpan });
    metrics.forEach((m) => factMap.set(m.factId, { type: 'METRIC', fact: m }));

    for (const prop of propositions) {
      const entry = factMap.get(prop.authorizedFactId);
      if (!entry) {
        return {
          gate: 'G1',
          passed: false,
          error: `Proposition '${prop.propositionId}' references non-existent authorizedFactId '${prop.authorizedFactId}'`,
        };
      }

      const { type, fact } = entry;

      if (type === 'ENTITY') {
        const ent = fact as typeof entities[0];
        if (prop.subject !== ent.canonicalName) {
          return {
            gate: 'G1',
            passed: false,
            error: `Proposition subject '${prop.subject}' does not match authorized entity canonicalName '${ent.canonicalName}'`,
          };
        }
        if (
          prop.predicate !== 'MENTIONED_IN_ENTRIES' &&
          prop.predicate !== 'OBSERVED_IN_WINDOW' &&
          prop.predicate !== 'CHRONOLOGICALLY_FOLLOWED_BY'
        ) {
          return {
            gate: 'G1',
            passed: false,
            error: `Predicate '${prop.predicate}' not permitted for entity fact '${prop.authorizedFactId}'`,
          };
        }
      } else if (type === 'RELATIONSHIP') {
        const rel = fact as typeof relationships[0];

        // Directionality check
        if (prop.subject !== rel.sourceEntityName || prop.object !== rel.targetEntityName) {
          // Check if symmetric co-occurrence allows reversed order
          if (rel.relationType === 'MENTIONED_WITH') {
            const matchesSymmetric =
              (prop.subject === rel.sourceEntityName && prop.object === rel.targetEntityName) ||
              (prop.subject === rel.targetEntityName && prop.object === rel.sourceEntityName);
            if (!matchesSymmetric) {
              return {
                gate: 'G1',
                passed: false,
                error: `Proposition tuple ('${prop.subject}', '${prop.object}') does not match authorized relationship ('${rel.sourceEntityName}', '${rel.targetEntityName}')`,
              };
            }
          } else {
            return {
              gate: 'G1',
              passed: false,
              error: `Directionality mismatch: expected subject '${rel.sourceEntityName}', object '${rel.targetEntityName}'`,
            };
          }
        }

        // Predicate check
        if (rel.relationType === 'MENTIONED_WITH') {
          if (prop.predicate !== 'CO_OCCURS_WITH') {
            return {
              gate: 'G1',
              passed: false,
              error: `MENTIONED_WITH relationships must strictly use predicate 'CO_OCCURS_WITH', found '${prop.predicate}'`,
            };
          }
        } else {
          if (prop.predicate !== rel.relationType) {
            return {
              gate: 'G1',
              passed: false,
              error: `Relationship fact requires predicate '${rel.relationType}', found '${prop.predicate}'`,
            };
          }
        }
      } else if (type === 'TEMPORAL_SPAN') {
        if (
          prop.predicate !== 'OBSERVED_IN_WINDOW' &&
          prop.predicate !== 'CHRONOLOGICALLY_FOLLOWED_BY' &&
          prop.predicate !== 'HAS_PAIRWISE_COHESION'
        ) {
          return {
            gate: 'G1',
            passed: false,
            error: `Invalid predicate '${prop.predicate}' for temporal span fact`,
          };
        }
      } else if (type === 'METRIC') {
        const m = fact as typeof metrics[0];
        if (m.metricType === 'COUNT') {
          if (prop.predicate !== 'MENTIONED_IN_ENTRIES') {
            return {
              gate: 'G1',
              passed: false,
              error: `Count metric requires predicate 'MENTIONED_IN_ENTRIES', found '${prop.predicate}'`,
            };
          }
          if (prop.object !== m.value.toString()) {
            return {
              gate: 'G1',
              passed: false,
              error: `Count mismatch: expected '${m.value}', found '${prop.object}'`,
            };
          }
        } else if (m.metricType === 'COHESION_SCORE') {
          if (prop.predicate !== 'HAS_PAIRWISE_COHESION') {
            return {
              gate: 'G1',
              passed: false,
              error: `Cohesion metric requires predicate 'HAS_PAIRWISE_COHESION'`,
            };
          }
        } else if (m.metricType === 'SEQUENCE_INTERVAL') {
          if (prop.predicate !== 'HAS_SEQUENCE_INTERVAL') {
            return {
              gate: 'G1',
              passed: false,
              error: `Sequence interval metric requires predicate 'HAS_SEQUENCE_INTERVAL'`,
            };
          }
        }
      }
    }

    return { gate: 'G1', passed: true };
  }

  /**
   * Gate G2: Typed Quantitative Grounding
   */
  private validateGateG2(bundle: ReflectionInputBundle, text: string): ValidationGateResult {
    // Forbidden check: raw percentages like "95%"
    if (text.includes('%')) {
      return {
        gate: 'G2',
        passed: false,
        error: 'Exposing raw percentage or probability score in reflection prose is strictly forbidden',
      };
    }

    // Forbidden check: raw probabilities or scores
    if (/\b0\.\d+\s*(support|confidence|score|probability)\b/i.test(text)) {
      return {
        gate: 'G2',
        passed: false,
        error: 'Exposing raw percentage or probability score in reflection prose is strictly forbidden',
      };
    }

    const { temporalSpan, metrics } = bundle.authorizedFacts;

    // Collect all valid integer counts
    const validCounts = new Set<number>();
    metrics.forEach((m) => {
      if (m.metricType === 'COUNT') validCounts.add(m.value);
    });

    // Valid duration days
    const validDurations = new Set<number>([
      temporalSpan.durationDays,
      temporalSpan.durationDays - 1,
      temporalSpan.durationDays + 1,
    ]);

    // Valid calendar date tokens
    const startDate = new Date(temporalSpan.startDate);
    const endDate = new Date(temporalSpan.endDate);
    const validDateNumbers = new Set<number>([
      startDate.getUTCDate(),
      endDate.getUTCDate(),
      startDate.getUTCFullYear(),
      endDate.getUTCFullYear(),
      startDate.getUTCMonth() + 1,
      endDate.getUTCMonth() + 1,
    ]);

    // Extract all numeric words and digit numbers
    const words = text.toLowerCase().match(/\b[a-z0-9.]+\b/g) || [];

    for (const w of words) {
      let numVal: number | null = null;
      if (/^\d+$/.test(w)) {
        numVal = parseInt(w, 10);
      } else if (/^\d+\.\d+$/.test(w)) {
        // Decimal number (e.g. cohesion score)
        const dec = parseFloat(w);
        const cohesionMetric = metrics.find((m) => m.metricType === 'COHESION_SCORE');
        if (cohesionMetric && Math.abs(dec - cohesionMetric.value) <= 0.005) {
          continue; // Valid cohesion score
        }
        return {
          gate: 'G2',
          passed: false,
          error: `Unverified decimal number '${w}' found in reflection text`,
        };
      } else if (NUMBER_WORDS[w] !== undefined) {
        numVal = NUMBER_WORDS[w];
      }

      if (numVal !== null) {
        const isCount = validCounts.has(numVal);
        const isDuration = validDurations.has(numVal);
        const isDatePart = validDateNumbers.has(numVal);

        if (!isCount && !isDuration && !isDatePart) {
          return {
            gate: 'G2',
            passed: false,
            error: `Unauthorized quantitative number '${w}' (${numVal}) not found in evidence metrics or date bounds`,
          };
        }
      }
    }

    return { gate: 'G2', passed: true };
  }

  /**
   * Gate G3: Anti-Causal Audit
   */
  private validateGateG3(text: string): ValidationGateResult {
    const causalRegex =
      /\b(caused by|causes?|caused|because of|led to|responsible for|resulted in|resulting in|triggered by|due to|forced|enabled)\b/i;

    const match = text.match(causalRegex);
    if (match) {
      return {
        gate: 'G3',
        passed: false,
        error: `Banned causal marker '${match[0]}' detected in reflection text`,
      };
    }

    return { gate: 'G3', passed: true };
  }

  /**
   * Gate G4: Anti-Psychological & Anti-Coaching Audit
   */
  private validateGateG4(text: string): ValidationGateResult {
    const emotionalRegex =
      /\b(felt|feeling|anxious|stressed|stress|frustrated|happy|burned out|burnout|motivation|exhaustion|imposter syndrome|passion|struggling|struggles?|concern|worried|fear|work-life balance|overwhelmed)\b/i;

    const coachingRegex =
      /\b(should|recommend|recommendation|try to|need to|ought to|advise|advice|suggestion)\b/i;

    let match = text.match(emotionalRegex);
    if (match) {
      return {
        gate: 'G4',
        passed: false,
        error: `Banned psychological/emotional marker '${match[0]}' detected in reflection text`,
      };
    }

    match = text.match(coachingRegex);
    if (match) {
      return {
        gate: 'G4',
        passed: false,
        error: `Banned advisory/coaching marker '${match[0]}' detected in reflection text`,
      };
    }

    return { gate: 'G4', passed: true };
  }

  /**
   * Gate G5: Segment-to-Realization Frame Verification
   */
  private validateGateG5(
    bundle: ReflectionInputBundle,
    response: LLMReflectionResponse
  ): ValidationGateResult {
    const { reflectionText, segments, propositions } = response;

    if (!segments || segments.length === 0) {
      return { gate: 'G5', passed: false, error: 'Segments array cannot be empty' };
    }

    // Step 1: Concatenation Invariant
    const expectedText = segments.map((s) => s.text.trim()).join(' ');
    const normalizedActual = reflectionText.replace(/\s+/g, ' ').trim();
    const normalizedExpected = expectedText.replace(/\s+/g, ' ').trim();

    if (normalizedActual !== normalizedExpected) {
      return {
        gate: 'G5',
        passed: false,
        error: `reflectionText does not strictly match concatenation of segments`,
      };
    }

    // Map propositionId -> GroundedProposition
    const propMap = new Map<string, GroundedProposition>();
    propositions.forEach((p) => propMap.set(p.propositionId, p));

    // Step 2: Check all segments reference valid propositions
    const referencedPropIds = new Set<string>();
    for (const seg of segments) {
      if (!seg.groundedPropositionIds || seg.groundedPropositionIds.length === 0) {
        return {
          gate: 'G5',
          passed: false,
          error: `Segment '${seg.segmentId}' does not reference any proposition IDs`,
        };
      }
      for (const pId of seg.groundedPropositionIds) {
        if (!propMap.has(pId)) {
          return {
            gate: 'G5',
            passed: false,
            error: `Segment '${seg.segmentId}' references non-existent proposition '${pId}'`,
          };
        }
        referencedPropIds.add(pId);
      }
    }

    // Step 3: Full Proposition Coverage (no orphaned propositions)
    for (const prop of propositions) {
      if (!referencedPropIds.has(prop.propositionId)) {
        return {
          gate: 'G5',
          passed: false,
          error: `Proposition '${prop.propositionId}' is orphaned (never referenced by any segment)`,
        };
      }
    }

    // Step 4: Dictionary Entity Extraction and Licensing
    const entityDict = this.buildEntityDictionary(bundle);

    for (const seg of segments) {
      const extractedEntities = this.extractEntitiesFromText(seg.text, entityDict);

      // Collect licensed entities from referenced propositions
      const licensedEntities = new Set<string>();
      for (const pId of seg.groundedPropositionIds) {
        const p = propMap.get(pId)!;
        licensedEntities.add(p.subject.toLowerCase());
        if (p.object) {
          licensedEntities.add(p.object.toLowerCase());
        }
      }

      // Assert all extracted entities in this segment are licensed
      for (const ent of extractedEntities) {
        if (!licensedEntities.has(ent.toLowerCase())) {
          return {
            gate: 'G5',
            passed: false,
            error: `Segment '${seg.segmentId}' mentions entity '${ent}' which is not licensed by referenced propositions`,
          };
        }
      }

      // Step 5: Realization Frame Verification per referenced predicate
      for (const pId of seg.groundedPropositionIds) {
        const p = propMap.get(pId)!;
        const frameCheck = this.verifySegmentRealizationFrame(seg.text, p.predicate);
        if (!frameCheck.passed) {
          return {
            gate: 'G5',
            passed: false,
            error: `Segment '${seg.segmentId}' failed realization frame check for predicate '${p.predicate}': ${frameCheck.error}`,
          };
        }
      }
    }

    return { gate: 'G5', passed: true };
  }

  /**
   * Realization frame grammar and banned vocabulary verification
   */
  private verifySegmentRealizationFrame(
    segmentText: string,
    predicate: GroundedProposition['predicate']
  ): { passed: boolean; error?: string } {
    if (predicate === 'CO_OCCURS_WITH') {
      // CoOccurrenceFrame must not use unauthorized action verbs
      const bannedActionVerbs =
        /\b(solved|solving|fixes?|fixing|broke|breaking|helped|collaborated|collaborating|built|building|designed|designing|managed|managing|struggled|depended)\b/i;
      const match = segmentText.match(bannedActionVerbs);
      if (match) {
        return {
          passed: false,
          error: `Unauthorized action verb '${match[0]}' used in CO_OCCURS_WITH realization`,
        };
      }
    } else if (predicate === 'WORKED_ON') {
      const bannedRoleVerbs = /\b(managed|managing|led|leading|directed|supervised|supervising)\b/i;
      const match = segmentText.match(bannedRoleVerbs);
      if (match) {
        return {
          passed: false,
          error: `Unauthorized role verb '${match[0]}' used in WORKED_ON realization`,
        };
      }
    } else if (predicate === 'HAS_PAIRWISE_COHESION') {
      // ClusterCohesionFrame must not misrepresent cohesion as confidence or probability
      if (/\b(confidence|probability|accuracy|truth)\b/i.test(segmentText)) {
        return {
          passed: false,
          error: `Pairwise cosine cohesion cannot be described as confidence or probability`,
        };
      }
    } else if (predicate === 'CHRONOLOGICALLY_FOLLOWED_BY') {
      // SequenceFrame must not introduce causal verbs
      const causalVerbs = /\b(caused|led to|resulted in|triggered|enabled|because)\b/i;
      const match = segmentText.match(causalVerbs);
      if (match) {
        return {
          passed: false,
          error: `Causal verb '${match[0]}' used in temporal sequence realization`,
        };
      }
    }

    return { passed: true };
  }

  /**
   * Builds an authorized entity dictionary for exact word-boundary matching
   */
  private buildEntityDictionary(bundle: ReflectionInputBundle): string[] {
    const dict: string[] = [];
    bundle.authorizedFacts.entities.forEach((e) => {
      dict.push(e.canonicalName);
      if (e.aliases) {
        dict.push(...e.aliases);
      }
    });

    // Sort by length descending for longest-match matching
    return dict.sort((a, b) => b.length - a.length);
  }

  /**
   * Deterministic dictionary matching with word boundaries
   */
  private extractEntitiesFromText(text: string, dict: string[]): string[] {
    const matched: string[] = [];
    for (const item of dict) {
      // Escape special characters in item
      const escaped = item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(text)) {
        matched.push(item);
      }
    }
    return matched;
  }
}
