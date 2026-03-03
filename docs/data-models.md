# Data Models — Luma

> **Source:** `backend/prisma/schema.prisma` | **Database:** PostgreSQL 15 via Prisma 6 | **Generated:** 2026-03-02

---

## Overview

The Luma database uses **20 PostgreSQL tables** managed by Prisma ORM. The schema is organized around five functional domains:

| Domain | Tables |
|---|---|
| **Users & Auth** | `users`, `user_preferences`, `subscriptions` |
| **Community** | `groups`, `group_members`, `posts`, `comments`, `post_likes` |
| **Content (My Luma)** | `content`, `content_comments`, `content_likes`, `content_bookmarks`, `content_submissions` |
| **Real-time Messaging** | `conversations`, `conversation_participants`, `messages` |
| **Social Graph** | `connections`, `notifications` |
| **Interactive** | `polls`, `poll_options`, `poll_votes` |
| **Marketplace & Directory** | `marketplace_items`, `directory_listings`, `directory_reviews` |

---

## Entity Relationship Summary

```
User ─┬─ UserPreference (1:1)
      ├─ Subscription (1:1)
      ├─ Group[] (created groups)
      ├─ GroupMember[] (joined groups)
      ├─ Post[] (authored posts)
      ├─ Comment[] (authored comments)
      ├─ PostLike[]
      ├─ Content[] (authored content)
      ├─ ContentComment[]
      ├─ ContentLike[]
      ├─ ContentBookmark[]
      ├─ ContentSubmission[]
      ├─ MarketplaceItem[]
      ├─ DirectoryReview[]
      ├─ Notification[] (received)
      ├─ Notification[] (triggered)
      ├─ ConversationParticipant[]
      ├─ Message[] (sent)
      ├─ Connection[] (sent requests)
      ├─ Connection[] (received requests)
      └─ PollVote[]

Group ─┬─ GroupMember[] (via GroupMember)
       └─ Post[]

Post ─┬─ Comment[]
      ├─ PostLike[]
      └─ Poll? (optional)

Content ─┬─ ContentComment[]
         ├─ ContentLike[]
         ├─ ContentBookmark[]
         └─ Poll? (optional)

Poll ─┬─ PollOption[]
      └─ PollVote[]

Conversation ─┬─ ConversationParticipant[]
              └─ Message[]
```

---

## Models — Detail

### User
**Table:** `users` | **PK:** UUID

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | String (UUID) | PK | Auto-generated |
| `keycloakId` | String? | Unique | Links to Keycloak identity |
| `username` | String | Unique, Indexed | Login handle |
| `email` | String | Unique, Indexed | — |
| `passwordHash` | String | — | bcrypt hash |
| `displayName` | String? | — | — |
| `aboutMe` | String? | — | — |
| `motherhoodStage` | String? | — | User persona field |
| `profileImageUrl` | String? | — | — |
| `role` | String | Default: `"user"` | `"user"` \| `"admin"` |
| `isVerified` | Boolean | Default: false | — |
| `verificationMethod` | String? | — | — |
| `hasCompletedOnboarding` | Boolean | Default: false | — |
| `createdAt` | DateTime | Default: now() | — |
| `updatedAt` | DateTime | Auto-update | — |

---

### UserPreference
**Table:** `user_preferences` | **PK:** UUID | **Cascade:** delete with User

| Column | Type | Notes |
|---|---|---|
| `userId` | String (FK) | 1:1 with User |
| `lookingFor` | String[] | User interest tags |
| `locationRadius` | Int | Default: 10 km |
| `locationAnywhere` | Boolean | Ignore distance filter |
| `latitude` / `longitude` | Float? | User location |
| `city` / `country` | String? | — |
| `interestedInEvents` | Boolean | Default: true |
| `interestedInPromos` | Boolean | Default: true |

---

### Group
**Table:** `groups` | **PK:** UUID | **Indexed:** name, lat/lng

| Column | Type | Notes |
|---|---|---|
| `name` | String | Unique |
| `description` | String | — |
| `imageEmoji` / `imageUrl` | String? | Visual representation |
| `createdById` | String? (FK) | SetNull on user delete |
| `memberCount` | Int | Denormalized count |
| `isPrivate` | Boolean | Default: false |
| `latitude` / `longitude` | Float? | Location-based groups |
| `city` / `country` | String? | — |

---

### GroupMember
**Table:** `group_members` | **Unique:** (groupId, userId)

| Column | Type | Notes |
|---|---|---|
| `groupId` | String (FK) | Cascade delete |
| `userId` | String (FK) | Cascade delete |
| `role` | String | `"admin"` \| `"moderator"` \| `"member"` |
| `joinedAt` | DateTime | — |

---

### Post
**Table:** `posts` | **PK:** UUID | **Indexed:** groupId, createdAt

| Column | Type | Notes |
|---|---|---|
| `groupId` | String (FK) | Cascade delete |
| `authorId` | String? (FK) | SetNull on user delete |
| `content` | String | Post body |
| `likesCount` | Int | Denormalized |
| `commentsCount` | Int | Denormalized |
| `isAnonymous` | Boolean | Default: false |

---

### Comment
**Table:** `comments` | **PK:** UUID | **Indexed:** postId

| Column | Type | Notes |
|---|---|---|
| `postId` | String (FK) | Cascade delete |
| `authorId` | String? (FK) | SetNull on user delete |
| `content` | String | — |
| `isAnonymous` | Boolean | Default: false |

---

### PostLike
**Table:** `post_likes` | **Unique:** (postId, userId)

| Column | Type | Notes |
|---|---|---|
| `postId` | String (FK) | Cascade delete |
| `userId` | String (FK) | Cascade delete |

---

### Content (My Luma)
**Table:** `content` | **PK:** UUID | **Indexed:** category, isPremium, status, publishedAt, isFeatured

| Column | Type | Notes |
|---|---|---|
| `title` | String | — |
| `body` | Text | Long form |
| `excerpt` | Text? | — |
| `category` | String | Content category |
| `contentType` | String | Default: `"article"` — `"article"` \| `"video"` \| `"event"` |
| `thumbnailUrl` | String? | — |
| `videoUrl` / `videoDuration` / `videoThumbnail` | String?/Int? | Video metadata |
| `sponsorName` / `sponsorLogoUrl` / `sponsorLink` | String? | Sponsored content |
| `isPremium` | Boolean | Default: false |
| `premiumTier` | String? | Subscription tier gate |
| `discountCode` / `discountValue` | String? | Promo content |
| `eventDate` / `eventLocation` | DateTime?/String? | Event metadata |
| `latitude` / `longitude` | Float? | Geo-tagged content |
| `isFeatured` | Boolean | Default: false |
| `isActive` | Boolean | Default: true |
| `status` | String | `"draft"` \| `"published"` |
| `viewCount` / `likesCount` / `commentsCount` / `bookmarksCount` | Int | Denormalized counts |

---

### ContentComment
**Table:** `content_comments` | **Indexed:** contentId

Same pattern as `Comment` but linked to `Content` not `Post`.

---

### ContentLike / ContentBookmark
**Tables:** `content_likes`, `content_bookmarks` | **Unique:** (contentId, userId)

Interaction tracking for My Luma content.

---

### ContentSubmission
**Table:** `content_submissions` | **Indexed:** userId, status

| Column | Type | Notes |
|---|---|---|
| `userId` | String (FK) | Author |
| `title` | String | — |
| `body` | Text | — |
| `category` | String | — |
| `status` | String | `"pending"` \| `"approved"` \| `"rejected"` |
| `rejectionReason` | Text? | — |
| `approvedContentId` | String? | Links to created Content if approved |

---

### Subscription
**Table:** `subscriptions` | **PK:** UUID | **Unique:** userId | **Indexed:** tier, status

| Column | Type | Notes |
|---|---|---|
| `userId` | String (FK, Unique) | 1:1 with User |
| `tier` | String | `"free"` \| `"premium"` etc. |
| `status` | String | `"active"` \| `"cancelled"` |
| `platform` | String? | `"ios"` \| `"android"` \| `"web"` |
| `stripeCustomerId` | String? | Stripe integration |
| `stripeSubscriptionId` | String? | — |
| `currentPeriodStart/End` | DateTime? | — |
| `cancelAtPeriodEnd` | Boolean | Default: false |

---

### Notification
**Table:** `notifications` | **Indexed:** userId, isRead

| Column | Type | Notes |
|---|---|---|
| `userId` | String (FK) | Recipient |
| `actorId` | String? (FK) | Who triggered |
| `type` | String | `"like"` \| `"comment"` \| `"system"` \| `"reply"` |
| `message` | String | Text content |
| `isRead` | Boolean | Default: false |
| `metadata` | Json? | Related entity IDs |

---

### Conversation / ConversationParticipant / Message
**Tables:** `conversations`, `conversation_participants`, `messages`

Real-time direct messaging system:
- `Conversation` is a container for messages between participants
- `ConversationParticipant` links users to conversations (with `lastReadAt`)
- `Message` stores individual messages with optional attachment support
  - `attachmentUrl` + `attachmentType` fields for file uploads

---

### Connection
**Table:** `connections` | **Unique:** (requesterId, recipientId) | **Indexed:** both sides

| Column | Type | Notes |
|---|---|---|
| `requesterId` / `recipientId` | String (FK) | Both cascade delete |
| `status` | String | `"pending"` \| `"accepted"` \| `"declined"` |

---

### Poll / PollOption / PollVote
**Tables:** `polls`, `poll_options`, `poll_votes`

Polls can be attached to either `Post` or `Content` (OR relationship, not both):
- `Poll.postId` (optional, unique)
- `Poll.contentId` (optional, unique)
- One vote per user per poll: `PollVote` unique on (pollId, userId)

---

### MarketplaceItem
**Table:** `marketplace_items` | **Indexed:** lat/lng

| Column | Type | Notes |
|---|---|---|
| `sellerId` | String (FK) | Cascade delete |
| `title` / `description` | String | — |
| `price` | Float | Default: 0 |
| `condition` | String | Item condition |
| `category` | String | — |
| `latitude` / `longitude` | Float | Location required |
| `status` | String | `"available"` \| `"sold"` |

---

### DirectoryListing / DirectoryReview
**Tables:** `directory_listings`, `directory_reviews`

Local service directory with geo-indexing:
- `DirectoryListing` has indexed lat/lng for proximity search
- `DirectoryReview` links user to listing with integer rating + text content

---

## Migration History

Migrations are stored in `backend/prisma/migrations/` (6 migration files).

Common Prisma commands:
```bash
npx prisma migrate dev --name <name>   # Create new migration
npx prisma migrate deploy              # Apply to production
npx prisma migrate reset               # Reset (dev only!)
npx prisma generate                    # Regenerate Prisma client
npx prisma studio                      # Visual DB browser
```
