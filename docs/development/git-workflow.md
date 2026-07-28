# Git Workflow

> Branching strategy, commit conventions, and merge process.

---

## Branching Model

We use a modified **GitHub Flow** with a `develop` integration branch.

```
main                         ← Production-ready, protected
│
├── develop                  ← Integration branch, protected
│   │
│   ├── feature/CE-xxx-*     ← Feature branches
│   ├── fix/CE-xxx-*         ← Bug fix branches
│   └── chore/*              ← Maintenance branches
│
├── release/vX.Y.Z           ← Release candidates (cut from develop)
│
└── hotfix/*                 ← Emergency fixes (from main)
```

---

## Branch Naming

```
<type>/<ticket-id>-<short-description>
```

| Type      | Use                      | Example                     |
| --------- | ------------------------ | --------------------------- |
| `feature` | New functionality        | `feature/CE-042-user-auth`  |
| `fix`     | Bug fixes                | `fix/CE-087-login-crash`    |
| `chore`   | Maintenance, refactoring | `chore/update-dependencies` |
| `hotfix`  | Emergency production fix | `hotfix/critical-db-fix`    |
| `release` | Release preparation      | `release/v1.0.0`            |

---

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type       | Description                  |
| ---------- | ---------------------------- |
| `feat`     | New feature                  |
| `fix`      | Bug fix                      |
| `docs`     | Documentation only           |
| `style`    | Formatting (no code change)  |
| `refactor` | Code change (no feature/fix) |
| `perf`     | Performance improvement      |
| `test`     | Adding/updating tests        |
| `build`    | Build system changes         |
| `ci`       | CI configuration             |
| `chore`    | Other maintenance            |

### Scope

Scope should be the affected package or area:

```
feat(web): add dark mode toggle
fix(api): handle null entry content
docs(ai): update prompt engineering guide
refactor(shared): extract date utilities
```

---

## Merge Strategy

| Target Branch           | Merge Type       | Rationale                             |
| ----------------------- | ---------------- | ------------------------------------- |
| `develop` ← feature/fix | **Squash merge** | Clean history, one commit per feature |
| `main` ← release        | **Merge commit** | Preserves release context             |
| `main` ← hotfix         | **Merge commit** | Preserves hotfix context              |

---

## Pull Request Process

1. Create branch from `develop`
2. Make changes, commit following conventions
3. Push branch, open PR against `develop`
4. Fill out PR template completely
5. Automated checks run (lint, test, build)
6. Request review from 1+ team member
7. Address all feedback
8. Squash merge after approval
9. Delete source branch

---

## Protected Branch Rules

### `main`

- ✅ Require PR with 1+ approval
- ✅ Require all status checks to pass
- ✅ No direct pushes
- ✅ No force pushes
- ✅ Linear history (squash merge)

### `develop`

- ✅ Require PR with 1+ approval
- ✅ Require all status checks to pass
- ✅ No direct pushes

---

## Release Process

```
1. Cut release branch from develop: release/v1.0.0
2. Update version numbers and CHANGELOG
3. Final testing on release branch
4. Merge to main (merge commit)
5. Tag: git tag v1.0.0
6. Merge main back to develop
7. Deploy from main
```

---

> _These workflows will be enforced via GitHub branch protection rules and CI checks._
