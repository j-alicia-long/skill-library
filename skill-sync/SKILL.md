---
name: skill-sync
description: Sync the personal-os skill library — register all skills with the GitHub Copilot app and optionally push to the skill-library repo in agentskills.io format. Use when the user asks to sync, register, push, or export skills, or after adding or editing a skill in personal-os/skills/.
metadata:
  author: j-alicia-long
---
Sync skills from `personal-os/skills/` (the skill library): register each skill with the GitHub Copilot app (`~/Library/Application Support/com.github.githubapp/app-skills/`), regenerate the library README, and optionally push to the [skill-library repo](https://github.com/j-alicia-long/skill-library) in [agentskills.io](https://agentskills.io) format.

## Sync

```bash
bun run personal-os/skills/skill-sync/scripts/sync.ts          # register + generate
bun run personal-os/skills/skill-sync/scripts/sync.ts --push   # also push to GitHub
```

`--help` for all options (custom paths, `--no-register`, `--dry-run`). Done when the script exits 0 and prints the skill count. With `--push`, also confirm the repo URL appears. Newly registered skills may require a Copilot app restart to appear.

## Adding a skill

Copy the skill folder (containing `SKILL.md`) into `personal-os/skills/<name>/`, add it to `GROUP_MAP` in `scripts/sync.ts`, then run the sync.

## Install locally

When the user asks to set up skills on their machine, provide the commands from [`file INSTALL.md`](INSTALL.md) tailored to the tool(s) they mention.
