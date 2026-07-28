# Contributing to Cognitive Engine

Thank you for your interest in contributing to **Cognitive Engine**! This document provides guidelines and information about contributing to this project.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Commit Convention](#commit-convention)
- [Coding Standards](#coding-standards)

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

---

## Getting Started

1. **Fork** the repository
2. **Clone** your fork locally
3. **Install dependencies**: `pnpm install`
4. **Create a branch**: `git checkout -b feature/CE-xxx-your-feature`
5. **Make your changes**
6. **Test your changes**: `pnpm test`
7. **Submit a Pull Request**

For detailed setup instructions, see [docs/development/setup.md](docs/development/setup.md).

---

## Development Workflow

We follow a modified **GitHub Flow** branching strategy:

```
main ← production-ready, protected
├── develop ← integration branch
├── feature/CE-xxx-* ← feature branches
├── fix/CE-xxx-* ← bugfix branches
└── hotfix/* ← emergency fixes
```

### Branch Naming

| Type    | Pattern                      | Example                    |
| ------- | ---------------------------- | -------------------------- |
| Feature | `feature/CE-xxx-description` | `feature/CE-042-user-auth` |
| Bug Fix | `fix/CE-xxx-description`     | `fix/CE-087-login-crash`   |
| Hotfix  | `hotfix/description`         | `hotfix/critical-db-fix`   |
| Release | `release/vX.Y.Z`             | `release/v1.0.0`           |

---

## Pull Request Process

1. Ensure your branch is up-to-date with `develop`
2. Run all tests and linting: `pnpm test && pnpm lint`
3. Fill out the PR template completely
4. Request review from at least one team member
5. Address all review comments
6. Squash merge once approved

### PR Checklist

- [ ] Tests pass locally
- [ ] Linting passes
- [ ] TypeScript compiles without errors
- [ ] Documentation updated (if applicable)
- [ ] No `console.log` statements left behind
- [ ] Accessibility considered (for UI changes)

---

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type       | Description                                           |
| ---------- | ----------------------------------------------------- |
| `feat`     | A new feature                                         |
| `fix`      | A bug fix                                             |
| `docs`     | Documentation changes                                 |
| `style`    | Code style changes (formatting, semicolons, etc.)     |
| `refactor` | Code changes that neither fix a bug nor add a feature |
| `perf`     | Performance improvements                              |
| `test`     | Adding or updating tests                              |
| `build`    | Build system or dependency changes                    |
| `ci`       | CI/CD configuration changes                           |
| `chore`    | Other changes that don't modify src or test files     |

### Examples

```
feat(api): add user authentication endpoints
fix(web): resolve hydration mismatch on dashboard
docs(ai): update prompt engineering guidelines
refactor(shared): extract token utilities to shared package
```

---

## Coding Standards

For detailed coding standards, see [docs/development/coding-standards.md](docs/development/coding-standards.md).

### Quick Reference

- **Language**: TypeScript (strict mode) everywhere
- **Formatting**: Prettier (run `pnpm format`)
- **Linting**: ESLint (run `pnpm lint`)
- **No `any` types** — use `unknown` + type guards
- **Document _why_, not _what_**
- **Max ~300 lines per file**

---

## Questions?

If you have questions about contributing, please open a [Discussion](https://github.com/your-org/cognitive-engine/discussions) or reach out to the maintainers.

Thank you for helping build the future of cognitive augmentation! 🧠
