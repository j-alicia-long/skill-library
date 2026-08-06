---
name: skill-sync
description: Bidirectionally sync skills between the local skills directory and the shared skill-library repo — pull & merge changes down, or push new/updated skills up to GitHub. Use when the user asks to sync, pull, push, or export skills, or after adding or editing a skill locally. Always confirm with the user before pushing.
compatibility: Any platform
metadata:
  author: j-alicia-long
---
Keep the local skills directory and the shared [skill-library repo](https://github.com/j-alicia-long/skill-library) in sync, in [agentskills.io](https://agentskills.io) format. Sync runs in **both directions**:

- **pull** — pull the library repo and merge its skills *down* into the local skills directory.
- **push** — copy local skills *up* into the library and push to GitHub.

Both directions are **additive**: pull never deletes local-only files, and push never deletes library skills that don't exist locally. Removals must be done by hand.

The commands operate through a local git checkout of the library (`--library-dir`, default `personal-os/02-projects/skill-library`). The local skills directory (`--skills-dir`, default the platform's skills folder) is the working copy you edit.

## Check status first

```bash
bun run Skills/skill-sync/scripts/sync.ts status
```

Read-only. Shows exactly what a pull would bring down and what a push would send up, plus library-only skills. Run this first to understand the current divergence.

## Pull (library → local)

```bash
bun run Skills/skill-sync/scripts/sync.ts pull            # merge changes down
bun run Skills/skill-sync/scripts/sync.ts pull --dry-run  # preview only
```

Overlays library files onto local skills. Local-only files (e.g. platform display metadata) are kept, but a local edit to a skill that also changed upstream will be overwritten — so push unpushed local work first if unsure.

## Push (local → library → GitHub)

**Always confirm with the user before pushing.** The script enforces this: a plain `push` only stages and previews the diff; it will not commit or push without `--confirm`.

```bash
bun run Skills/skill-sync/scripts/sync.ts push            # preview the diff (safe)
bun run Skills/skill-sync/scripts/sync.ts push --confirm  # commit & push after user approves
```

Workflow: run `push` (or `status`) to show the pending changes, present them to the user, and only after they approve, re-run with `--confirm`. Done when the script prints the repo URL after a successful push.

`--help` lists all options.

## Check for upstream updates (downloaded skills)

Downloaded skills are tracked in `_config/upstreams.json` (upstream repo, path, and the content hashes as vendored). Compare against upstream:

```bash
bun run Skills/skill-sync/scripts/sync.ts check-upstream
```

Read-only — it never modifies skills. `status` also runs this check automatically. Report states:

- **UPSTREAM UPDATES** — upstream changed, local copy untouched. Review the compare link, apply the update manually, then re-pin: `check-upstream --accept <skill>` (and commit the manifest).
- **DIVERGED** — changed both locally and upstream; needs a manual merge before re-pinning.
- **LOCALLY MODIFIED** — local edits only; nothing to do.
- **UNTRACKED / NOT IN MANIFEST** — no checkable upstream, or missing a manifest entry.

**Always relay the full report text directly in chat** — never just summarize it or point at tool output the user can't see.

A weekly GitHub Action (`.github/workflows/check-upstream.yml`) runs the same check and maintains a single tracking issue ("Upstream skill updates available") in the library repo, closing it when everything is current.

## Install locally

When the user asks to set up skills on their machine, provide the commands from [`file INSTALL.md`](INSTALL.md) tailored to the tool(s) they mention.
