import { cp, exists, mkdir, readdir, readFile, rm, writeFile } from "fs/promises";
import { join } from "path";
import { parseArgs } from "util";

const REPO = "j-alicia-long/skill-library";
const DEFAULT_SKILLS_DIR = "/home/workspace/Skills";
const DEFAULT_LIBRARY_DIR = "/home/workspace/personal-os/02-projects/skill-library";

// Additional local sources scanned when pushing (locally installed skills).
const LOCAL_SOURCE_DIRS = [
  "/home/workspace/.agents/skills",
  "/home/workspace/.claude/skills",
];

// Never copied into either side.
const EXCLUDE = new Set(["node_modules", ".git", "agents"]);
// Files that live at the library root but are not skills.
const NON_SKILL_ENTRIES = new Set(["README.md", ".git", ".github"]);

const { values: args, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    "skills-dir": { type: "string", default: DEFAULT_SKILLS_DIR },
    "library-dir": { type: "string", default: DEFAULT_LIBRARY_DIR },
    confirm: { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
    accept: { type: "string" },
    help: { type: "boolean", default: false },
  },
});

const cmd = positionals[0];
const VALID = ["status", "pull", "push", "check-upstream"];

if (args.help || !cmd || !VALID.includes(cmd)) {
  console.log(`Usage: bun run sync.ts <command> [options]

Bidirectional sync between the local skills directory and the shared library repo.

Commands:
  status          Show what pull and push would change (read-only, no writes).
                  Also checks upstream sources for updates (skipped if offline).
  pull            Pull the library repo and merge its skills into the local skills directory.
                  Additive overlay: new/updated skills are copied down; local-only files are kept.
  push            Copy local skills into the library and push to GitHub.
                  Additive upsert: never deletes library skills that are absent locally.
                  Requires --confirm to actually commit & push (otherwise previews the diff).
  check-upstream  Compare downloaded skills against their upstream repos
                  (_config/upstreams.json). Read-only; never modifies skills.
                  Use --accept <skill> to re-pin a skill after manually pulling an update.

Options:
  --skills-dir <path>    Local skills directory (default: ${DEFAULT_SKILLS_DIR})
  --library-dir <path>   Local git checkout of the library repo (default: ${DEFAULT_LIBRARY_DIR})
  --confirm              (push) Commit & push. Without it, push only stages and previews.
  --dry-run              (pull) Report changes without writing.
  --accept <skill>       (check-upstream) Re-pin <skill>'s vendored hashes to current upstream.
  --help                 Show this help.

The library repo is https://github.com/${REPO}. 'pull' and 'push' operate through the
local checkout at --library-dir, which must be a git clone of that repo.
When pushing, also scans ${LOCAL_SOURCE_DIRS.join(", ")} for locally installed skills.`);
  process.exit(args.help ? 0 : 1);
}

const SKILLS_DIR = args["skills-dir"]!;
const LIBRARY_DIR = args["library-dir"]!;
const CONFIRM = args.confirm!;
const DRY_RUN = args["dry-run"]!;

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

async function git(cwd: string, ...gitArgs: string[]) {
  const p = Bun.spawn(["git", ...gitArgs], { cwd, stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr] = await Promise.all([
    new Response(p.stdout).text(),
    new Response(p.stderr).text(),
  ]);
  const code = await p.exited;
  return { code, stdout, stderr };
}

async function requireLibraryCheckout() {
  if (!(await exists(join(LIBRARY_DIR, ".git")))) {
    fail(
      `${LIBRARY_DIR} is not a git checkout of ${REPO}.\n` +
        `  Clone it first: git clone https://github.com/${REPO}.git "${LIBRARY_DIR}"`,
    );
  }
}

interface SkillEntry {
  name: string;
  sourceDir: string;
}

function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const kv = line.match(/^(\w[\w-]*):\s*(.+)$/);
    if (kv) meta[kv[1]] = kv[2].trim();
    const nested = line.match(/^\s+(\w[\w-]*):\s*(.+)$/);
    if (nested) meta[nested[1]] = nested[2].trim();
  }
  return meta;
}

// Directories (containing a SKILL.md) inside `dir`, keyed by skill name.
async function scanDir(dir: string): Promise<Map<string, string>> {
  const skills = new Map<string, string>();
  if (!(await exists(dir))) return skills;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory() || EXCLUDE.has(entry.name) || NON_SKILL_ENTRIES.has(entry.name)) continue;
    if (await exists(join(dir, entry.name, "SKILL.md"))) skills.set(entry.name, dir);
  }
  return skills;
}

// Local skills: LOCAL_SOURCE_DIRS first, then SKILLS_DIR (which wins on name clash).
async function collectLocalSkills(): Promise<SkillEntry[]> {
  const merged = new Map<string, string>();
  for (const dir of LOCAL_SOURCE_DIRS) {
    for (const [name, src] of await scanDir(dir)) merged.set(name, src);
  }
  for (const [name, src] of await scanDir(SKILLS_DIR)) merged.set(name, src);
  return Array.from(merged.entries())
    .map(([name, sourceDir]) => ({ name, sourceDir }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

const copyFilter = (source: string) => !EXCLUDE.has(source.split("/").pop()!);

// Relative file paths under `dir`, excluding EXCLUDE dirs.
async function walkFiles(dir: string, base = dir): Promise<string[]> {
  const out: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (EXCLUDE.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walkFiles(full, base)));
    else out.push(full.slice(base.length + 1));
  }
  return out;
}

// True if any file present in `srcDir` is missing from or differs in `destDir`.
// (One-directional: ignores files that exist only in destDir.)
async function srcHasChanges(srcDir: string, destDir: string): Promise<boolean> {
  if (!(await exists(destDir))) return true;
  for (const rel of await walkFiles(srcDir)) {
    const a = join(srcDir, rel);
    const b = join(destDir, rel);
    if (!(await exists(b))) return true;
    const [ca, cb] = await Promise.all([readFile(a), readFile(b)]);
    if (!ca.equals(cb)) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// README generation (for the library repo)
// ---------------------------------------------------------------------------

const AUTHORED_BY_ME = new Set(["j-alicia-long"]);

const GROUP_ORDER = [
  "Design & UI",
  "Development Workflow",
  "Planning & Decision-Making",
  "Learning & Discovery",
  "Productivity & Utilities",
];

const GROUP_MAP: Record<string, string> = {
  "animation-vocabulary": "Design & UI",
  "apple-design": "Design & UI",
  "emil-design-eng": "Design & UI",
  "frontend-design": "Design & UI",
  "visual-design-rules": "Design & UI",
  "github": "Development Workflow",
  "mcporter": "Development Workflow",
  "setup-pre-commit": "Development Workflow",
  "tdd": "Development Workflow",
  "webapp-testing": "Development Workflow",
  "improve-codebase-architecture": "Development Workflow",
  "grill-me": "Planning & Decision-Making",
  "grill-with-docs": "Planning & Decision-Making",
  "grilling": "Planning & Decision-Making",
  "to-design-spec": "Planning & Decision-Making",
  "to-spec": "Planning & Decision-Making",
  "to-tickets": "Planning & Decision-Making",
  "writing-great-agentsmd": "Planning & Decision-Making",
  "writing-great-skills": "Planning & Decision-Making",
  "find-skills": "Learning & Discovery",
  "teach": "Learning & Discovery",
  "archive-conversation": "Productivity & Utilities",
  "product-comparator": "Productivity & Utilities",
  "skill-sync": "Productivity & Utilities",
};

interface SkillMeta {
  name: string;
  description: string;
  author: string;
  group: string;
}

async function getSkillMeta(dir: string, name: string): Promise<SkillMeta> {
  const content = await readFile(join(dir, name, "SKILL.md"), "utf-8");
  const fm = parseFrontmatter(content);
  return {
    name,
    description: fm.description || "",
    author: fm.author || "",
    group: GROUP_MAP[name] || "Other",
  };
}

function renderGroup(groupName: string, skills: SkillMeta[], showSource: boolean): string {
  const lines = skills
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((m) => {
      const source = showSource && m.author ? ` *(${m.author})*` : "";
      return `- **[${m.name}](${m.name}/SKILL.md)**${source} — ${m.description}`;
    });
  return `#### ${groupName}\n\n${lines.join("\n")}`;
}

function groupedSections(list: SkillMeta[], showSource: boolean): string {
  const byGroup = new Map<string, SkillMeta[]>();
  for (const m of list) {
    const arr = byGroup.get(m.group) || [];
    arr.push(m);
    byGroup.set(m.group, arr);
  }
  const sections: string[] = [];
  for (const g of GROUP_ORDER) if (byGroup.has(g)) sections.push(renderGroup(g, byGroup.get(g)!, showSource));
  for (const [g, items] of byGroup) if (!GROUP_ORDER.includes(g)) sections.push(renderGroup(g, items, showSource));
  return sections.join("\n\n");
}

async function generateReadme(libraryDir: string): Promise<string> {
  const names = [...(await scanDir(libraryDir)).keys()].sort();
  const metas = await Promise.all(names.map((n) => getSkillMeta(libraryDir, n)));
  const authored = metas.filter((m) => AUTHORED_BY_ME.has(m.author));
  const downloaded = metas.filter((m) => !AUTHORED_BY_ME.has(m.author));

  const date = new Date().toISOString().split("T")[0];
  const parts: string[] = [
    `# Skill Library`,
    ``,
    `Portable AI skills in [Agent Skills](https://agentskills.io) format.`,
    ``,
    `Last synced: ${date}`,
  ];
  if (authored.length) parts.push("", `## My Skills`, "", groupedSections(authored, false));
  if (downloaded.length) parts.push("", `## Downloaded Skills`, "", groupedSections(downloaded, true));
  parts.push("", `## Install`, "", "```bash", `npx skills add ${REPO}`, "```", "");
  parts.push(
    `Downloaded skills are checked for upstream updates weekly by ` +
      `[a GitHub Action](.github/workflows/check-upstream.yml) using ` +
      `[\`_config/upstreams.json\`](_config/upstreams.json); see ` +
      `[skill-sync](skill-sync/SKILL.md) for the \`check-upstream\` command.`,
    "",
  );
  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Upstream update checking (_config/upstreams.json)
// ---------------------------------------------------------------------------

interface UpstreamEntry {
  repo?: string; // owner/name
  path?: string; // folder within the repo containing SKILL.md
  branch?: string; // upstream default branch (default: main)
  vendoredCommit?: string; // upstream commit last pulled from
  files?: Record<string, string>; // relative file -> git blob sha as vendored
  untracked?: string; // reason this skill has no checkable upstream
}

type UpstreamManifest = Record<string, UpstreamEntry>;

const manifestPath = () => join(LIBRARY_DIR, "_config", "upstreams.json");

async function loadManifest(): Promise<UpstreamManifest | null> {
  if (!(await exists(manifestPath()))) return null;
  return JSON.parse(await readFile(manifestPath(), "utf-8"));
}

// Git blob SHA-1 of a file's content: sha1("blob <len>\0<content>").
async function blobSha(filePath: string): Promise<string> {
  const content = await readFile(filePath);
  const header = Buffer.from(`blob ${content.length}\0`);
  const hasher = new Bun.CryptoHasher("sha1");
  hasher.update(Buffer.concat([header, content]));
  return hasher.digest("hex");
}

// GitHub API GET, preferring authenticated `gh api` (higher rate limits),
// falling back to anonymous fetch.
async function ghApi(endpoint: string): Promise<any> {
  const p = Bun.spawn(["gh", "api", endpoint], { stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, code] = await Promise.all([
    new Response(p.stdout).text(),
    new Response(p.stderr).text(),
    p.exited,
  ]);
  if (code === 0) return JSON.parse(stdout);
  // gh missing or unauthenticated — try anonymous fetch.
  const res = await fetch(`https://api.github.com/${endpoint}`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error(`GitHub API ${endpoint}: ${res.status} ${res.statusText} (gh: ${stderr.trim()})`);
  return res.json();
}

interface RepoTree {
  commitSha: string;
  blobs: Map<string, string>; // repo-relative path -> blob sha
}

// One branches call + one trees call per upstream repo.
async function fetchRepoTree(repo: string, branch: string): Promise<RepoTree> {
  const br = await ghApi(`repos/${repo}/branches/${branch}`);
  const commitSha: string = br.commit.sha;
  const treeSha: string = br.commit.commit.tree.sha;
  const tree = await ghApi(`repos/${repo}/git/trees/${treeSha}?recursive=1`);
  const blobs = new Map<string, string>();
  for (const item of tree.tree) if (item.type === "blob") blobs.set(item.path, item.sha);
  if (tree.truncated) console.error(`  ⚠ tree listing for ${repo} was truncated; results may be incomplete`);
  return { commitSha, blobs };
}

interface SkillCheck {
  name: string;
  entry: UpstreamEntry;
  upstreamChanged: boolean;
  localChanged: boolean;
  changedFiles: string[];
  headCommit: string;
}

interface UpstreamReport {
  updates: SkillCheck[];
  localOnly: SkillCheck[];
  diverged: SkillCheck[];
  upToDate: string[];
  untracked: [string, string][];
  notInManifest: string[];
  errors: [string, string][];
}

async function checkUpstream(): Promise<UpstreamReport | null> {
  const manifest = await loadManifest();
  if (!manifest) return null;

  const report: UpstreamReport = {
    updates: [], localOnly: [], diverged: [], upToDate: [],
    untracked: [], notInManifest: [], errors: [],
  };

  const libSkills = [...(await scanDir(LIBRARY_DIR)).keys()];
  for (const name of libSkills) {
    const meta = await getSkillMeta(LIBRARY_DIR, name);
    if (!manifest[name] && !AUTHORED_BY_ME.has(meta.author)) report.notInManifest.push(name);
  }

  // Group tracked skills by repo so each repo's tree is fetched once.
  const byRepo = new Map<string, [string, UpstreamEntry][]>();
  for (const [name, entry] of Object.entries(manifest)) {
    if (entry.untracked !== undefined) {
      report.untracked.push([name, entry.untracked]);
      continue;
    }
    if (!entry.repo || !entry.path || !entry.files) {
      report.errors.push([name, "manifest entry incomplete (needs repo, path, files)"]);
      continue;
    }
    const key = `${entry.repo}#${entry.branch || "main"}`;
    (byRepo.get(key) ?? byRepo.set(key, []).get(key)!).push([name, entry]);
  }

  for (const [key, skills] of byRepo) {
    const [repo, branch] = key.split("#");
    let tree: RepoTree;
    try {
      tree = await fetchRepoTree(repo, branch);
    } catch (e: any) {
      for (const [name] of skills) report.errors.push([name, `${repo}: ${e.message}`]);
      continue;
    }

    for (const [name, entry] of skills) {
      const changedFiles: string[] = [];
      let upstreamChanged = false;
      let localChanged = false;

      for (const [rel, vendoredSha] of Object.entries(entry.files!)) {
        const upstreamSha = tree.blobs.get(`${entry.path}/${rel}`);
        if (upstreamSha !== vendoredSha) {
          upstreamChanged = true;
          changedFiles.push(rel + (upstreamSha ? "" : " (removed upstream)"));
        }
        const localFile = join(LIBRARY_DIR, name, rel);
        if (!(await exists(localFile)) || (await blobSha(localFile)) !== vendoredSha) localChanged = true;
      }
      // Files added upstream under the skill's folder also count as an update.
      for (const p of tree.blobs.keys()) {
        if (p.startsWith(`${entry.path}/`)) {
          const rel = p.slice(entry.path!.length + 1);
          if (!(rel in entry.files!)) {
            upstreamChanged = true;
            changedFiles.push(`${rel} (new upstream)`);
          }
        }
      }

      const check: SkillCheck = { name, entry, upstreamChanged, localChanged, changedFiles, headCommit: tree.commitSha };
      if (upstreamChanged && localChanged) report.diverged.push(check);
      else if (upstreamChanged) report.updates.push(check);
      else if (localChanged) report.localOnly.push(check);
      else report.upToDate.push(name);
    }
  }
  return report;
}

function compareLink(entry: UpstreamEntry, headCommit: string): string {
  const base = entry.vendoredCommit ? entry.vendoredCommit.slice(0, 12) : "";
  return base
    ? `https://github.com/${entry.repo}/compare/${base}...${headCommit.slice(0, 12)}`
    : `https://github.com/${entry.repo}/tree/${headCommit.slice(0, 12)}/${entry.path}`;
}

function printUpstreamReport(r: UpstreamReport) {
  const line = (c: SkillCheck) =>
    `  ${c.name.padEnd(28)} ${c.entry.repo} — ${c.changedFiles.join(", ")}\n` +
    `  ${"".padEnd(28)} ${compareLink(c.entry, c.headCommit)}`;

  if (r.updates.length) {
    console.log(`\nUPSTREAM UPDATES (${r.updates.length}) — review the diff, apply manually, then re-pin with --accept:`);
    for (const c of r.updates) console.log(line(c));
  }
  if (r.diverged.length) {
    console.log(`\nDIVERGED (${r.diverged.length}) — changed both locally and upstream; manual merge needed:`);
    for (const c of r.diverged) console.log(line(c));
  }
  if (r.localOnly.length) {
    console.log(`\nLOCALLY MODIFIED (${r.localOnly.length}) — upstream unchanged; nothing to do:`);
    for (const c of r.localOnly) console.log(`  ${c.name.padEnd(28)} ${c.entry.repo}`);
  }
  if (r.untracked.length) {
    console.log(`\nUNTRACKED (${r.untracked.length}) — no checkable upstream:`);
    for (const [name, why] of r.untracked) console.log(`  ${name.padEnd(28)} ${why}`);
  }
  if (r.notInManifest.length) {
    console.log(`\nNOT IN MANIFEST (${r.notInManifest.length}) — downloaded skills with no upstream entry:`);
    console.log(`  ${r.notInManifest.sort().join(", ")}`);
  }
  if (r.errors.length) {
    console.log(`\nERRORS (${r.errors.length}) — check manually:`);
    for (const [name, msg] of r.errors) console.log(`  ${name.padEnd(28)} ${msg}`);
  }
  console.log(`\n✓ up to date: ${r.upToDate.length ? r.upToDate.sort().join(", ") : "none"}`);
}

// Re-pin a skill's manifest entry to current upstream (after a manual update).
async function acceptUpstream(skillName: string) {
  const manifest = await loadManifest();
  if (!manifest) fail(`No manifest at ${manifestPath()}`);
  const entry = manifest[skillName];
  if (!entry) fail(`'${skillName}' is not in the manifest`);
  if (entry.untracked !== undefined || !entry.repo || !entry.path) fail(`'${skillName}' is untracked — nothing to pin`);

  const tree = await fetchRepoTree(entry.repo, entry.branch || "main");
  const files: Record<string, string> = {};
  for (const [p, sha] of tree.blobs) {
    if (p.startsWith(`${entry.path}/`)) files[p.slice(entry.path.length + 1)] = sha;
  }
  if (!Object.keys(files).length) fail(`No files found upstream at ${entry.repo}/${entry.path}`);
  entry.vendoredCommit = tree.commitSha;
  entry.files = files;
  await writeFile(manifestPath(), JSON.stringify(manifest, null, 2) + "\n");
  console.log(`✓ Re-pinned ${skillName} to ${entry.repo}@${tree.commitSha.slice(0, 12)} (${Object.keys(files).length} files)`);
  console.log(`  Remember to commit _config/upstreams.json.`);
}

async function checkUpstreamCmd() {
  await requireLibraryCheckout();
  if (args.accept) {
    await acceptUpstream(args.accept);
    return;
  }
  console.log(`Checking upstream sources (${manifestPath()})...`);
  const report = await checkUpstream();
  if (!report) fail(`No manifest found at ${manifestPath()}`);
  printUpstreamReport(report);
  // Exit 20 signals "updates found" (used by CI); errors don't fail the run.
  if (report.updates.length || report.diverged.length) process.exit(20);
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function pull() {
  await requireLibraryCheckout();
  console.log(`↓ Pulling latest from ${REPO}...`);
  const pl = await git(LIBRARY_DIR, "pull", "--ff-only");
  process.stdout.write(pl.stdout.trim() ? pl.stdout : "");
  if (pl.code !== 0) fail(`git pull failed:\n${pl.stderr.trim()}`);

  const libSkills = [...(await scanDir(LIBRARY_DIR)).keys()].sort();
  const added: string[] = [];
  const updated: string[] = [];
  let unchanged = 0;

  for (const name of libSkills) {
    const libPath = join(LIBRARY_DIR, name);
    const localPath = join(SKILLS_DIR, name);
    const existsLocal = await exists(join(localPath, "SKILL.md"));
    if (existsLocal && !(await srcHasChanges(libPath, localPath))) {
      unchanged++;
      continue;
    }
    if (!DRY_RUN) await cp(libPath, localPath, { recursive: true, force: true, filter: copyFilter });
    (existsLocal ? updated : added).push(name);
  }

  const verb = DRY_RUN ? "Would merge" : "Merged";
  console.log(`\n${verb} from library → ${SKILLS_DIR}`);
  if (added.length) console.log(`  + new:     ${added.join(", ")}`);
  if (updated.length) console.log(`  ~ updated: ${updated.join(", ")}`);
  console.log(`  = unchanged: ${unchanged}`);
  if (!added.length && !updated.length) console.log("  Local is already up to date with the library.");
  console.log(
    `\nNote: pull overlays library files onto local skills. Local-only files are preserved, but ` +
      `local edits to a skill that also changed upstream will be overwritten. Push local work first if unsure.`,
  );
}

async function stageIntoLibrary(): Promise<{ skills: SkillEntry[]; localCount: number }> {
  const skills = await collectLocalSkills();
  const localCount = skills.filter((s) => s.sourceDir !== SKILLS_DIR).length;
  await mkdir(LIBRARY_DIR, { recursive: true });
  for (const skill of skills) {
    const dest = join(LIBRARY_DIR, skill.name);
    await rm(dest, { recursive: true, force: true });
    await cp(join(skill.sourceDir, skill.name), dest, { recursive: true, filter: copyFilter });
  }
  await writeFile(join(LIBRARY_DIR, "README.md"), await generateReadme(LIBRARY_DIR));
  return { skills, localCount };
}

async function push() {
  await requireLibraryCheckout();
  const { skills, localCount } = await stageIntoLibrary();
  console.log(
    `↑ Staged ${skills.length} local skills into the library ` +
      `(${skills.length - localCount} from ${SKILLS_DIR}, ${localCount} locally installed).`,
  );
  console.log(`  (upsert only — library skills absent locally are left untouched)\n`);

  await git(LIBRARY_DIR, "add", "-A");
  const status = await git(LIBRARY_DIR, "status", "--porcelain");
  if (!status.stdout.trim()) {
    console.log("✓ Library already matches local skills — nothing to push.");
    return;
  }

  const statDiff = await git(LIBRARY_DIR, "--no-pager", "diff", "--cached", "--stat");
  console.log("Pending changes to push:");
  console.log(statDiff.stdout.trim());

  if (!CONFIRM) {
    console.log(
      `\n⏸  Preview only — nothing committed or pushed.\n` +
        `   Review the changes above, then run:  bun run sync.ts push --confirm`,
    );
    return;
  }

  await git(LIBRARY_DIR, "config", "user.name", "Jennifer Long");
  await git(LIBRARY_DIR, "config", "user.email", "4724192+j-alicia-long@users.noreply.github.com");
  const date = new Date().toISOString().split("T")[0];
  const commit = await git(LIBRARY_DIR, "commit", "-m", `Sync ${skills.length} skills (${date})`);
  console.log(`📦 ${commit.stdout.trim()}`);
  const pushed = await git(LIBRARY_DIR, "push");
  if (pushed.code !== 0) fail(`Push failed:\n${pushed.stderr.trim()}`);
  console.log(`✓ Pushed to https://github.com/${REPO}`);
}

async function status() {
  await requireLibraryCheckout();
  const local = await collectLocalSkills();
  const localMap = new Map(local.map((s) => [s.name, s.sourceDir]));
  const libNames = [...(await scanDir(LIBRARY_DIR)).keys()];

  // Pull direction: library → local
  const pullNew: string[] = [];
  const pullUpdated: string[] = [];
  for (const name of libNames) {
    const localPath = join(SKILLS_DIR, name);
    if (!(await exists(join(localPath, "SKILL.md")))) pullNew.push(name);
    else if (await srcHasChanges(join(LIBRARY_DIR, name), localPath)) pullUpdated.push(name);
  }

  // Push direction: local → library
  const pushNew: string[] = [];
  const pushUpdated: string[] = [];
  for (const [name, srcDir] of localMap) {
    const libPath = join(LIBRARY_DIR, name);
    if (!(await exists(join(libPath, "SKILL.md")))) pushNew.push(name);
    else if (await srcHasChanges(join(srcDir, name), libPath)) pushUpdated.push(name);
  }

  const libOnly = libNames.filter((n) => !localMap.has(n)).sort();

  const fmt = (a: string[]) => (a.length ? a.sort().join(", ") : "none");
  console.log(`Skill sync status  (local: ${SKILLS_DIR})`);
  console.log(`                   (library: ${LIBRARY_DIR})\n`);
  console.log(`↓ pull would bring DOWN from library:`);
  console.log(`    new:     ${fmt(pullNew)}`);
  console.log(`    updated: ${fmt(pullUpdated)}`);
  console.log(`\n↑ push would send UP to library:`);
  console.log(`    new:     ${fmt(pushNew)}`);
  console.log(`    updated: ${fmt(pushUpdated)}`);
  console.log(`\nℹ library-only skills (kept by push, pulled down on next pull): ${fmt(libOnly)}`);

  // Upstream check (best-effort; skipped when offline or manifest missing).
  try {
    const report = await checkUpstream();
    if (report) {
      console.log(`\n— Upstream sources —`);
      printUpstreamReport(report);
    }
  } catch (e: any) {
    console.log(`\n⚠ Upstream check skipped: ${e.message}`);
  }
}

async function main() {
  if (cmd === "pull") await pull();
  else if (cmd === "push") await push();
  else if (cmd === "status") await status();
  else if (cmd === "check-upstream") await checkUpstreamCmd();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
