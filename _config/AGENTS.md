# Global agent instructions

Read each section, and ALWAYS follow the listed rules when the action occurs.

## For every task
- Keep tool responses concise. Return file paths and relevant metadata; never dump base64 images or binary data into model context.
- Ask user to clarify conflicting repository instructions before changing or committing affected files.
- Document canonical asset sources, background colors, padding, sizes, and reproducible export commands.

## When starting on a task
- Use the smallest workflow that fits the task; skip design exploration when requirements are explicit.
- Check installed tools and dependencies before searching for or installing alternatives.

## When working with images and graphical assets
- Preserve supplied artwork. Use deterministic tools like Sharp for resizing, padding, background compositing, and format conversion; reserve image generation for creative changes.

## When testing changes
- Build once for browser/app verification; avoid concurrent operations that clear a running server’s cache.
- Account for commit hooks when planning checks. Repeat validation only after relevant changes or failures.
- Use bounded waits instead of frequent polling.
- Report exactly what was verified, and distinguish exact transformations from approximations.

## When updating documentation
- Keep copy succinct - 1-2 sentences per docstring, devlog entry, bullet point.

## Before every commit
- Ensure that all relevant documentation is updated (`README.md`, devlog.md, CONTEXT.md, file docstrings).
- Remove unused files and temporary artifacts related to the task; ensure generated output is excluded from linting.
- Honor review checkpoints: show the complete diff before committing or pushing when requested.
- Make sure precommit is run and passes. Never force-push or push to main/master branch without getting my explicit consent.

