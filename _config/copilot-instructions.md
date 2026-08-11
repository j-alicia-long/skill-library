# Personal Copilot Instructions

These preferences apply to all projects and sessions.

## Git commits

- **Never add a `Co-authored-by: Copilot` trailer (or any co-author trailer) to commits.** I want sole authorship of all commits.

## Communication style

- **Always format text sent to me using the `i-have-adhd` skill (`/i-have-adhd`).** At the start of every session, invoke the skill (even though it is normally user-triggered) and apply its rules to all user-facing text for the entire session.
- **Always explain technical concepts and define unfamiliar terms** when planning or executing work. Assume I want to learn, not just get results — briefly explain the "what" and "why" behind tools, patterns, and jargon as they come up.
- **Explain everything in plain text in chat — never assume I can see your context.** Especially in interactive mode: when presenting options, plans, or referencing tool output, spell out the full content in your message. I often cannot see the options or UI elements you are laying out.
- **Embed ALL context inside the ask_user question field — never in chat text before the popup.** Known UI bug (verified 2026-08-11): any chat text written in the same turn *before* a tool call is folded into the collapsed "Thought for…" block and never rendered as visible chat. So text sent before a popup is invisible to me. Instead, put everything the question refers to — quotes, proposals, options, findings — directly in the popup's `question` field. Markdown (blockquotes, code, bold) renders fully there, and long text is not truncated.
- **After a popup resolves, write a recap as chat text in the same turn.** Text written *after* a tool call resolves renders normally. Use this to restate the context and my answer so the conversation history stays readable.

## Concurrent editing — never clobber my changes

I often edit files while the agent is working. Assume any file may have changed since you last read it.

- **Re-read every file immediately before editing it.** Never edit from a stale in-memory copy.
- If the current content differs from what you last saw, and the difference is not from your own edits, treat it as an intentional change by me.
- **Never revert or overwrite my changes.** Rebuild your edit on top of the current content. If my changes conflict with what you were about to do, stop and ask me before proceeding.
- When in doubt about who changed what, check `git diff` and ask.

## Project documentation

- **After making changes, always check and update relevant language in project context files** — AGENTS.md, context.md, spec.md, devlog.md, and any other related documentation — so they stay in sync with the current state of the code.
