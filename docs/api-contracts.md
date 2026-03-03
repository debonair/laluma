# API Contracts — Luma Backend

> **Base URL (dev):** `http://localhost:3000` | **Auth:** Bearer JWT | **Generated:** 2026-03-02

---

## Authentication

All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

Tokens are issued by Keycloak or by the local `POST /api/auth/signin` endpoint.

---

## API Modules

### `/api/auth` — Authentication
Rate-limited with `authLimiter` (stricter than global).

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/signup` | ❌ | Register new user (local) |
| `POST` | `/api/auth/signin` | ❌ | Sign in, receive JWT |
| `POST` | `/api/auth/keycloak-sync` | ✅ Keycloak | JIT Keycloak user provisioning |
| Various | `/api/auth/...` | — | Additional auth endpoints |

**Signup Request:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "displayName": "string?"
}
```

**Signin Response:**
```json
{
  "token": "string (JWT)",
  "user": { "id": "uuid", "email": "...", "role": "user|admin" }
}
```

---

### `/api/users` — User Profiles

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/users/me` | ✅ | Get current user profile |
| `PUT` | `/api/users/me` | ✅ | Update current user profile |
| `GET` | `/api/users/:id` | ✅ | Get user by ID |
| `PUT` | `/api/users/preferences` | ✅ | Update user preferences |
| `POST` | `/api/users/onboarding` | ✅ | Complete onboarding step |
| `POST` | `/api/users/upload-avatar` | ✅ | Upload profile image (Multer) |

---

### `/api/groups` — Community Groups

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/groups` | ✅ | List groups (discovery) |
| `POST` | `/api/groups` | ✅ | Create new group |
| `GET` | `/api/groups/:id` | ✅ | Get group by ID |
| `PUT` | `/api/groups/:id` | ✅ | Update group (admin) |
| `DELETE` | `/api/groups/:id` | ✅ | Delete group (admin) |
| `POST` | `/api/groups/:id/join` | ✅ | Join group |
| `POST` | `/api/groups/:id/leave` | ✅ | Leave group |
| `GET` | `/api/groups/:id/members` | ✅ | List group members |
| Various | `/api/groups/...` | ✅ | Additional group management |

---

### `/api/posts` — Group Posts

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/posts` | ✅ | List posts (with groupId filter) |
| `POST` | `/api/posts` | ✅ | Create post in a group |
| `GET` | `/api/posts/:id` | ✅ | Get post by ID |
| `DELETE` | `/api/posts/:id` | ✅ | Delete post |
| `POST` | `/api/posts/:id/like` | ✅ | Toggle post like |
| `GET` | `/api/posts/:id/comments` | ✅ | List comments on post |
| `POST` | `/api/posts/:id/comments` | ✅ | Add comment to post |

---

### `/api/feed` — Activity Feed

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/feed` | ✅ | Get personalized activity feed (posts from joined groups) |

---

### `/api/content` — My Luma Content

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/content` | 🔓 Optional | List published content (articles, videos, events) |
| `POST` | `/api/content` | ✅ Admin | Create content piece |
| `GET` | `/api/content/:id` | 🔓 Optional | Get content by ID |
| `PUT` | `/api/content/:id` | ✅ Admin | Update content |
| `DELETE` | `/api/content/:id` | ✅ Admin | Delete content |
| `POST` | `/api/content/:id/like` | ✅ | Toggle content like |
| `POST` | `/api/content/:id/bookmark` | ✅ | Toggle content bookmark |
| `GET` | `/api/content/:id/comments` | ✅ | List content comments |
| `POST` | `/api/content/:id/comments` | ✅ | Add comment to content |

**Query Parameters for GET /api/content:**
- `category` — Filter by category
- `type` — `article` \| `video` \| `event`
- `isPremium` — `true` \| `false`
- `isFeatured` — `true` \| `false`

---

### `/api/submissions` — Content Submissions

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/submissions` | ✅ | Submit content for editor review |
| `GET` | `/api/submissions` | ✅ | Get own submissions |
| `GET` | `/api/submissions/admin` | ✅ Admin | List all pending submissions |
| `PUT` | `/api/submissions/:id/approve` | ✅ Admin | Approve and publish submission |
| `PUT` | `/api/submissions/:id/reject` | ✅ Admin | Reject submission with reason |

---

### `/api/subscriptions` — Premium Subscriptions

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/subscriptions/me` | ✅ | Get current user subscription |
| `POST` | `/api/subscriptions` | ✅ | Create/update subscription (Stripe) |
| `DELETE` | `/api/subscriptions` | ✅ | Cancel subscription |
| `GET` | `/api/subscriptions/status` | ✅ | Check subscription status |

---

### `/api/notifications` — Notifications

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | ✅ | Get user notifications |
| `PUT` | `/api/notifications/:id/read` | ✅ | Mark notification as read |
| `PUT` | `/api/notifications/read-all` | ✅ | Mark all notifications as read |

---

### `/api/messages` — Direct Messaging

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/messages/conversations` | ✅ | List user conversations |
| `POST` | `/api/messages/conversations` | ✅ | Start new conversation |
| `GET` | `/api/messages/conversations/:id` | ✅ | Get conversation details |
| `GET` | `/api/messages/conversations/:id/messages` | ✅ | List messages in conversation |
| `POST` | `/api/messages/conversations/:id/messages` | ✅ | Send message |
| `POST` | `/api/messages/conversations/:id/messages/attachment` | ✅ | Send message with file |
| `PUT` | `/api/messages/conversations/:id/read` | ✅ | Mark conversation as read |
| Various | `/api/messages/...` | ✅ | Additional messaging endpoints |

> **Note:** Core messaging is real-time via Socket.io. REST endpoints support history queries and read receipts.

---

### `/api/connections` — User Connections

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/connections` | ✅ | List connections (accepted) |
| `POST` | `/api/connections` | ✅ | Send connection request |
| `GET` | `/api/connections/requests` | ✅ | List pending requests |
| `PUT` | `/api/connections/:id/accept` | ✅ | Accept connection |
| `PUT` | `/api/connections/:id/decline` | ✅ | Decline connection |
| `DELETE` | `/api/connections/:id` | ✅ | Remove connection |

---

### `/api/polls` — Polls

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/polls` | ✅ | Create poll (attached to post or content) |
| `POST` | `/api/polls/:id/vote` | ✅ | Cast vote on poll |
| `GET` | `/api/polls/:id` | ✅ | Get poll with results |

---

### `/api/marketplace` — Marketplace

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/marketplace` | ✅ | List marketplace items (geo-filtered) |
| `POST` | `/api/marketplace` | ✅ | Create listing |
| `GET` | `/api/marketplace/:id` | ✅ | Get listing by ID |
| `PUT` | `/api/marketplace/:id` | ✅ | Update listing (seller only) |
| `DELETE` | `/api/marketplace/:id` | ✅ | Delete listing (seller only) |

---

### `/api/directory` — Local Directory

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/directory` | ✅ | List directory listings (geo-filtered) |
| `GET` | `/api/directory/:id` | ✅ | Get listing details + reviews |
| `POST` | `/api/directory/:id/reviews` | ✅ | Add review to listing |
| `PUT` | `/api/directory/:id/reviews/:reviewId` | ✅ | Update own review |

---

### `/api/admin` — Admin

| Method | Path | Auth | Description |
|---|---|---|---|
| Various | `/api/admin/...` | ✅ Admin | Admin-only management endpoints |

---

## Common Response Formats

**Success:**
```json
{
  "data": { ... },
  "message": "Success message"
}
```

**Error:**
```json
{
  "error": "Error Type",
  "message": "Human-readable message",
  "code": "ERROR_CODE"
}
```

**Pagination (lists):**
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

---

## WebSocket Events (Socket.io)

| Event | Direction | Payload | Description |
|---|---|---|---|
| `join_conversation` | Client → Server | `{ conversationId }` | Join conversation room |
| `send_message` | Client → Server | `{ conversationId, content, attachmentUrl? }` | Send message |
| `mark_read` | Client → Server | `{ conversationId }` | Mark as read |
| `new_message` | Server → Client | `{ message, conversation }` | New message received |
| `conversation:new` | Server → Client | `{ conversation }` | New conversation started |
| `notification` | Server → Client | `{ notification }` | In-app notification |
| `typing` | Client ↔ Server | `{ conversationId, userId }` | Typing indicator |

---

## Health Check

```
GET /health

Response:
{
  "status": "ok",
  "timestamp": "2026-03-02T17:36:41.000Z"
}
```

## Static Files

```
GET /uploads/:filename   — Serve uploaded files (profile images, message attachments)
```
