# Commit Convention - DAFC OTB Platform

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

---

## Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

---

## Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(auth): add password reset` |
| `fix` | Bug fix | `fix(budget): correct calculation` |
| `docs` | Documentation | `docs(api): update endpoint docs` |
| `style` | Code formatting | `style: fix indentation` |
| `refactor` | Code refactoring | `refactor(api): simplify service` |
| `perf` | Performance | `perf(query): optimize query` |
| `test` | Tests | `test(auth): add login tests` |
| `build` | Build/dependencies | `build: update Next.js` |
| `ci` | CI/CD changes | `ci: add test workflow` |
| `chore` | Maintenance | `chore: update gitignore` |

---

## Scopes

### Feature Scopes
- `auth` - Authentication
- `budget` - Budget management
- `otb` - OTB planning
- `sku` - SKU management
- `workflow` - Workflow engine
- `analytics` - Analytics & KPI
- `ai` - AI features

### Technical Scopes
- `api` - Backend API
- `web` - Frontend
- `database` - Database/Prisma
- `shared` - Shared packages
- `config` - Configuration

---

## Subject Guidelines

- Use imperative mood ("add" not "added")
- Don't capitalize first letter
- No period at end
- Max 72 characters

### Good Examples
```
feat(auth): add two-factor authentication
fix(api): handle null user preferences
docs(readme): update installation steps
```

### Bad Examples
```
feat(auth): Added 2FA          # Past tense
Fix: fixed the bug             # Capitalized, vague
update files                   # No type, vague
```

---

## Body (Optional)

Use when change is complex:

```
feat(auth): add password reset flow

Implemented complete password reset:
- Send reset email with token
- Token expires after 1 hour
- Update password with valid token

Closes #123
```

---

## Breaking Changes

Use `!` after type:

```
feat(api)!: change authentication API

BREAKING CHANGE: Auth endpoints moved from /auth to /api/v2/auth
```

---

## Examples

```bash
# Simple feature
feat(auth): add remember me checkbox

# Bug fix with issue
fix(budget): prevent negative values

Fixes #234

# Documentation
docs(setup): add Docker instructions

# Refactoring
refactor(api): extract validation logic

- Created ValidationService
- Updated 8 controllers
- Added unit tests
```

---

## Tips

### DO
- Write clear, descriptive commits
- Use imperative mood
- Keep subject under 72 chars
- Reference issues when applicable

### DON'T
- Commit unrelated changes together
- Use vague messages like "fix stuff"
- Commit commented-out code

---

*Following these conventions makes history clear and useful.*
