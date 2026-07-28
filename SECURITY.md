# Security Policy

## Reporting a Vulnerability

We take the security of Cognitive Engine seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

**DO NOT** open a public issue for security vulnerabilities.

Instead, please email us at: **security@cognitive-engine.dev**

Include the following in your report:

1. **Description** of the vulnerability
2. **Steps to reproduce** the issue
3. **Potential impact** of the vulnerability
4. **Suggested fix** (if any)

### Response Timeline

| Action                   | Timeline                  |
| ------------------------ | ------------------------- |
| Acknowledgment of report | Within 48 hours           |
| Initial assessment       | Within 5 business days    |
| Fix development          | Within 30 days (critical) |
| Public disclosure        | After fix is deployed     |

### Supported Versions

| Version        | Supported |
| -------------- | --------- |
| Latest         | ✅        |
| Previous minor | ✅        |
| Older versions | ❌        |

## Security Best Practices

For contributors, please review our security guidelines in [docs/development/coding-standards.md](docs/development/coding-standards.md).

### Key Requirements

- Never commit secrets, API keys, or credentials
- Use environment variables for all sensitive configuration
- Follow the principle of least privilege
- Validate and sanitize all user inputs
- Use parameterized queries (never string concatenation for SQL)
- Keep dependencies up to date

## Acknowledgments

We appreciate the security research community's efforts in helping keep Cognitive Engine and its users safe. Responsible reporters will be acknowledged (with permission) in our security advisories.
