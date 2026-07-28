# Prompt Engineering

> Guidelines, templates, and versioning strategy for all AI prompts used in Cognitive Engine.

---

## Principles

1. **Deterministic by default** — Use low temperature for factual tasks, higher for creative
2. **Structured outputs** — Always request JSON or structured responses
3. **Versioned** — Every prompt has a version number; changes are tracked
4. **Tested** — Prompts are evaluated against test cases before deployment
5. **Minimal** — Send only the context the model needs; reduce token waste

---

## Prompt Template Standard

```typescript
interface PromptTemplate {
  id: string; // e.g., "cognitive.connection.detect.v2"
  version: string; // semantic versioning
  model: string; // target model
  temperature: number; // 0.0 - 1.0
  maxTokens: number;
  systemPrompt: string;
  userPromptTemplate: string; // with {{variables}}
  outputSchema: object; // expected response structure
}
```

---

## Naming Convention

```
{domain}.{action}.{variant}.v{version}

Examples:
- cognitive.embed.standard.v1
- cognitive.connect.detect.v2
- cognitive.digest.daily.v1
- cognitive.bias.analyze.v1
```

---

## Prompt Categories

### Connection Detection

```
ID: cognitive.connect.detect.v1
Purpose: Identify semantic connections between thoughts
Input: Current entry + candidate entries
Output: Connections with confidence scores and explanations
```

### Daily Digest

```
ID: cognitive.digest.daily.v1
Purpose: Summarize themes and patterns from recent entries
Input: Last 7 days of entries
Output: Themed summary with key insights
```

### Bias Detection

```
ID: cognitive.bias.analyze.v1
Purpose: Identify cognitive biases in thinking patterns
Input: Collection of entries around a topic
Output: Identified biases with evidence and gentle coaching
```

### Entry Summarization

```
ID: cognitive.summary.entry.v1
Purpose: Create concise summary of a long entry
Input: Full entry text
Output: 1-2 sentence summary
```

---

## Prompt Versioning Strategy

| Action           | Process                                      |
| ---------------- | -------------------------------------------- |
| New prompt       | Create with v1, add test cases               |
| Modify prompt    | Increment version, A/B test against previous |
| Deprecate prompt | Mark deprecated, set sunset date             |
| Rollback         | Revert to previous version in config         |

---

## Safety Guidelines

- Never include PII in system prompts
- Never log full prompt + response in production
- Always validate AI outputs before presenting to users
- Implement output sanitization (strip potential injections)
- Rate limit AI-powered features per user

---

> _Specific prompt templates will be added as AI features are implemented in Phase 2._
