# Error Handling

> Standardized error response format and error code reference.

---

## Error Response Format

All errors follow a consistent structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Entry content is required and must be a non-empty string.",
    "details": [
      {
        "field": "content",
        "rule": "required",
        "message": "Content is required"
      }
    ]
  },
  "meta": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-07-28T00:00:00Z"
  }
}
```

---

## Error Codes

### Client Errors (4xx)

| Code               | HTTP Status | Description                                |
| ------------------ | ----------- | ------------------------------------------ |
| `VALIDATION_ERROR` | 400         | Request body or params failed validation   |
| `INVALID_FORMAT`   | 400         | Malformed request (invalid JSON, etc.)     |
| `UNAUTHORIZED`     | 401         | Missing or invalid authentication token    |
| `TOKEN_EXPIRED`    | 401         | Access token has expired                   |
| `FORBIDDEN`        | 403         | Authenticated but insufficient permissions |
| `NOT_FOUND`        | 404         | Requested resource does not exist          |
| `CONFLICT`         | 409         | Resource already exists (duplicate)        |
| `RATE_LIMITED`     | 429         | Too many requests                          |

### Server Errors (5xx)

| Code                  | HTTP Status | Description                         |
| --------------------- | ----------- | ----------------------------------- |
| `INTERNAL_ERROR`      | 500         | Unexpected server error             |
| `DATABASE_ERROR`      | 500         | Database operation failed           |
| `AI_SERVICE_ERROR`    | 502         | AI provider returned an error       |
| `AI_TIMEOUT`          | 504         | AI provider did not respond in time |
| `SERVICE_UNAVAILABLE` | 503         | Service is temporarily unavailable  |

---

## Error Handling Principles

1. **Never expose internal details** — Stack traces, SQL queries, and internal paths are never included in error responses
2. **Always actionable** — Error messages tell the user what to do to fix the problem
3. **Consistent format** — Every error follows the same structure
4. **Logged internally** — All 5xx errors are logged with full context for debugging
5. **Correlated** — `requestId` enables tracing through the entire request lifecycle

---

## Client-Side Error Handling

```typescript
// Recommended client-side pattern
try {
  const response = await api.entries.create({ content });
  // handle success
} catch (error) {
  if (error.code === "TOKEN_EXPIRED") {
    await refreshToken();
    // retry
  } else if (error.code === "VALIDATION_ERROR") {
    showFieldErrors(error.details);
  } else {
    showGenericError(error.message);
  }
}
```

---

> _Error handling will be implemented as a shared middleware in the API server._
