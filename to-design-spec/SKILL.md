---
name: to-design-spec
description: Interview the user one decision at a time, verify facts on the machine, and distill the result into a compact human-readable design spec with an architecture diagram.
disable-model-invocation: true
metadata:
  author: j-alicia-long
---

Produce a `spec.md` — a compact, human-readable design spec — by interviewing the user one decision at a time and verifying every factual claim before it enters the document. The spec is the *distillate*: only settled decisions, measured numbers, and the shape of the system. Rationale and rejected alternatives live in ADRs or session notes, not here.

## Interview

Ask **one question per turn**, using the ask-user tool. Each question targets the single most load-bearing open decision; the answer determines the next question. Continue until every section of the template below can be filled with a settled decision — no placeholders, no "TBD".

Rules of the interview:

- **Verify before you write.** When an answer rests on a factual claim about tools, files, data, or costs ("Copilot logs per-turn tokens", "the transcripts still exist"), check it on the actual machine or via research *before* recording the decision. A decision built on an unverified assumption is not settled.
- **Measure, don't estimate.** Sizing, retention, and cost numbers come from real data on the machine wherever possible (row counts, bytes per row, observed daily volume). Label each number with how it was measured and the date.
- **Push back with evidence.** When the user's preference conflicts with verified facts, present the evidence and let them re-decide. Record whichever way they rule — the user owns the decision, the facts own the premises.
- **Name the fuzzy terms.** When two concepts hide under one word (session vs. task, spend vs. consumption), split them explicitly and get the user to pick which one v1 commits to. The split goes in the glossary; the commitment goes in Scope.
- **Cut scope out loud.** When the user defers something, move it to "Deliberately out of scope" immediately and confirm — deferred work is a decision too.

## The spec

Write `spec.md` in the project folder. Target length: one screen to ~60 lines. Every line is a decision or a measurement; if a sentence explains *why*, move it to an ADR and link it.

Structure:

1. **Header** — title, one line naming the session/date it came from, and links to companion docs (glossary/CONTEXT, ADRs, research surveys) if they exist.
2. **Goal** — one or two sentences: what the system answers or does, from the user's point of view.
3. **Scope (v1)** — bulleted: sources/inputs, the atomic unit and core metric, and the concrete views/outputs. Each bullet is a commitment, not an option.
4. **Architecture** — a **visual architecture diagram** plus one bullet per component. Render the diagram as a fenced `mermaid` block (flowchart) showing real paths, tools, and stores as nodes and data movement as labeled edges — actual filenames and commands on the labels, not generic boxes. If the spec will live somewhere mermaid doesn't render, add an ASCII fallback beneath it. The bullets under the diagram carry the per-component decisions (versions pinned, privacy boundaries, what never crosses which line).
5. **Measured tables** — where sizing/retention/cost decisions were made, a small table of the real numbers behind them, with the measurement method and date inline. State caps and eviction order as hard rules in bold.
6. **Data sketch** — the store's tables/entities, one line each: name plus its columns/fields. A sketch, not DDL.
7. **Deliberately out of scope (v1 → future work)** — everything deferred during the interview, one line each with just enough context that future-you knows what it was.

Adapt section names to the domain (a spec with no storage component drops the measured tables), but keep the order: goal → scope → shape → numbers → data → not-doing.

## Done when

- Every template section is filled from settled interview decisions — nothing invented to fill a gap.
- Every number in the spec traces to a measurement or cited source, dated.
- The architecture diagram renders (check the mermaid syntax) and names real files, tools, and boundaries.
- The user has seen the draft and confirmed it matches what was decided.
