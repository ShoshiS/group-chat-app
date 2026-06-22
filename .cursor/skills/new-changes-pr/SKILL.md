---
name: new-changes-pr
description: >-
  Publish local work to GitHub: sync main, branch, commit, push, and open a PR.
  Use when the user asks to publish new changes, open a branch for recent work,
  commit changes, pull main from GitHub, push, create a new PR, or return to main.
disable-model-invocation: true
---

# New Changes PR

End-to-end workflow for turning local changes into a GitHub pull request.

## הוראות

1. תפתח בראנץ לשינויים החדשים שנעשו
2. תעשה קומיטים
3. תמשך את השינוים הקודמים מהמין בגיתהאב למין המקומי
4. תיצור PR חדש
5. תדחוף לגיטהאב
6. תחזור לענף המיין בגיטהאב המקומי

> **סדר טכני:** GitHub דורש push לפני PR. בשלבים למטה: push (4) → PR (5). שאר הסדר זהה.

## Git safety

- NEVER update git config
- NEVER run destructive commands (`reset --hard`, `clean -fdx`, force-push to main/master) unless the user explicitly asks
- NEVER skip hooks (`--no-verify`, `--no-gpg-sign`) unless the user explicitly asks
- Do not commit `.env`, credentials, or other secret files — warn if the user tries
- Use `gh` for all GitHub tasks (PRs, checks, issues)
- Rebase only the **feature branch** onto main — never rebase main itself

## Detect default branch

Run once at the start; reuse the result as `<default-branch>` everywhere:

```bash
gh repo view --json defaultBranchRef -q .defaultBranchRef.name
```

Fallback: `git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@'` or `main`.

## Project conventions

Read [AGENTS.md](../../AGENTS.md) at the repo root and follow its git rules:

- Branch: `feature/<slice>` (e.g. `feature/chat-realtime`)
- Commits: [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- One slice per branch/PR — keep PRs small and scoped
- Run lint before committing when code changed:
  - `server/` → `npm run lint` from `server/`
  - `client/` → `npm run lint` from `client/`

## Step 1 — תפתח בראנץ לשינויים החדשים שנעשו

Inspect state first (run in parallel):

```bash
git status
git diff
git diff --staged
git branch --show-current
```

- If on `<default-branch>` with uncommitted work, create a feature branch **before** committing:
  ```bash
  git checkout -b <branch-name>
  ```
- If already on a feature branch with the right changes, keep it — do not recreate

## Step 2 — תעשה קומיטים

**Pre-flight (before staging):**

- Confirm no secrets in the diff (`.env`, keys, tokens)
- If unrelated changes span multiple slices, split into separate commits or ask the user
- Run lint when applicable (see Project conventions)

**Commit rules:**

- Stage only relevant files — no blind `git add .` unless the user explicitly wants everything
- Read `git log -5 --oneline` and match the repo's commit message style
- One logical change per commit when the diff spans unrelated concerns
- Message: 1–2 sentences focused on **why**, not a file list

**Bash:**

```bash
git add <files>
git commit -m "$(cat <<'EOF'
feat: short summary of why.

EOF
)"
```

**PowerShell** (HEREDOC often fails on Windows):

```powershell
git add <files>
git commit -m "feat: short summary of why."
```

If there is nothing to commit (clean tree, no untracked relevant files), skip to step 3 and report that commits already exist.

## Step 3 — תמשך את השינוים הקודמים מהמין בגיתהאב למין המקומי

Sync local main with remote, then rebase the feature branch:

```bash
git fetch origin
git checkout <default-branch>
git pull origin <default-branch>
git checkout <feature-branch>
git rebase <default-branch>
```

- If rebase conflicts: resolve, `git add`, `git rebase --continue`. If intent is unclear, stop and ask.
- Remember `<feature-branch>` name — needed for push and PR steps.

## Step 4 — תדחוף לגיטהאב

First push:

```bash
git push -u origin HEAD
```

After rebase, if the branch was already on remote:

```bash
git push --force-with-lease
```

Never force-push `<default-branch>`.

## Step 5 — תיצור PR חדש

Gather context (parallel):

```bash
git status
git diff <default-branch>...HEAD
git log <default-branch>..HEAD --oneline
```

**Check for an existing PR** on this branch:

```bash
gh pr view --head <feature-branch> --json url -q .url 2>/dev/null
```

- **PR exists** → report its URL; push in step 4 already updated it. Do not create a duplicate.
- **No PR** → create one:

```bash
gh pr create --title "<title>" --body "$(cat <<'EOF'
## Summary
- <bullet 1>
- <bullet 2>

## Test plan
- [ ] <how to verify>

EOF
)"
```

**PowerShell** for PR body:

```powershell
gh pr create --title "<title>" --body "## Summary`n- bullet 1`n- bullet 2`n`n## Test plan`n- [ ] how to verify"
```

- Title: concise, describes the change
- Summary: 1–3 bullets covering **all** commits on the branch, not just the latest
- Return the PR URL to the user

## Step 6 — תחזור לענף המיין בגיטהאב המקומי

After PR is created/updated and pushed:

```bash
git checkout <default-branch>
git pull origin <default-branch>
```

Do not delete the feature branch unless the user asks.

## Report back

Keep it short:

- Branch: `<branch-name>`
- Commits: `<hash>` — `<message>` (or "already committed")
- PR: `<url>` (new or existing)
- Local branch: `<default-branch>` (up to date with origin)
- Skipped / notes: unstaged files, lint not run, rebase conflicts resolved, etc.
