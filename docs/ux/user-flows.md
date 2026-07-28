# User Flows

> Key user journeys mapped step-by-step. Each flow corresponds to user stories in [user-stories.md](../product/user-stories.md).

---

## Flow 1: First-Time Onboarding

```
Landing Page → Sign Up → Welcome Screen → Guided Tour → First Capture → Dashboard
```

| Step | Screen | Actions | Notes |
|---|---|---|---|
| 1 | Landing page | Click "Get Started" | Social proof, value prop |
| 2 | Sign up | OAuth / magic link / email | Minimal friction |
| 3 | Welcome | Personalization (2-3 questions) | Optional, skippable |
| 4 | Guided tour | Interactive walkthrough | Highlight key features |
| 5 | First capture | Prompt-driven first thought | Reduce blank page anxiety |
| 6 | Dashboard | Arrive at home | Celebrate first entry |

---

## Flow 2: Quick Thought Capture

```
Any Screen → Keyboard Shortcut (⌘+K) → Quick Capture Modal → Type → Save → Return
```

| Step | Screen | Actions | Notes |
|---|---|---|---|
| 1 | Any | Press `⌘+K` / `Ctrl+K` | Global shortcut |
| 2 | Quick capture modal | Type thought | Auto-focus, minimal UI |
| 3 | Modal | Optional: add tags | Tag suggestions |
| 4 | Modal | Press `Enter` or click Save | Instant save |
| 5 | Previous screen | Toast confirmation | Non-blocking |

**Target**: Capture complete in **< 5 seconds**.

---

## Flow 3: Explore Connections

```
Dashboard → Entry Detail → Related Thoughts Panel → Click Connection → Knowledge Graph View
```

| Step | Screen | Actions | Notes |
|---|---|---|---|
| 1 | Dashboard | Click an entry | Entry cards with preview |
| 2 | Entry detail | View full entry | AI-generated related thoughts in sidebar |
| 3 | Related panel | Click a connection | Smooth transition |
| 4 | Connected entry | View linked thought | Breadcrumb navigation |
| 5 | Optional | Switch to graph view | Visual knowledge graph |

---

## Flow 4: Semantic Search

```
Dashboard → Search Bar → Type Query → See Results → Click Result → Entry Detail
```

| Step | Screen | Actions | Notes |
|---|---|---|---|
| 1 | Dashboard | Click search or press `/` | Focus search bar |
| 2 | Search | Type natural language query | Real-time suggestions |
| 3 | Results | Review semantic matches | Relevance scores, highlights |
| 4 | Results | Click a result | Navigate to entry |

---

## Flow 5: Daily Cognitive Digest

```
Notification → Open App → Digest View → Review Insights → Act on Suggestion → Dashboard
```

| Step | Screen | Actions | Notes |
|---|---|---|---|
| 1 | Push / email | "Your daily cognitive digest is ready" | Morning delivery |
| 2 | Digest | Review themed summary | AI-curated themes |
| 3 | Digest | See pattern alerts | "You've been thinking about X a lot" |
| 4 | Digest | Click to explore deeper | Navigate to related entries |

---

## Error States

| Scenario | User Sees | Recovery |
|---|---|---|
| Network offline | "Saved locally — will sync when online" | Auto-sync on reconnect |
| Save failure | "Couldn't save — retrying..." | Auto-retry with manual option |
| Search no results | "No matches found. Try different words?" | Suggested alternatives |
| Session expired | "Welcome back — please sign in" | Redirect to auth |

---

> _User flows will be validated through usability testing. Wireframes for each flow will be added to [wireframes/](wireframes/)._
