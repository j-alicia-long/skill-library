# Skill Library

Portable AI skills in [Agent Skills](https://agentskills.io) format.

Last synced: 2026-07-22

## My Skills

#### Planning & Decision-Making

- **[to-design-spec](to-design-spec/SKILL.md)** — Interview the user one decision at a time, verify facts on the machine, and distill the result into a compact human-readable design spec with an architecture diagram.

#### Productivity & Utilities

- **[product-comparator](product-comparator/SKILL.md)** — Find the best deal on a product across retailers. Use when the user wants to compare prices, find the cheapest option, or decide where to buy something. Searches multiple stores, normalizes prices per unit, checks seller reputation, and recommends the best option.
- **[skill-sync](skill-sync/SKILL.md)** — Sync the personal-os skill library — register all skills with GitHub Copilot and optionally push to the skill-library repo in agentskills.io format. Use when the user asks to sync, register, push, or export skills, or after adding or editing a skill in personal-os/skills/.

## Downloaded Skills

#### Design & UI

- **[animation-vocabulary](animation-vocabulary/SKILL.md)** — Reverse-lookup glossary that turns a vague description of a web animation or motion effect into its exact term ("the bouncy thing when a popover opens" → Pop in; "the iOS rubber-band scroll" → Rubber-banding). Use when the user asks "what's it called when…", or describes a motion effect without knowing its name and wants the right word to prompt an AI or designer with. For naming an effect, not designing or building one.
- **[apple-design](apple-design/SKILL.md)** — Apple's approach to interface design and fluid, physical motion, translated for the web. Use when building or reviewing gesture-driven UI, spring animations, drag/swipe/sheet interactions, momentum and interruptible transitions, translucent materials and depth, typography (optical sizing, tracking, leading), reduced-motion, or the design foundations (feedback, spatial consistency, restraint) behind Apple-style interfaces.
- **[emil-design-eng](emil-design-eng/SKILL.md)** — This skill encodes Emil Kowalski's philosophy on UI polish, component design, animation decisions, and the invisible details that make software feel great.
- **[frontend-design](frontend-design/SKILL.md)** *(Anthropic)* — Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished code and UI design that avoids generic AI aesthetics.
- **[visual-design-rules](visual-design-rules/SKILL.md)** — Safe-default visual design rules (color, layout, spacing, depth, typography) for building or reviewing any UI. Use when styling web components or pages, choosing colors, spacing, shadows, or type, or auditing a design that looks "off" and needs a concrete rule-based diagnosis.

#### Development Workflow

- **[github](github/SKILL.md)** *(Clawdbot)* — Interact with GitHub using the `gh` CLI. Use `gh issue`, `gh pr`, `gh run`, and `gh api` for issues, PRs, CI runs, and advanced queries.
- **[mcporter](mcporter/SKILL.md)** *(Clawdbot)* — Work with MCP servers directly
- **[setup-pre-commit](setup-pre-commit/SKILL.md)** — Set up Husky pre-commit hooks with lint-staged (Prettier), type checking, and tests in the current repo. Use when user wants to add pre-commit hooks, set up Husky, configure lint-staged, or add commit-time formatting/typechecking/testing.
- **[tdd](tdd/SKILL.md)** — Test-driven development. Use when the user wants to build features or fix bugs test-first, mentions "red-green-refactor", or wants integration tests.
- **[webapp-testing](webapp-testing/SKILL.md)** *(Anthropic)* — Toolkit for interacting with and testing local web applications using Playwright. Supports verifying frontend functionality, debugging UI behavior, capturing browser screenshots, and viewing browser logs.

#### Planning & Decision-Making

- **[grill-me](grill-me/SKILL.md)** *(mattpocock)* — A relentless interview to sharpen a plan or design. Use when user wants to stress-test a plan, get grilled on their design, or mentions "grill me".
- **[grill-with-docs](grill-with-docs/SKILL.md)** — A relentless interview to sharpen a plan or design, which also creates docs (ADR's and glossary) as we go.
- **[grilling](grilling/SKILL.md)** *(mattpocock)* — Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.
- **[to-spec](to-spec/SKILL.md)** — Turn the current conversation into a spec and publish it to the project issue tracker — no interview, just synthesis of what you've already discussed.
- **[to-tickets](to-tickets/SKILL.md)** *(mattpocock)* — Break a plan, spec, or the current conversation into a set of tracer-bullet tickets, each declaring its blocking edges, published to the configured tracker — edges as text in one file per ticket locally, or native blocking links on a real tracker.
- **[writing-great-skills](writing-great-skills/SKILL.md)** — Reference for writing and editing skills well — the vocabulary and principles that make a skill predictable.

#### Learning & Discovery

- **[find-skills](find-skills/SKILL.md)** — Helps users discover and install agent skills when they ask questions like "how do I do X", "find a skill for X", "is there a skill that can...", or express interest in extending capabilities. This skill should be used when the user is looking for functionality that might exist as an installable skill.
- **[teach](teach/SKILL.md)** — Teach the user a new skill or concept, within this workspace.

#### Productivity & Utilities

- **[archive-conversation](archive-conversation/SKILL.md)** *(nweii)* — "Create analytical archival summaries of AI conversations, capturing intellectual journeys, key insights, and technical logs. Use when archiving, saving, or documenting a chat session."

## Install

```bash
npx skills add j-alicia-long/skill-library
```
