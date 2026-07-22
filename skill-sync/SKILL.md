---
name: skill-sync
description: Sync the personal-os skill library — register all skills with GitHub Copilot and optionally push to the skill-library repo in agentskills.io format. Use when the user asks to sync, register, push, or export skills, or after adding or editing a skill in personal-os/skills/.
metadata:
  author: j-alicia-long
---
Sync skills from `personal-os/skills/` (the skill library): register each skill as a GitHub Copilot personal skill (`~/.copilot/skills/`), regenerate the library README, and optionally push to the [skill-library repo](https://github.com/j-alicia-long/skill-library) in [agentskills.io](https://agentskills.io) format.

## Sync

```bash
bun run personal-os/skills/skill-sync/scripts/sync.ts          # register + generate
bun run personal-os/skills/skill-sync/scripts/sync.ts --push   # also commit + push to GitHub
```

`--push` handles the whole publish: it clones the skill-library repo, copies the skills in, commits with a dated message, and pushes — no manual git steps. `--help` for all options (custom paths, `--no-register`, `--dry-run`). Done when the script exits 0 and prints the skill count. With `--push`, also confirm the repo URL appears. New Copilot sessions pick up registered skills automatically; existing sessions need a restart.

## How skills go live

`personal-os/skills/` is the library — the source of truth. Agents load skills from it indirectly, through one of two registrations:

- **User scope (all projects):** the sync's register step copies each skill into the Copilot app's skills dir (`~/Library/Application Support/com.github.githubapp/app-skills/`). These are copies, so re-run the sync after editing a skill.
- **Project scope:** a symlink in a project's `.claude/skills/` pointing into the library (e.g. `skill-sync -> ../../skills/skill-sync`). Symlinks pick up library edits immediately — no re-sync; editing through either path touches the same file.

## Adding a skill

Copy the skill folder (containing `SKILL.md`) into `personal-os/skills/<name>/`, add it to `GROUP_MAP` in `scripts/sync.ts`, then run the sync.

## Install locally

When the user asks to set up skills on their machine, provide the commands from [`file INSTALL.md`](INSTALL.md) tailored to the tool(s) they mention.
