---
name: skill-sync
description: Sync Zo skills to the skill-library repo in agentskills.io format. Use when the user asks to sync, push, or export skills, or to install them locally. Also after adding or editing a skill in Skills/.
compatibility: Created for Zo Computer
metadata:
  author: jlong.zo.computer
---
Sync skills from `Skills/` and `.agents/skills/` (locally installed) to `personal-os/skills/` in [agentskills.io](https://agentskills.io) format, optionally pushing to the [skill-library repo](https://github.com/j-alicia-long/skill-library). `Skills/` takes precedence when both contain the same skill.

## Sync

```bash
bun run Skills/skill-sync/scripts/sync.ts          # generate only
bun run Skills/skill-sync/scripts/sync.ts --push    # generate + push
```

`--help` for all options. Done when the script exits 0 and prints the file count. With `--push`, also confirm the repo URL appears.

## Install locally

When the user asks to set up skills on their machine, provide the commands from [`file INSTALL.md`](INSTALL.md) tailored to the tool(s) they mention.