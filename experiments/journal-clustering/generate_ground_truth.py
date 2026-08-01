"""
Canonical Ground Truth Generator -- Zero-Inference Audit Edition (v2.0)
File: synthetic_journal_entities_ground_truth.json
Target Dataset: synthetic_journal_entries.json (100 entries)

STRICT ANNOTATION RULES (Workstream 1):
1. ZERO INFERENCE: An entity may ONLY be annotated if its exact canonical name or an explicitly documented alias appears as a literal text span in the entry.
2. NO CONTEXTUAL INFERENCE: Generic terms like "accounting entries", "financial records", "ledger reconciliations", "data interpretation" MUST NOT trigger Project or Goal annotations unless the project/goal name is explicitly stated.
3. NO GENERIC ROLE NOUNS: "mom", "dad", "my manager", "colleagues", "the project" are strictly excluded.
"""

import json
import os
import re

DATASET_PATH = os.path.join(os.path.dirname(__file__), 'dataset/synthetic_journal_entries.json')
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), 'dataset/synthetic_journal_entities_ground_truth.json')

def annotate_dataset_strict():
    with open(DATASET_PATH, 'r', encoding='utf-8') as f:
        dataset = json.load(f)

    ground_truth = []
    total_entities_count = 0

    for entry in dataset:
        text = entry["text"]
        text_lower = text.lower()
        entities = []

        # Helper to avoid overlapping or duplicate annotations on same span
        added_spans = set()

        def add_entity(canonical_name, entity_type, exact_span, aliases=None):
            span_key = (exact_span.lower(), entity_type.lower())
            if span_key in added_spans:
                return
            added_spans.add(span_key)
            ent_obj = {
                "name": canonical_name,
                "type": entity_type,
                "text_span": exact_span,
                "canonical": canonical_name
            }
            if aliases:
                ent_obj["aliases"] = aliases
            entities.append(ent_obj)

        # 1. Person Entities (Proper names only)
        persons = ["Rahul", "Priya", "Amit", "Sneha", "Karan", "Neha", "Rohan", "Ananya"]
        for p in persons:
            m = re.search(r'\b' + re.escape(p) + r'\b', text, re.IGNORECASE)
            if m:
                add_entity(p, "Person", m.group(0))

        # 2. Project Entities (Strict explicit naming or explicit project title aliases)
        # ONLY trigger if text explicitly names "Expense Tracker" or documented title aliases "personal finance tool", "budgeting dashboard"
        if re.search(r'\bexpense tracker\b', text_lower):
            m = re.search(r'\bexpense tracker\b', text, re.IGNORECASE)
            add_entity("Expense Tracker", "Project", m.group(0), ["personal finance tool", "budgeting dashboard"])
        elif re.search(r'\bpersonal finance tool\b', text_lower):
            m = re.search(r'\bpersonal finance tool\b', text, re.IGNORECASE)
            add_entity("Expense Tracker", "Project", m.group(0), ["personal finance tool", "budgeting dashboard"])
        elif re.search(r'\bbudgeting dashboard\b', text_lower):
            m = re.search(r'\bbudgeting dashboard\b', text, re.IGNORECASE)
            add_entity("Expense Tracker", "Project", m.group(0), ["personal finance tool", "budgeting dashboard"])

        # 3. Goal Entities (Explicit exam/marathon targets only)
        if re.search(r'\bcat 2026\b', text_lower):
            m = re.search(r'\bcat 2026\b', text, re.IGNORECASE)
            add_entity("CAT 2026", "Goal", m.group(0), ["cat prep"])
        elif re.search(r'\bcat prep\b', text_lower):
            m = re.search(r'\bcat prep\b', text, re.IGNORECASE)
            add_entity("CAT 2026", "Goal", m.group(0), ["cat prep"])

        if re.search(r'\b10km marathon\b', text_lower) or re.search(r'\bmarathon training\b', text_lower):
            m = re.search(r'\b(10km marathon|marathon training)\b', text, re.IGNORECASE)
            if m:
                add_entity("Marathon Training", "Goal", m.group(0))

        # 4. Organization Entities
        if re.search(r'\bclerk\b', text_lower):
            m = re.search(r'\bclerk\b', text, re.IGNORECASE)
            add_entity("Clerk", "Organization", m.group(0))

        # 5. Place Entities
        places = ["Bangalore", "Mumbai", "Himachal"]
        for pl in places:
            m = re.search(r'\b' + re.escape(pl) + r'\b', text, re.IGNORECASE)
            if m:
                add_entity(pl, "Place", m.group(0))

        # 6. Tool / Technology Entities (Software products, DBs, frameworks, specific algorithms)
        tools_list = [
            ("react", "Tool", "React"),
            ("node.js", "Tool", "Node.js"),
            ("postgres", "Tool", "PostgreSQL"),
            ("pgvector", "Tool", "pgvector"),
            ("drizzle", "Tool", "Drizzle ORM"),
            ("hono", "Tool", "Hono"),
            ("hdbscan", "Tool", "HDBSCAN"),
            ("dbscan", "Tool", "DBSCAN"),
            ("rust", "Tool", "Rust"),
            ("websocket", "Tool", "WebSocket"),
            ("csv", "Tool", "CSV"),
        ]
        for term, t_type, canonical in tools_list:
            m = re.search(r'\b' + re.escape(term) + r'\b', text_lower)
            if m:
                # Get original text casing for text_span
                m_orig = re.search(r'\b' + re.escape(term) + r'\b', text, re.IGNORECASE)
                span = m_orig.group(0) if m_orig else term
                add_entity(canonical, t_type, span)

        # 7. Topic Entities (Conceptual subject areas/disciplines)
        topics_list = [
            ("density-based hierarchical clustering", "Topic", "Hierarchical Clustering"),
            ("vector indexing", "Topic", "Vector Indexing"),
            ("hnsw", "Topic", "HNSW Indexing"),
            ("ivfflat", "Topic", "IVFFlat Indexing"),
            ("louvain community detection", "Topic", "Community Detection"),
            ("transformer attention mechanism", "Topic", "Transformer Attention"),
            ("cognitive science", "Topic", "Cognitive Science"),
            ("acid compliance", "Topic", "ACID Compliance"),
            ("explain analyze", "Topic", "Database Query Optimization"),
            ("race condition", "Topic", "Race Condition"),
        ]
        for term, t_type, canonical in topics_list:
            if term in text_lower:
                m_orig = re.search(r'\b' + re.escape(term) + r'\b', text, re.IGNORECASE)
                span = m_orig.group(0) if m_orig else term
                add_entity(canonical, t_type, span)

        category = "clean"
        if any(p in text_lower for p in [" he ", " she ", " they ", " him ", " her ", " someone "]):
            category = "pronoun_heavy"
        elif any(w in text_lower for w in ["maybe", "might", "seems", "somewhat", "perhaps"]):
            category = "ambiguous"
        elif any(w in text_lower for w in ["the tool", "the team", "the project", "the feature"]):
            category = "indirect"

        total_entities_count += len(entities)
        ground_truth.append({
            "id": entry["id"],
            "date": entry.get("date", ""),
            "text": text,
            "category": category,
            "entities": entities
        })

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(ground_truth, f, indent=2)

    print(f"Strict Zero-Inference Ground Truth generated at: {OUTPUT_PATH}")
    print(f"Total Entries: {len(ground_truth)}")
    print(f"Total Ground-Truth Entities Annotated: {total_entities_count}")
    return ground_truth

if __name__ == "__main__":
    annotate_dataset_strict()
