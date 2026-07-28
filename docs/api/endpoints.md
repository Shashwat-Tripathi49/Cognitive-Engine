# API Endpoints

> Complete endpoint reference organized by resource.

---

## Entries

| Method   | Endpoint                      | Description                          |
| -------- | ----------------------------- | ------------------------------------ |
| `GET`    | `/v1/entries`                 | List entries (paginated, filterable) |
| `POST`   | `/v1/entries`                 | Create a new entry                   |
| `GET`    | `/v1/entries/:id`             | Get a single entry                   |
| `PATCH`  | `/v1/entries/:id`             | Update an entry                      |
| `DELETE` | `/v1/entries/:id`             | Soft-delete an entry                 |
| `GET`    | `/v1/entries/:id/connections` | Get connections for an entry         |
| `GET`    | `/v1/entries/search`          | Semantic search across entries       |

## Tags

| Method   | Endpoint       | Description      |
| -------- | -------------- | ---------------- |
| `GET`    | `/v1/tags`     | List user's tags |
| `POST`   | `/v1/tags`     | Create a new tag |
| `PATCH`  | `/v1/tags/:id` | Update a tag     |
| `DELETE` | `/v1/tags/:id` | Delete a tag     |

## User

| Method   | Endpoint            | Description                   |
| -------- | ------------------- | ----------------------------- |
| `GET`    | `/v1/user/me`       | Get current user profile      |
| `PATCH`  | `/v1/user/me`       | Update profile                |
| `DELETE` | `/v1/user/me`       | Delete account (and all data) |
| `GET`    | `/v1/user/settings` | Get user settings             |
| `PATCH`  | `/v1/user/settings` | Update settings               |

## AI / Intelligence

| Method | Endpoint                           | Description                    |
| ------ | ---------------------------------- | ------------------------------ |
| `GET`  | `/v1/intelligence/digest`          | Get latest cognitive digest    |
| `POST` | `/v1/intelligence/digest/generate` | Trigger digest generation      |
| `GET`  | `/v1/intelligence/patterns`        | Get detected thinking patterns |
| `GET`  | `/v1/intelligence/graph`           | Get knowledge graph data       |

## Auth

| Method | Endpoint            | Description          |
| ------ | ------------------- | -------------------- |
| `GET`  | `/v1/auth/login`    | Initiate OAuth flow  |
| `GET`  | `/v1/auth/callback` | OAuth callback       |
| `POST` | `/v1/auth/refresh`  | Refresh access token |
| `POST` | `/v1/auth/logout`   | Invalidate session   |

## Health

| Method | Endpoint        | Description                   |
| ------ | --------------- | ----------------------------- |
| `GET`  | `/health`       | Health check                  |
| `GET`  | `/health/ready` | Readiness check (includes DB) |

---

> _Detailed request/response schemas for each endpoint will be added as they are implemented. OpenAPI spec will be auto-generated from route definitions._
