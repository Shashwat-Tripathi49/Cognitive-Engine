# AI Evaluation Framework

> How we measure, benchmark, and ensure quality of AI features.

---

## Evaluation Principles

1. **No AI feature ships without metrics** — Every feature has defined quality criteria
2. **Automated regression testing** — Prompt changes are tested against golden datasets
3. **Human evaluation** — Automated metrics are complemented by human judgment
4. **Continuous monitoring** — Production quality is tracked over time

---

## Quality Metrics

### Semantic Search

| Metric        | Description                          | Target  |
| ------------- | ------------------------------------ | ------- |
| Precision@5   | % of top-5 results that are relevant | > 80%   |
| Recall@10     | % of relevant results in top-10      | > 70%   |
| MRR           | Mean Reciprocal Rank                 | > 0.7   |
| Latency (P95) | 95th percentile response time        | < 500ms |

### Connection Detection

| Metric               | Description                                    | Target |
| -------------------- | ---------------------------------------------- | ------ |
| Precision            | % of suggested connections that are meaningful | > 75%  |
| User acceptance rate | % of connections users engage with             | > 30%  |
| False positive rate  | % of irrelevant connections shown              | < 15%  |

### Digest Quality

| Metric          | Description                         | Target |
| --------------- | ----------------------------------- | ------ |
| Relevance score | Human-rated relevance (1-5)         | > 4.0  |
| Engagement rate | % of users who read full digest     | > 50%  |
| Actionability   | % of digests leading to user action | > 20%  |

---

## Evaluation Process

```
1. Define test cases (golden dataset)
2. Run prompt against test cases
3. Compute automated metrics
4. Human evaluation (sample)
5. Compare against baseline
6. Ship or iterate
```

---

## Golden Datasets

| Dataset              | Size              | Purpose                       |
| -------------------- | ----------------- | ----------------------------- |
| `search_eval_v1`     | 200 queries       | Semantic search quality       |
| `connection_eval_v1` | 100 entry pairs   | Connection detection accuracy |
| `digest_eval_v1`     | 50 weekly samples | Digest quality                |

> Datasets will be created during Phase 2 development.

---

> _Evaluation is a living process. Metrics and targets will be refined based on real user data._
