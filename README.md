# Synced Skills

Last synced: 2026-07-18

## Skills included

- **animation-vocabulary** — Reverse-lookup glossary that turns a vague description of a web animation or motion effect into its exact term ("the bouncy thing when a popover opens" → Pop in; "the iOS rubber-band scroll" → Rubber-banding). Use when the user asks "what's it called when…", or describes a motion effect without knowing its name and wants the right word to prompt an AI or designer with. For naming an effect, not designing or building one.
- **apple-design** — Apple's approach to interface design and fluid, physical motion, translated for the web. Use when building or reviewing gesture-driven UI, spring animations, drag/swipe/sheet interactions, momentum and interruptible transitions, translucent materials and depth, typography (optical sizing, tracking, leading), reduced-motion, or the design foundations (feedback, spatial consistency, restraint) behind Apple-style interfaces.
- **emil-design-eng** — This skill encodes Emil Kowalski's philosophy on UI polish, component design, animation decisions, and the invisible details that make software feel great.
- **find-skills** — Helps users discover and install agent skills when they ask questions like "how do I do X", "find a skill for X", "is there a skill that can...", or express interest in extending capabilities. This skill should be used when the user is looking for functionality that might exist as an installable skill.
- **frontend-design** — Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished code and UI design that avoids generic AI aesthetics.
- **github** — Interact with GitHub using the `gh` CLI. Use `gh issue`, `gh pr`, `gh run`, and `gh api` for issues, PRs, CI runs, and advanced queries.
- **mcporter** — Work with MCP servers directly
- **product-comparator** — Find the best deal on a product across retailers. Use when the user wants to compare prices, find the cheapest option, or decide where to buy something. Searches multiple stores, normalizes prices per unit, checks seller reputation, and recommends the best option.
- **webapp-testing** — Toolkit for interacting with and testing local web applications using Playwright. Supports verifying frontend functionality, debugging UI behavior, capturing browser screenshots, and viewing browser logs.

## Setup by platform

### Claude Code

**Global** (available in all projects):
```bash
mkdir -p ~/.claude/commands
cp ~/personal-os/06-skills/claude-code/*.md ~/.claude/commands/
```

**Per-project** (available only in that project):
```bash
mkdir -p .claude/commands
cp ~/personal-os/06-skills/claude-code/*.md .claude/commands/
```

Then use `/skill-name` in Claude Code to invoke a skill.

### Cursor

Copy rules into your project:
```bash
mkdir -p .cursor/rules
cp ~/personal-os/06-skills/cursor/*.mdc .cursor/rules/
```

Cursor auto-discovers rules in `.cursor/rules/` and applies them when the description matches your task.

### GitHub Copilot

Copy into your project:
```bash
mkdir -p .github
cp ~/personal-os/06-skills/copilot/copilot-instructions.md .github/copilot-instructions.md
```

If you already have a `copilot-instructions.md`, append instead:
```bash
cat ~/personal-os/06-skills/copilot/copilot-instructions.md >> .github/copilot-instructions.md
```

### OpenAI Codex

Merge into your project's AGENTS.md:
```bash
cat ~/personal-os/06-skills/codex/AGENTS.md >> AGENTS.md
```

Or use it as a standalone file — Codex reads AGENTS.md from the project root.

## Keeping skills updated

Run the sync again on Zo whenever you add or change skills:
```
bun run Skills/skill-sync/scripts/sync.ts
```

Files sync to your Mac via the Zo Desktop App automatically.
