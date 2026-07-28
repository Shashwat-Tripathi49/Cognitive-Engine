# AI Ethics Guidelines

> Responsible AI practices for Cognitive Engine.

---

## Core Commitments

### 1. Privacy Above All

Thoughts are the most intimate form of data. We commit to:

- **Minimal data transmission** — Process locally when possible
- **No data monetization** — User data is never sold or used for advertising
- **Encryption** — End-to-end encryption for all thought data
- **Right to delete** — Complete data erasure on request
- **Transparency** — Users always know what data is sent to AI models

### 2. No Manipulation

The AI should **augment** thinking, never **direct** it:

- No persuasion patterns in AI responses
- No engagement-maximizing dark patterns
- No emotional manipulation
- Insights are presented as observations, not directives

### 3. Bias Awareness

- Acknowledge that LLMs carry inherent biases
- Document known bias vectors in our prompts
- Include diverse perspectives in evaluation datasets
- Regular bias audits on AI outputs

### 4. User Agency

- Users can disable any AI feature
- Users can see why a connection/insight was suggested
- Users can correct or dismiss AI suggestions
- The app is fully functional without AI features

---

## Data Handling

| Principle          | Implementation                                        |
| ------------------ | ----------------------------------------------------- |
| Data minimization  | Send only necessary context to models                 |
| Purpose limitation | AI processes data only for stated features            |
| Storage limitation | AI-generated data has defined retention periods       |
| Consent            | Users explicitly opt into AI features                 |
| Auditability       | All AI interactions are logged (for the user, not us) |

---

## Transparency Requirements

For every AI-generated insight, users should be able to understand:

1. **What** — What the AI concluded
2. **Why** — What evidence/entries led to this conclusion
3. **Confidence** — How confident the AI is
4. **Source** — Which entries were used as input

---

## Red Lines

Things Cognitive Engine's AI will **never** do:

- ❌ Diagnose mental health conditions
- ❌ Provide medical, legal, or financial advice
- ❌ Share user data with third parties for training
- ❌ Make autonomous decisions on behalf of users
- ❌ Generate content that could cause harm
- ❌ Create psychological profiles for external use

---

> _These guidelines are non-negotiable. Any feature that conflicts with these principles must be redesigned or rejected._
