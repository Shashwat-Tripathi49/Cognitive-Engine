# 🔌 API Documentation

This directory contains all API specification documentation for Cognitive Engine.

## Contents

| Document                            | Description                                               |
| ----------------------------------- | --------------------------------------------------------- |
| [API Overview](api-overview.md)     | API design philosophy, versioning, and base URL structure |
| [Authentication](authentication.md) | Auth flows, token management, and session handling        |
| [Endpoints](endpoints.md)           | Complete endpoint reference organized by resource         |
| [Error Handling](error-handling.md) | Error response format, codes, and recovery guidance       |
| [OpenAPI](openapi/)                 | OpenAPI/Swagger specification files                       |

## API Design Principles

1. **RESTful** — Resources are nouns, HTTP methods are verbs
2. **Consistent** — Same patterns everywhere (pagination, filtering, errors)
3. **Versioned** — Breaking changes require a new API version
4. **Documented** — Every endpoint has request/response examples
5. **Typed** — Request/response types are shared with frontend via `packages/shared`
