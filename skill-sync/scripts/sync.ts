import { readdir, readFile, writeFile, exists, cp, rm } from "fs/promises";
import { join, resolve } from "path";
import { homedir } from "os";
import { parseArgs } from "util";

const REPO = "j-alicia-long/skill-library";

// This script lives at <library>/skill-sync/scripts/sync.ts
const DEFAULT_LIBRARY = resolve(import.meta.dir, "../..");
const DEFAULT_APP_SKILLS = join(
  homedir(),
  "Library/Application Support/com.github.githubapp/app-skills"
);

const { values: args } = parseArgs({
  options: {
    "skills-dir": { type: "string", default: DEFAULT_LIBRARY },
    "app-skills-dir": { type: "string", default: DEFAULT_APP_SKILLS },
    push: { type: "boolean", default: false },
    "no-register": { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
    help: { type: "boolean", default: false },
  },
});

if (args.help) {
  console.log(`Usage: bun run sync.ts [options]
  --skills-dir <path>      Skill library directory (default: ${DEFAULT_LIBRARY})
  --app-skills-dir <path>  GitHub Copilot app skills directory
                           (default: ${DEFAULT_APP_SKILLS})
  --no-register            Skip registering skills with the Copilot app
  --push                   Commit and push changes to GitHub (${REPO})
  --dry-run                Show what would be synced without writing`);
  process.exit(0);
}

const SKILLS_DIR = args["skills-dir"]!;
const APP_SKILLS_DIR = args["app-skills-dir"]!;
const DRY_RUN = args["dry-run"]!;
const PUSH = args["push"]!;
const REGISTER = !args["no-register"]!;

const SKIP = new Set<string>();
const EXCLUDE = new Set(["node_modules", ".git"]);

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

async function collectSkills(): Promise<SkillEntry[]> {
  const skills: SkillEntry[] = [];
  if (!(await exists(SKILLS_DIR))) return skills;
  const entries = await readdir(SKILLS_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory() || SKIP.has(entry.name) || EXCLUDE.has(entry.name)) continue;
    if (await exists(join(SKILLS_DIR, entry.name, "SKILL.md"))) {
      skills.push({ name: entry.name, sourceDir: SKILLS_DIR });
    }
  }
  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

async function registerSkill(skill: SkillEntry) {
  const src = join(skill.sourceDir, skill.name);
  const dest = join(APP_SKILLS_DIR, skill.name);
  await rm(dest, { recursive: true, force: true });
  await cp(src, dest, {
    recursive: true,
    filter: (source) => !EXCLUDE.has(source.split("/").pop()!),
  });
}

const AUTHORED_BY_ME = new Set(["j-alicia-long"]);

interface SkillMeta {
  name: string;
  description: string;
  author: string;
  group: string;
}

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
  "github": "Development Workflow",
  "mcporter": "Development Workflow",
  "setup-pre-commit": "Development Workflow",
  "tdd": "Development Workflow",
  "webapp-testing": "Development Workflow",
  "grill-me": "Planning & Decision-Making",
  "grill-with-docs": "Planning & Decision-Making",
  "grilling": "Planning & Decision-Making",
  "to-spec": "Planning & Decision-Making",
  "to-tickets": "Planning & Decision-Making",
  "writing-great-skills": "Planning & Decision-Making",
  "find-skills": "Learning & Discovery",
  "teach": "Learning & Discovery",
  "archive-conversation": "Productivity & Utilities",
  "product-comparator": "Productivity & Utilities",
  "skill-sync": "Productivity & Utilities",
};

async function getSkillMeta(skill: SkillEntry): Promise<SkillMeta> {
  const content = await readFile(join(skill.sourceDir, skill.name, "SKILL.md"), "utf-8");
  const fm = parseFrontmatter(content);
  return {
    name: skill.name,
    description: fm.description || "",
    author: fm.author || "",
    group: GROUP_MAP[skill.name] || "Other",
  };
}

function formatSkillLine(m: SkillMeta, showSource: boolean): string {
  const source = showSource && m.author ? ` *(${m.author})*` : "";
  return `- **${m.name}**${source} — ${m.description}`;
}

function renderGroup(groupName: string, skills: SkillMeta[], showSource: boolean): string {
  const lines = skills
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((s) => formatSkillLine(s, showSource));
  return `#### ${groupName}\n\n${lines.join("\n")}`;
}

async function generateReadme(skills: SkillEntry[]): Promise<string> {
  const metas = await Promise.all(skills.map(getSkillMeta));

  const authored = metas.filter((m) => AUTHORED_BY_ME.has(m.author));
  const downloaded = metas.filter((m) => !AUTHORED_BY_ME.has(m.author));

  function groupedSections(list: SkillMeta[], showSource: boolean): string {
    const byGroup = new Map<string, SkillMeta[]>();
    for (const m of list) {
      const arr = byGroup.get(m.group) || [];
      arr.push(m);
      byGroup.set(m.group, arr);
    }
    const sections: string[] = [];
    for (const g of GROUP_ORDER) {
      if (byGroup.has(g)) sections.push(renderGroup(g, byGroup.get(g)!, showSource));
    }
    for (const [g, items] of byGroup) {
      if (!GROUP_ORDER.includes(g)) sections.push(renderGroup(g, items, showSource));
    }
    return sections.join("\n\n");
  }

  const date = new Date().toISOString().split("T")[0];
  const parts: string[] = [
    `# Skill Library`,
    ``,
    `Portable AI skills in [Agent Skills](https://agentskills.io) format.`,
    ``,
    `Last synced: ${date}`,
  ];

  if (authored.length > 0) {
    parts.push("", `## My Skills`, "", groupedSections(authored, false));
  }

  if (downloaded.length > 0) {
    parts.push("", `## Downloaded Skills`, "", groupedSections(downloaded, true));
  }

  parts.push(
    "",
    `## Install`,
    "",
    "```bash",
    "npx skills add j-alicia-long/skill-library",
    "```",
    ""
  );

  return parts.join("\n");
}

async function gitPush(skillCount: number) {
  const cloneDir = "/tmp/skill-library";

  await Bun.spawn(["rm", "-rf", cloneDir]).exited;

  console.log(`\n📦 Cloning ${REPO}...`);
  const clone = Bun.spawn(["gh", "repo", "clone", REPO, cloneDir], { stderr: "pipe" });
  const cloneErr = await new Response(clone.stderr).text();
  if ((await clone.exited) !== 0) {
    console.error(`Clone failed: ${cloneErr}`);
    process.exit(1);
  }

  await Bun.spawn(["git", "config", "user.name", "Jennifer Long"], { cwd: cloneDir }).exited;
  await Bun.spawn(["git", "config", "user.email", "4724192+j-alicia-long@users.noreply.github.com"], { cwd: cloneDir }).exited;

  const cloneEntries = await readdir(cloneDir);
  for (const entry of cloneEntries) {
    if (entry === ".git") continue;
    await rm(join(cloneDir, entry), { recursive: true, force: true });
  }

  await Bun.spawn(["bash", "-c", `cp -r "${SKILLS_DIR}"/* "${cloneDir}/"`]).exited;

  await Bun.spawn(["git", "add", "-A"], { cwd: cloneDir }).exited;

  const status = Bun.spawn(["git", "status", "--porcelain"], { cwd: cloneDir });
  const statusOut = await new Response(status.stdout).text();
  await status.exited;

  if (!statusOut.trim()) {
    console.log("No changes to push — repo is up to date.");
    return;
  }

  const date = new Date().toISOString().split("T")[0];
  const msg = `Sync ${skillCount} skills (${date})`;

  const commit = Bun.spawn(["git", "commit", "-m", msg], { cwd: cloneDir });
  const commitOut = await new Response(commit.stdout).text();
  await commit.exited;
  console.log(`📦 ${commitOut.trim()}`);

  const push = Bun.spawn(["git", "push"], { cwd: cloneDir, stderr: "pipe" });
  const pushErr = await new Response(push.stderr).text();
  if ((await push.exited) !== 0) {
    console.error(`Push failed: ${pushErr}`);
    process.exit(1);
  }
  console.log(`✓ Pushed to https://github.com/${REPO}`);
}

async function main() {
  const skills = await collectSkills();

  console.log(`Found ${skills.length} skills in ${SKILLS_DIR}`);

  if (skills.length === 0) {
    console.log("No skills to sync.");
    return;
  }

  if (REGISTER) {
    if (!(await exists(APP_SKILLS_DIR))) {
      console.log(`⚠ Copilot app skills dir not found: ${APP_SKILLS_DIR} — skipping registration.`);
    } else {
      console.log(`\nRegistering with GitHub Copilot app (${APP_SKILLS_DIR}):`);
      for (const skill of skills) {
        if (DRY_RUN) {
          console.log(`  [dry-run] ${skill.name}/`);
        } else {
          await registerSkill(skill);
          console.log(`  ✓ ${skill.name}/`);
        }
      }
      if (!DRY_RUN) {
        console.log("  (restart the Copilot app or reload extensions to pick up new skills)");
      }
    }
  }

  const readme = await generateReadme(skills);
  if (!DRY_RUN) {
    await writeFile(join(SKILLS_DIR, "README.md"), readme);
  }

  console.log(`\n✅ ${DRY_RUN ? "Would sync" : "Synced"} ${skills.length} skills`);

  if (PUSH && !DRY_RUN) {
    await gitPush(skills.length);
  } else if (!DRY_RUN) {
    console.log(`Run with --push to also push to https://github.com/${REPO}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
