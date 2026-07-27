---
name: writing-great-agentsmd
description: Write, audit, or slim down AGENTS.md / CLAUDE.md files using progressive disclosure. Use when the user wants to create an AGENTS.md, refactor a bloated one, review agent instructions, or asks why their coding agent ignores or misreads project rules.
metadata:
  author: j-alicia-long
  source: https://www.aihero.dev/a-complete-guide-to-agents-md
---

# Writing Great AGENTS.md Files

An `AGENTS.md` sits just below the system prompt and is loaded on **every request**, relevant or not. The root virtue is **smallness**: every line spends instruction budget (frontier models follow ~150–200 instructions reliably; smaller models far fewer). The ideal root file is as small as possible and points elsewhere.

Based on [A Complete Guide to AGENTS.md](https://www.aihero.dev/a-complete-guide-to-agents-md) (aihero.dev, Matt Pocock).

## The root file: absolute minimum

Only these belong in the root `AGENTS.md`:

1. **One-sentence project description** — anchors every decision, like a role prompt. ("This is a React component library for accessible data visualization.")
2. **Package manager** — only if not the default (e.g. "This project uses pnpm workspaces.")
3. **Non-standard build/typecheck/test commands.**
4. Anything genuinely relevant to *every single task* in the repo.

Everything else goes behind progressive disclosure.

## Progressive disclosure

Give the agent only what it needs now; point to the rest with light, conversational references — no "ALWAYS", no all-caps forcing:

```markdown
For TypeScript conventions, see docs/TYPESCRIPT.md
```

- Domain-specific rules (TypeScript style, testing patterns, API design, Git workflow) each get their own file under `docs/`.
- Files may nest: `docs/TYPESCRIPT.md` can reference `docs/TESTING.md`. Agents navigate hierarchies well.
- External links (framework docs) are fine.
- Agent skills are another disclosure channel — a workflow the agent pulls in only when needed.

Placement test for any new instruction:

| Belongs in | When |
|---|---|
| Root `AGENTS.md` | Relevant to every single task |
| Separate `docs/*.md` | Relevant to one domain |
| Nested doc tree / skill | Hierarchical or workflow knowledge |
| Nowhere (delete) | Redundant, vague, or obvious |

## Anti-patterns to catch

- **Ball of mud**: rules accreted one incident at a time, never style-passed. Symptoms: contradictions, hundreds of lines, conflicting developer opinions.
- **Auto-generated files**: init scripts flood the file with "useful for most scenarios" content. Never auto-generate; restraint beats comprehensiveness.
- **Documented file structure**: paths go stale fast and stale docs *poison* context — the agent confidently looks in the wrong place. Describe capabilities and rough shape, not paths. Domain vocabulary ("organization" vs "workspace") is safer but still keep a light touch.
- **Obvious/vague rules**: "write clean code", "be careful" — pure token waste.

## Monorepos

Nested `AGENTS.md` files merge with the root. Split by scope, don't overload any level:

- **Root**: monorepo purpose, package navigation, shared tooling ("See each package's AGENTS.md for specific guidelines.")
- **Package**: package purpose, its tech stack, its conventions.

## Compatibility

Claude Code reads `CLAUDE.md`, not `AGENTS.md`. Symlink to keep tools in sync: `ln -s AGENTS.md CLAUDE.md`.

## Refactoring workflow

When auditing or slimming an existing file:

1. **Find contradictions** — list conflicting instructions and ask the user which version wins.
2. **Extract the essentials** — pull out only the root-worthy items (description, package manager, non-standard commands, truly-universal rules).
3. **Group the rest** — cluster remaining instructions into domains; one `docs/*.md` per domain.
4. **Create the structure** — minimal root with markdown links, the domain files, a proposed `docs/` layout.
5. **Flag for deletion** — redundant (agent already knows it), too vague to act on, or overly obvious.

When writing a new file from scratch: start with the one-liner and package manager only, and add rules *reactively* — but each time, run the placement test above before it lands in the root.
