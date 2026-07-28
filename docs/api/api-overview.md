# API Overview

> Design philosophy, versioning, and conventions for the Cognitive Engine API.

---

## Base URL

```
Production:  https://api.cognitive-engine.dev/v1
Staging:     https://api-staging.cognitive-engine.dev/v1
Local:       http://localhost:3001/v1
```

---

## Versioning

- API versions are included in the URL path: `/v1/`, `/v2/`
- Breaking changes require a new version
- Non-breaking additions (new fields, new endpoints) do not require a new version
- Deprecated versions are supported for at least 6 months

---

## Request Format

```http
Content-Type: application/json
Authorization: Bearer <token>
X-Request-ID: <uuid>  (optional, for tracing)
```

---

## Response Format

All responses follow a consistent envelope:

### Success Response

```json
{
  "data": { ... },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-07-28T00:00:00Z"
  }
}
```

### Paginated Response

```json
{
  "data": [ ... ],
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-07-28T00:00:00Z"
  },
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

### Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": [ ... ]
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-07-28T00:00:00Z"
  }
}
```

---

## Conventions

| Convention | Standard |
|---|---|
| Resource naming | Plural nouns, kebab-case (`/entries`, `/cognitive-digests`) |
| Query params | camelCase (`?pageSize=20&sortBy=createdAt`) |
| Request body | camelCase JSON |
| Response body | camelCase JSON |
| Dates | ISO 8601 with timezone (`2026-07-28T00:00:00Z`) |
| IDs | UUID v4 |
| Pagination | Offset-based (page + pageSize) |
| Sorting | `?sortBy=field&sortOrder=asc|desc` |
| Filtering | `?filter[field]=value` |

---

## Rate Limiting

| Tier | Limit | Window |
|---|---|---|
| Free | 100 req/min | Per user |
| Pro | 500 req/min | Per user |
| AI endpoints | 30 req/min | Per user |

Rate limit headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1690502400
```

---

## HTTP Status Codes

| Code | Meaning | When |
|---|---|---|
| `200` | OK | Successful GET, PUT, PATCH |
| `201` | Created | Successful POST |
| `204` | No Content | Successful DELETE |
| `400` | Bad Request | Validation error |
| `401` | Unauthorized | Missing or invalid token |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Duplicate resource |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Unexpected server error |

---

> _Full endpoint documentation is in [endpoints.md](endpoints.md). OpenAPI spec will be generated from route definitions._
