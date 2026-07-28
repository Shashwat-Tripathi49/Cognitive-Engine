# Code Review Process

> How we review code to maintain quality and share knowledge.

---

## Review Goals

1. **Correctness** — Does the code do what it's supposed to?
2. **Quality** — Does it follow our standards?
3. **Knowledge sharing** — Does the team understand the change?
4. **Mentorship** — Do juniors learn from the process?

---

## Review Checklist

### Functional

- [ ] Does it solve the stated problem?
- [ ] Are edge cases handled?
- [ ] Are error states handled gracefully?
- [ ] Does it work with existing features?

### Code Quality

- [ ] Follows coding standards?
- [ ] No `any` types?
- [ ] No `console.log` in production code?
- [ ] Functions are reasonably sized (< 50 lines)?
- [ ] File is reasonably sized (< 300 lines)?
- [ ] Comments explain _why_, not _what_?

### Testing

- [ ] Appropriate tests added?
- [ ] Tests cover happy path + error cases?
- [ ] No flaky tests introduced?

### Security

- [ ] No secrets or credentials in code?
- [ ] User input validated and sanitized?
- [ ] No SQL injection vulnerabilities?
- [ ] Authentication/authorization checked?

### Performance

- [ ] No unnecessary re-renders (React)?
- [ ] No N+1 query patterns?
- [ ] No blocking operations on hot paths?

---

## Review Etiquette

### For Authors

- Keep PRs small (< 400 lines changed)
- Write a clear description
- Self-review before requesting review
- Respond to all comments

### For Reviewers

- Review within 24 hours
- Be specific and constructive
- Suggest solutions, not just problems
- Approve when "good enough" — don't block on style nitpicks
- Use conventional comment prefixes:

| Prefix        | Meaning                        |
| ------------- | ------------------------------ |
| `nit:`        | Style nitpick, non-blocking    |
| `suggestion:` | Take it or leave it            |
| `question:`   | Genuine question, not a demand |
| `issue:`      | Must be addressed before merge |
| `praise:`     | Something done well            |

---

## SLA

| Action               | Target          |
| -------------------- | --------------- |
| First review comment | Within 24 hours |
| Follow-up review     | Within 12 hours |
| Author response      | Within 24 hours |

---

> _Code review is a collaborative process, not a gatekeeping exercise. We review code, not people._
