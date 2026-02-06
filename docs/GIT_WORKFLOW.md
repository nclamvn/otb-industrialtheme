# Git Workflow - DAFC OTB Platform

This document describes the Git workflow and branching strategy for the DAFC OTB Platform.

---

## Branch Strategy

We follow a simplified **Git Flow** with two main branches:

```
main (production)
  └── develop (integration)
      ├── feature/user-profile
      ├── feature/analytics-dashboard
      ├── fix/budget-calculation
      └── hotfix/security-patch
```

### Main Branches

| Branch | Purpose | Protected | Deploy To |
|--------|---------|-----------|-----------|
| `main` | Production-ready code | Yes | Production |
| `develop` | Integration branch | Yes | Staging |

### Supporting Branches

| Type | Purpose | Base | Merge To |
|------|---------|------|----------|
| `feature/*` | New features | `develop` | `develop` |
| `fix/*` | Bug fixes | `develop` | `develop` |
| `hotfix/*` | Urgent fixes | `main` | `main` + `develop` |

---

## Branch Naming

Use descriptive, kebab-case names:

```bash
# Features
feature/user-authentication
feature/budget-approval-workflow
feature/excel-import

# Fixes
fix/calculation-error
fix/login-redirect

# Hotfixes
hotfix/security-vulnerability
hotfix/critical-bug
```

**Rules:**
- Use lowercase
- Use hyphens, not underscores
- Be descriptive but concise

---

## Workflow Steps

### Starting New Work

```bash
# 1. Update develop branch
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Make changes and commit
git add .
git commit -m "feat: add user profile page"

# 4. Push to remote
git push origin feature/your-feature-name

# 5. Create Pull Request on GitHub
```

### Pull Request Process

1. **Push your branch** to GitHub
2. **Create PR** via GitHub UI
   - Base: `develop`
   - Compare: your feature branch
3. **Fill PR template** with description
4. **Request review** from team
5. **Address feedback** and update
6. **Merge** after approval

---

## Code Review Guidelines

### As a Reviewer

- Check code quality and readability
- Verify tests are adequate
- Look for security concerns
- Be constructive and respectful

### As an Author

- Self-review before requesting review
- Respond promptly to feedback
- Keep PR scope focused

---

## Merge Strategy

We use **Squash and Merge** for most PRs:
- Combines all commits into one
- Clean history on main/develop

### When to Merge

- All CI checks pass
- Required approvals received
- No merge conflicts
- Conversations resolved

---

## Common Commands

```bash
# Update local branch
git pull origin develop

# Create new branch
git checkout -b feature/my-feature

# Switch branches
git checkout develop

# Delete local branch
git branch -d feature/my-feature

# Delete remote branch
git push origin --delete feature/my-feature

# Resolve conflicts
git pull origin develop
# Fix conflicts manually
git add .
git commit -m "chore: resolve merge conflicts"
```

---

## Related Documents

- [Commit Convention](COMMIT_CONVENTION.md)
- [Pull Request Template](../.github/PULL_REQUEST_TEMPLATE.md)
- [CHANGELOG](../CHANGELOG.md)

---

*Following this workflow ensures smooth collaboration and maintains code quality.*
