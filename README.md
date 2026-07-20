# Skill Library

Portable AI skills in [Agent Skills](https://agentskills.io) format, synced from [Zo Computer](https://jlong.zo.computer).

Last synced: 2026-07-20

## My Skills

#### Productivity & Utilities

- **product-comparator** — Find the best deal on a product across retailers. Use when the user wants to compare prices, find the cheapest option, or decide where to buy something. Searches multiple stores, normalizes prices per unit, checks seller reputation, and recommends the best option.
- **skill-sync** — Sync Zo skills to the skill-library repo in agentskills.io format. Use when the user asks to sync, push, or export skills, or to install them locally. Also after adding or editing a skill in Skills/.

## Downloaded Skills

#### Design & UI

- **animation-vocabulary** — Reverse-lookup glossary that turns a vague description of a web animation or motion effect into its exact term ("the bouncy thing when a popover opens" → Pop in; "the iOS rubber-band scroll" → Rubber-banding). Use when the user asks "what's it called when…", or describes a motion effect without knowing its name and wants the right word to prompt an AI or designer with. For naming an effect, not designing or building one.
- **apple-design** — Apple's approach to interface design and fluid, physical motion, translated for the web. Use when building or reviewing gesture-driven UI, spring animations, drag/swipe/sheet interactions, momentum and interruptible transitions, translucent materials and depth, typography (optical sizing, tracking, leading), reduced-motion, or the design foundations (feedback, spatial consistency, restraint) behind Apple-style interfaces.
- **emil-design-eng** — This skill encodes Emil Kowalski's philosophy on UI polish, component design, animation decisions, and the invisible details that make software feel great.
- **frontend-design** *(Anthropic)* — Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished code and UI design that avoids generic AI aesthetics.

#### Development Workflow

- **github** *(Clawdbot)* — Interact with GitHub using the `gh` CLI. Use `gh issue`, `gh pr`, `gh run`, and `gh api` for issues, PRs, CI runs, and advanced queries.
- **mcporter** *(Clawdbot)* — Work with MCP servers directly
- **setup-pre-commit** — Set up Husky pre-commit hooks with lint-staged (Prettier), type checking, and tests in the current repo. Use when user wants to add pre-commit hooks, set up Husky, configure lint-staged, or add commit-time formatting/typechecking/testing.
- **tdd** — Test-driven development. Use when the user wants to build features or fix bugs test-first, mentions "red-green-refactor", or wants integration tests.
- **webapp-testing** *(Anthropic)* — Toolkit for interacting with and testing local web applications using Playwright. Supports verifying frontend functionality, debugging UI behavior, capturing browser screenshots, and viewing browser logs.

#### Planning & Decision-Making

- **grill-me** *(mattpocock)* — A relentless interview to sharpen a plan or design. Use when user wants to stress-test a plan, get grilled on their design, or mentions "grill me".
- **grill-with-docs** — A relentless interview to sharpen a plan or design, which also creates docs (ADR's and glossary) as we go.
- **grilling** *(mattpocock)* — Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.
- **to-spec** — Turn the current conversation into a spec and publish it to the project issue tracker — no interview, just synthesis of what you've already discussed.
- **writing-great-skills** — Reference for writing and editing skills well — the vocabulary and principles that make a skill predictable.

#### Learning & Discovery

- **find-skills** — Helps users discover and install agent skills when they ask questions like "how do I do X", "find a skill for X", "is there a skill that can...", or express interest in extending capabilities. This skill should be used when the user is looking for functionality that might exist as an installable skill.
- **teach** — Teach the user a new skill or concept, within this workspace.

## Install

```bash
npx skills add j-alicia-long/skill-library
```
