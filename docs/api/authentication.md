# Authentication

> Authentication flows, token management, and security practices.

---

## Authentication Methods

| Method             | Use Case                    | Status  |
| ------------------ | --------------------------- | ------- |
| OAuth 2.0 (Google) | Primary sign-up / login     | Planned |
| OAuth 2.0 (GitHub) | Developer-friendly option   | Planned |
| Magic Link (Email) | Passwordless authentication | Planned |
| API Key            | Programmatic access         | Future  |

---

## Auth Flow (OAuth 2.0)

```
1. Client → /auth/login?provider=google → Redirect to Google
2. Google → /auth/callback?code=xxx → Exchange code for tokens
3. Server → Create/update user → Issue JWT + refresh token
4. Client → Store tokens → Attach JWT to requests
```

---

## Token Strategy

| Token         | Type   | Lifetime   | Storage         |
| ------------- | ------ | ---------- | --------------- |
| Access Token  | JWT    | 15 minutes | Memory (client) |
| Refresh Token | Opaque | 30 days    | HttpOnly cookie |

### Access Token Payload

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "iat": 1690502400,
  "exp": 1690503300,
  "iss": "cognitive-engine"
}
```

### Token Refresh Flow

```
1. Access token expires
2. Client sends refresh token to /auth/refresh
3. Server validates refresh token
4. Server issues new access token + rotates refresh token
5. Client receives new tokens
```

---

## Security Measures

| Measure                | Implementation                          |
| ---------------------- | --------------------------------------- |
| Token rotation         | Refresh tokens are single-use           |
| CSRF protection        | SameSite cookies + CSRF tokens          |
| Brute force prevention | Rate limiting on auth endpoints         |
| Session invalidation   | Logout clears all tokens                |
| Suspicious activity    | Alert on login from new device/location |

---

## API Authentication

```http
GET /v1/entries HTTP/1.1
Host: api.cognitive-engine.dev
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

> _Authentication will be implemented in Phase 1, Milestone 1.1._
