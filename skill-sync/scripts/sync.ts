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
    help: { type: "boolean", default: false },
  },
});

const cmd = positionals[0];
const VALID = ["status", "pull", "push"];

if (args.help || !cmd || !VALID.includes(cmd)) {
  console.log(`Usage: bun run sync.ts <command> [options]

Bidirectional sync between the local skills directory and the shared library repo.

Commands:
  status   Show what pull and push would change (read-only, no writes).
  pull     Pull the library repo and merge its skills into the local skills directory.
           Additive overlay: new/updated skills are copied down; local-only files are kept.
  push     Copy local skills into the library and push to GitHub.
           Additive upsert: never deletes library skills that are absent locally.
           Requires --confirm to actually commit & push (otherwise previews the diff).

Options:
  --skills-dir <path>    Local skills directory (default: ${DEFAULT_SKILLS_DIR})
  --library-dir <path>   Local git checkout of the library repo (default: ${DEFAULT_LIBRARY_DIR})
  --confirm              (push) Commit & push. Without it, push only stages and previews.
  --dry-run              (pull) Report changes without writing.
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
  return parts.join("\n");
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
}

async function main() {
  if (cmd === "pull") await pull();
  else if (cmd === "push") await push();
  else if (cmd === "status") await status();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
