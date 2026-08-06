# Upstream Skill Update Checker — Design

**Date:** 2026-08-06
**Status:** Approved

## Problem

Most skills in this library were downloaded from other sources (Anthropic, mattpocock, Clawdbot, etc.) but nothing tracks their upstream origin, so there is no way to know when an upstream skill has been updated. Only 3 skills record a `source:` URL in frontmatter; the skills-CLI lockfile (`~/.agents/.skill-lock.json`) tracks just one skill.

## Solution overview

A **sources manifest** (`_config/upstreams.json`) records each downloaded skill's upstream repo, path, and vendored content hashes. A **checker command** (`sync.ts check-upstream`) compares upstream vs. vendored vs. local via the GitHub API (no cloning). Two triggers:

1. **Weekly GitHub Action** that maintains a single tracking issue when updates exist.
2. **Inline check** whenever `skill-sync status` runs, with the report always echoed in full in chat.

Applying updates stays manual — the checker never overwrites files.

## Manifest — `_config/upstreams.json`

One entry per downloaded skill:

```json
{
  "grill-me": {
    "repo": "mattpocock/skills",
    "path": "skills/planning/grill-me",
    "vendoredCommit": "<upstream commit sha last pulled from>",
    "files": { "SKILL.md": "<git blob sha as vendored>" }
  },
  "writing-great-agentsmd": { "untracked": "source is a blog post, no repo" }
}
```

- `files` holds git **blob SHAs** (same hash GitHub's tree API returns), enabling three-way comparison without downloading file contents.
- `untracked` entries are skipped by the checker and listed once in reports.

### Three-way comparison states

| upstream vs vendored | local vs vendored | state |
|---|---|---|
| same | same | up to date |
| different | same | **upstream updated** |
| same | different | **locally modified** (informational) |
| different | different | **diverged** (manual merge) |

## Checker — `sync.ts check-upstream`

1. Read manifest; group tracked skills by upstream repo.
2. One API call per repo: `GET /repos/{owner}/{repo}/git/trees/HEAD?recursive=1` (via `gh api` when available for higher rate limits, plain fetch otherwise).
3. Compute local blob SHAs (`git hash-object` semantics) and compare three ways.
4. Print report to stdout: sections for UPSTREAM UPDATES (with compare-view diff links), LOCALLY MODIFIED, DIVERGED, UNTRACKED, plus "not in manifest" drift warnings.
5. Exit code: non-zero-ish signal (documented flag/output) for the Action to detect "updates found".

`check-upstream --accept <skill>` re-pins `vendoredCommit` and blob SHAs to current upstream after the user has manually pulled a change.

### Error handling

- 404 / unknown repo → "check manually" in report.
- Rate limited / offline → warn and skip, never fail the whole run.
- Skill in library but missing from manifest → listed so drift is visible.

## GitHub Action — `.github/workflows/check-upstream.yml`

- Schedule: weekly (Monday morning) + `workflow_dispatch`.
- Steps: checkout → setup bun → run `check-upstream`.
- Updates found → create/update a **single tracking issue** ("Upstream skill updates available"); body = report with diff links (`/compare/<vendoredCommit>...HEAD`). Body is overwritten each run; issue closed when everything is current.
- Auth: built-in `GITHUB_TOKEN`, no secrets.

## skill-sync integration

- `sync.ts status` also runs the upstream check and appends the section to its report; degrades gracefully offline.
- `skill-sync/SKILL.md` documents `check-upstream` and mandates: **reports are always relayed in full in chat**, never summarized away.

## Backfill

Research the true upstream repo + path for every downloaded skill and populate the manifest. Skills with no findable repo upstream (blog-post sources, local forks like `grill-with-docs`) are marked `untracked`.

## Testing

Run `check-upstream` against the real backfilled manifest; verify all three states by temporarily perturbing a vendored hash.
