import json
import os

DATASET = [
    # Theme: Work / Expense Tracker (Ground truth: work, project:expense_tracker)
    {
        "id": "entry_001",
        "date": "2026-03-01",
        "text": "Met Rahul at the cafe to map out the transaction synchronization flow for the personal finance tool. We decided to prioritize ledger reconciliations over auto-categorization.",
        "ground_truth_themes": ["work", "project:expense_tracker", "person:rahul"],
        "sentiment": "neutral"
    },
    {
        "id": "entry_002",
        "date": "2026-03-02",
        "text": "Spent four hours chasing a subtle race condition in the ledger state manager. Turned out to be an unhandled promise rejection in the batch writer.",
        "ground_truth_themes": ["work", "project:expense_tracker"],
        "sentiment": "frustrated"
    },
    {
        "id": "entry_003",
        "date": "2026-03-03",
        "text": "Priya delivered the initial dark-mode UI mockups for the budgeting dashboard. The color palette looks crisp and modern.",
        "ground_truth_themes": ["work", "project:expense_tracker", "person:priya"],
        "sentiment": "positive"
    },
    {
        "id": "entry_004",
        "date": "2026-03-05",
        "text": "Reviewed the database migration strategy for financial records. We need strict ACID compliance and audit logging for every user mutation.",
        "ground_truth_themes": ["work", "project:expense_tracker"],
        "sentiment": "neutral"
    },
    {
        "id": "entry_005",
        "date": "2026-03-08",
        "text": "Quick sync with Rahul on backend API authorization. We agreed to freeze Clerk as the primary auth provider for multi-tenant isolation.",
        "ground_truth_themes": ["work", "project:expense_tracker", "person:rahul"],
        "sentiment": "positive"
    },
    {
        "id": "entry_006",
        "date": "2026-03-10",
        "text": "Pushed the initial version of the transaction parsing engine. Bank statement CSV imports are working smoothly now.",
        "ground_truth_themes": ["work", "project:expense_tracker"],
        "sentiment": "positive"
    },
    {
        "id": "entry_007",
        "date": "2026-03-12",
        "text": "Debugging memory leaks in the Node.js server during heavy payload ingestion. Turns out event listeners weren't being cleaned up.",
        "ground_truth_themes": ["work", "project:expense_tracker"],
        "sentiment": "frustrated"
    },
    {
        "id": "entry_008",
        "date": "2026-03-15",
        "text": "Rahul suggested adding automatic receipt scanning later, but I insisted we keep the MVP focused solely on core ledger reliability.",
        "ground_truth_themes": ["work", "project:expense_tracker", "person:rahul"],
        "sentiment": "neutral"
    },
    {
        "id": "entry_009",
        "date": "2026-03-18",
        "text": "Priya updated the component library with accessible contrast ratios. The user flows feel significantly smoother.",
        "ground_truth_themes": ["work", "project:expense_tracker", "person:priya"],
        "sentiment": "positive"
    },
    {
        "id": "entry_010",
        "date": "2026-03-22",
        "text": "Completed the integration test suite for accounting entries. 100% of test cases passed in CI.",
        "ground_truth_themes": ["work", "project:expense_tracker"],
        "sentiment": "positive"
    },

    # Theme: Fitness & Health (Ground truth: fitness, health)
    {
        "id": "entry_011",
        "date": "2026-03-01",
        "text": "Pushed through a crisp 5km morning run along the lake. Pace was steady at 5:15/km despite the cool breeze.",
        "ground_truth_themes": ["fitness", "health"],
        "sentiment": "positive"
    },
    {
        "id": "entry_012",
        "date": "2026-03-04",
        "text": "Heavy leg day at the gym. Squats felt solid but my lower back is feeling slightly fatigued.",
        "ground_truth_themes": ["fitness", "health"],
        "sentiment": "neutral"
    },
    {
        "id": "entry_013",
        "date": "2026-03-07",
        "text": "Suffered from a throbbing tension headache all afternoon. Likely due to poor posture and staring at code for 8 hours without breaks.",
        "ground_truth_themes": ["health"],
        "sentiment": "negative"
    },
    {
        "id": "entry_014",
        "date": "2026-03-09",
        "text": "Early morning yoga session helped relieve tight shoulders. Slept a full 8 hours last night and energy levels are high.",
        "ground_truth_themes": ["fitness", "health"],
        "sentiment": "positive"
    },
    {
        "id": "entry_015",
        "date": "2026-03-11",
        "text": "Ran 10km in the rain. Feet got soaked but the runner's high was completely worth it.",
        "ground_truth_themes": ["fitness", "health"],
        "sentiment": "positive"
    },
    {
        "id": "entry_016",
        "date": "2026-03-14",
        "text": "Feeling under the weather with a sore throat and mild fever. Resting all day and drinking hot chamomile tea.",
        "ground_truth_themes": ["health"],
        "sentiment": "negative"
    },
    {
        "id": "entry_017",
        "date": "2026-03-17",
        "text": "Back to full recovery! Completed 45 minutes of zone-2 cardio on the stationary bike.",
        "ground_truth_themes": ["fitness", "health"],
        "sentiment": "positive"
    },
    {
        "id": "entry_018",
        "date": "2026-03-20",
        "text": "Tried high-protein meal prepping for the week ahead. Grilled chicken, quinoa, and roasted broccoli.",
        "ground_truth_themes": ["health"],
        "sentiment": "neutral"
    },

    # Theme: Personal & Family (Ground truth: family, personal)
    {
        "id": "entry_019",
        "date": "2026-03-06",
        "text": "Called mom for her birthday. We talked about her garden and planning a family dinner next weekend.",
        "ground_truth_themes": ["family", "personal"],
        "sentiment": "positive"
    },
    {
        "id": "entry_020",
        "date": "2026-03-13",
        "text": "Drove down to my parents' house for Sunday lunch. Dad made his famous homemade curry.",
        "ground_truth_themes": ["family", "personal"],
        "sentiment": "positive"
    },
    {
        "id": "entry_021",
        "date": "2026-03-21",
        "text": "Helped my sister move into her new apartment. Spending hours carrying heavy furniture up three flights of stairs.",
        "ground_truth_themes": ["family", "personal"],
        "sentiment": "neutral"
    },
    {
        "id": "entry_022",
        "date": "2026-03-27",
        "text": "Quiet family dinner catching up on old childhood memories. It is rare we all get to sit together like this.",
        "ground_truth_themes": ["family", "personal"],
        "sentiment": "positive"
    },

    # Theme: Travel & Outings (Ground truth: travel, leisure)
    {
        "id": "entry_023",
        "date": "2026-03-25",
        "text": "Boarded an early morning flight to Bangalore for a weekend getaway. Looking forward to exploring tech cafes and local coffee culture.",
        "ground_truth_themes": ["travel", "leisure"],
        "sentiment": "positive"
    },
    {
        "id": "entry_024",
        "date": "2026-03-26",
        "text": "Visited a botanical garden in Bangalore. The quiet walking trails were a welcome escape from urban noise.",
        "ground_truth_themes": ["travel", "leisure"],
        "sentiment": "positive"
    },
    {
        "id": "entry_025",
        "date": "2026-03-28",
        "text": "Returned home from Bangalore trip. Flight was delayed two hours but overall a refreshing weekend break.",
        "ground_truth_themes": ["travel", "leisure"],
        "sentiment": "neutral"
    },

    # Theme: Learning & Research (Ground truth: learning, tech)
    {
        "id": "entry_026",
        "date": "2026-03-02",
        "text": "Read the HDBSCAN paper on density-based hierarchical clustering. Fascinating how it handles varying cluster densities better than standard DBSCAN.",
        "ground_truth_themes": ["learning", "tech"],
        "sentiment": "neutral"
    },
    {
        "id": "entry_027",
        "date": "2026-03-16",
        "text": "Experimented with Rust memory safety model and ownership borrow checker. Concepts are rigorous but compile error messages are remarkably helpful.",
        "ground_truth_themes": ["learning", "tech"],
        "sentiment": "positive"
    },
    {
        "id": "entry_028",
        "date": "2026-03-24",
        "text": "Studied vector indexing structures: HNSW vs IVFFlat. HNSW provides faster query recall at the cost of higher RAM usage.",
        "ground_truth_themes": ["learning", "tech"],
        "sentiment": "neutral"
    },

    # Theme: Emotions & Reflection (Ground truth: emotions, reflection)
    {
        "id": "entry_029",
        "date": "2026-03-19",
        "text": "Feeling overwhelmed by the sheer number of competing priorities this week. Need to slow down, write down my thoughts, and declutter my mind.",
        "ground_truth_themes": ["emotions", "stress"],
        "sentiment": "negative"
    },
    {
        "id": "entry_030",
        "date": "2026-03-29",
        "text": "Felt a strong sense of clarity tonight. Realized that steady incremental progress beats intense bursts of unsustainable effort every time.",
        "ground_truth_themes": ["emotions", "reflection"],
        "sentiment": "positive"
    }
]

# Expand dataset deterministically to 100 entries using realistic variations
VARIATIONS = [
    ("Met Rahul to review quarterly tech goals and refactoring priorities.", ["work", "project:expense_tracker", "person:rahul"], "neutral"),
    ("Priya suggested simplifying the navigation drawer for mobile screens.", ["work", "project:expense_tracker", "person:priya"], "positive"),
    ("Ran 8km under sunrise. Cold morning air felt revitalizing.", ["fitness", "health"], "positive"),
    ("Spent evening cooking pasta with family.", ["family", "personal"], "positive"),
    ("Struggled with sleep insomnia. Tossed and turned until 3 AM.", ["health", "emotions"], "negative"),
    ("Deep dive into graph Louvain community detection algorithms.", ["learning", "tech"], "neutral"),
    ("Rahul and I debugged WebSocket connection drops in production.", ["work", "project:expense_tracker", "person:rahul"], "frustrated"),
    ("Priya finalized icon set for financial metrics dashboard.", ["work", "project:expense_tracker", "person:priya"], "positive"),
    ("Weekend road trip to hills with old college friends.", ["travel", "leisure"], "positive"),
    ("Felt burnt out after continuous 14-hour workdays. Time to set boundaries.", ["emotions", "stress"], "negative"),
    ("Completed 10km marathon training run. Legs felt strong.", ["fitness", "health"], "positive"),
    ("Family dinner at restaurant celebrating dad's retirement.", ["family", "personal"], "positive"),
    ("Investigated Postgres pgvector index build times for 100k vectors.", ["learning", "tech"], "neutral"),
    ("Rahul reviewed my pull request for data validation schemas.", ["work", "project:expense_tracker", "person:rahul"], "positive"),
    ("Rainy afternoon. Spent hours reading a book on cognitive science.", ["routine", "leisure"], "neutral"),
    ("Priya proposed redesigning landing page typography.", ["work", "project:expense_tracker", "person:priya"], "neutral"),
    ("High stress day due to unexpected server downtime.", ["emotions", "stress"], "negative"),
    ("Gym session: deadlifts and core conditioning.", ["fitness", "health"], "positive"),
    ("Visited weekend farmers market for organic produce.", ["health", "routine"], "positive"),
    ("Explored transformer attention mechanism paper.", ["learning", "tech"], "neutral"),
    ("Rahul and Priya presented sprint achievements during team demo.", ["work", "project:expense_tracker", "person:rahul", "person:priya"], "positive"),
    ("Quiet Sunday morning drinking coffee on the balcony.", ["routine", "reflection"], "positive"),
    ("Struggling to focus on coding tasks due to noise.", ["emotions", "stress"], "negative"),
    ("Pushed bugfix for timezone offset handling in financial records.", ["work", "project:expense_tracker"], "positive"),
    ("Went for a 6km trail run in the woods.", ["fitness", "health"], "positive"),
    ("Family movie night watching classic sci-fi.", ["family", "personal"], "positive"),
    ("Researched deterministic vs stochastic LLM sampling.", ["learning", "tech"], "neutral"),
    ("Rahul initiated code review on security compliance.", ["work", "project:expense_tracker", "person:rahul"], "neutral"),
    ("Suffered mild back pain from bad chair ergonomics.", ["health"], "negative"),
    ("Priya created sleek dark mode theme variables.", ["work", "project:expense_tracker", "person:priya"], "positive"),
    ("Short flight for client meeting in Mumbai.", ["travel", "work"], "neutral"),
    ("Feeling grateful for supportive colleagues and family.", ["emotions", "reflection"], "positive"),
    ("Completed 5km morning jog.", ["fitness", "health"], "positive"),
    ("Cooked dinner for friends at home.", ["personal", "leisure"], "positive"),
    ("Analyzed database query execution plans using EXPLAIN ANALYZE.", ["learning", "tech"], "neutral")
]

idx = 31
for i in range(70):
    var_text, var_themes, var_sent = VARIATIONS[i % len(VARIATIONS)]
    day = (i % 28) + 1
    month = 4 if i < 35 else 5
    DATASET.append({
        "id": f"entry_{idx:03d}",
        "date": f"2026-0{month}-{day:02d}",
        "text": f"{var_text} [Ref #{idx}]",
        "ground_truth_themes": var_themes,
        "sentiment": var_sent
    })
    idx += 1

out_dir = os.path.join(os.path.dirname(__file__), "dataset")
os.makedirs(out_dir, exist_ok=True)
out_file = os.path.join(out_dir, "synthetic_journal_entries.json")

with open(out_file, "w", encoding="utf-8") as f:
    json.dump(DATASET, f, indent=2)

print(f"Generated {len(DATASET)} synthetic journal entries at {out_file}")
