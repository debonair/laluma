---
stepsCompleted: [1]
inputDocuments: [
  "_bmad-output/planning-artifacts/prd.md",
  "_bmad-output/planning-artifacts/architecture.md",
  "_bmad-output/planning-artifacts/ux-design-specification.md"
]
---

# luma - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for luma, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: A visitor can create an account using email or social login (Google, Apple)
FR2: A new member can complete onboarding by selecting their life stage and journey context
FR3: A new member is presented with 3 recommended groups before their feed loads
FR4: A member can view and edit their profile
FR5: A member can post anonymously with platform-level identity retained for safeguarding
FR6: A member can request deletion of their account and all personal data
FR7: A member can export their personal data
FR8: An admin can deactivate or remove a member account
FR9: A member can create, read, update, and delete their own posts
FR10: A member can attach images to posts and comments
FR11: A member can comment on and react to posts
FR12: A member can join and leave community groups
FR13: A member can browse and discover groups beyond their currently joined groups
FR14: A member can search for groups, posts, or other members
FR15: A member can view a chronological feed filtered by their joined groups
FR16: A member can send and receive direct messages with other members
FR17: An admin or moderator can create community groups; members may propose new groups in Phase 2
FR18: A member can report a post or comment for guideline violation
FR19: A member can block or mute another member
FR20: The system applies a server-side keyword blocklist check on every post before publication
FR21: The system calls the AI sentiment API asynchronously on every post and surfaces flagged posts in the moderation queue
FR22: A moderator can view the moderation queue including AI flag reason and confidence score
FR23: A moderator can remove content, issue warnings, add accounts to a watchlist, or take no action
FR24: When content is removed, a visible placeholder is shown to group members indicating moderation action
FR25: A reporter receives a notification when their reported content has been reviewed and resolved
FR26: All moderation decisions are logged with timestamps and moderator identity for audit
FR27: A moderator can escalate items to a senior moderator or admin
FR28: A member can browse upcoming Luma Spaces events
FR29: A member can register for a Luma Spaces event
FR30: A member can join a waitlist for a fully booked event
FR31: A member can view their registered and waitlisted events
FR32: A moderator or admin can create, edit, and cancel events
FR33: A member receives reminders for upcoming registered events
FR34: A brand partner can be associated as a sponsor of a Luma Spaces event
FR35: A prospective brand partner can submit a partnership inquiry via a contact form
FR36: An admin or editorial team member can approve or reject a brand partnership application
FR37: An approved brand partner can submit content for editorial review (maximum 2 active submissions)
FR38: An editorial team member can approve, reject with feedback, or request revision of brand content
FR39: A brand partner can distribute a discount code to La Luma members
FR40: An approved brand partner can view aggregated, anonymised performance metrics for their content
FR41: A member can subscribe to a paid tier
FR42: The system enforces access control based on subscription tier
FR43: A member can manage and cancel their subscription
FR44: A member receives push notifications for community activity in their groups
FR45: A member receives push notifications for direct messages
FR46: A member receives push notifications for moderation resolution (if they reported content)
FR47: A member receives push notifications for upcoming event reminders
FR48: A member can configure which categories of notification they receive
FR49: The system triggers a day-7 post-onboarding survey to active members
FR50: An admin can view a moderation activity report including AI flag accuracy and SLA performance
FR51: An admin can export moderation records for compliance or legal review
FR52: An admin can manage and publish community guidelines
FR53: The system provides a crisis resource signpost accessible to any member at any time
FR54: An admin can manage user roles (member, moderator, editorial, partner)
FR55: An admin can manage brand partner accounts and their active submission quota
FR56: An admin can publish a system status message visible to all members

### NonFunctional Requirements

NFR1: Feed loads within 2 seconds on a 4G mobile connection
NFR2: Standard API responses complete within 500ms under normal load
NFR3: Real-time events delivered within 1 second via WebSocket
NFR4: AI sentiment flag applied to posts within 5 seconds of submission
NFR5: Image upload confirmation within 3 seconds
NFR6: All user data encrypted at rest (AES-256) and in transit (TLS 1.2+)
NFR7: Anonymous post identity links stored in an isolated data store
NFR8: Role-based access control enforced at API layer (member, moderator, editorial, admin, brand partner)
NFR9: Data minimisation and purpose limitation (GDPR compliance)
NFR10: 95th-percentile response times maintained at 10× initial user volume
NFR11: Target 99.5% uptime for the first 12 months
NFR12: WCAG 2.1 AA compliance for web application and Capacitor mobile app
NFR13: All user-facing strings externalised (i18n infrastructure in Phase 1)

### Additional Requirements

- **Starter Template:** Brownfield platform extending the existing Luma codebase (Node.js/Express, Prisma, React, Vite, Capacitor).
- Must construct an isolated Postgres schema with field-level encryption for anonymous post identity tracking.
- AI Moderation must follow a worker pattern via BullMQ on Redis. Async process distinct from CRUD routes.
- Implement 5-role RBAC extension via Keycloak realm roles.
- Capacitor requires client-side routing.
- Implement React Error Boundaries and localized loading standardizing on React Query for all new modules.
- Content Warnings (trauma-informed design) must use `aria-hidden='true'` for screen reader safety.
- Responsive strategy focuses on Mobile-first with a "Pillar Layout" (600px main content max-width) on desktop.
- Requires Fluid Typography with CSS `clamp()`.

### FR Coverage Map

FR1: Epic 1 - Account Creation/Login
FR2: Epic 1 - Onboarding Journey
FR3: Epic 1 - Warm Empty State
FR4: Epic 1 - Profile Management
FR5: Epic 4 - Anonymous Posting
FR6: Epic 9 - Account/Data Deletion
FR7: Epic 9 - Data Export
FR8: Epic 1 - Admin Account Deactivation
FR9: Epic 3 - Named Post CRUD
FR10: Epic 3 - Media Uploads
FR11: Epic 3 - Commenting and Reactions
FR12: Epic 2 - Group Join/Leave
FR13: Epic 2 - Group Discovery
FR14: Epic 2 - Global Search
FR15: Epic 2 - Chronological Feed
FR16: Epic 5 - Direct Messaging
FR17: Epic 2 - Admin Group Creation
FR18: Epic 6 - Post Reporting
FR19: Epic 6 - Mute/Block Users
FR20: Epic 6 - Keyword Blocklist
FR21: Epic 6 - Async AI Sentiment Flagging
FR22: Epic 6 - Moderation Queue View
FR23: Epic 6 - Moderation Actions
FR24: Epic 6 - Removed Content Placeholder
FR25: Epic 6 - Reporter Notification
FR26: Epic 6 - Moderation Audit Log
FR27: Epic 6 - Moderation Escalation
FR28: Epic 7 - Event Discovery
FR29: Epic 7 - Event Registration
FR30: Epic 7 - Event Waitlist
FR31: Epic 7 - User Event Display
FR32: Epic 7 - Admin Event Management
FR33: Epic 5 - Event Reminders
FR34: Epic 8 - Event Sponsorship
FR35: Epic 8 - Brand Inquiry
FR36: Epic 8 - Application Review
FR37: Epic 8 - Content Submission
FR38: Epic 8 - Editorial Review
FR39: Epic 8 - Discount Distribution
FR40: Epic 8 - Partner Analytics
FR41: Epic 9 - Paid Subscription
FR42: Epic 9 - Access Control (Tiers)
FR43: Epic 9 - Subscription Management
FR44: Epic 5 - Group Push Notifications
FR45: Epic 5 - DM Push Notifications
FR46: Epic 5 - Mod Resolution Push
FR47: Epic 5 - Event Push Reminders
FR48: Epic 5 - Notification Preferences
FR49: Epic 9 - Day-7 Survey
FR50: Epic 6 - Moderation Reporting
FR51: Epic 6 - Record Export
FR52: Epic 6 - Guide Publishing
FR53: Epic 9 - Crisis Signpost
FR54: Epic 1 - Roles Management
FR55: Epic 8 - Partner Quota Management
FR56: Epic 2 - System Status

## Epic List

### Epic 1: Safe Identity & Onboarding 
*Establishes the foundation of the platform: letting women arrive securely, verify their identity context, and safely manage their profile.*
**FRs covered:** FR1, FR2, FR3, FR4, FR8, FR54

### Epic 2: The Core Community (Groups & Feed)
*The heart of La Luma. Allows members to find, join, and engage with location and context-based spaces in a calm, chronological sequence.*
**FRs covered:** FR12, FR13, FR14, FR15, FR17, FR56

### Epic 3: Core Expression (Named Content)
*Allows users to share, read, and reply to named posts.*
**FRs covered:** FR9, FR10, FR11

### Epic 4: Protected Anonymity Engine
*Isolates the technical complexity of the anonymous posting feature securely.*
**FRs covered:** FR5

### Epic 5: Real-Time Connection (Messaging & Notifications)
*Powers horizontal peer-to-peer connection through direct messages and robust push notifications.*
**FRs covered:** FR16, FR33, FR44, FR45, FR46, FR47, FR48

### Epic 6: Moderation & Trust Engine
*Implements the community safety guardrails. Allows members to report issues, automatically blocks severe keywords, and async-processes sentiment to protect the community within SLAs.*
**FRs covered:** FR18, FR19, FR20, FR21, FR22, FR23, FR24, FR25, FR26, FR27, FR50, FR51, FR52

### Epic 7: Luma Spaces (Physical Events)
*Bridges the digital community into the physical world, allowing members to discover, RSVP, and attend safe local events.*
**FRs covered:** FR28, FR29, FR30, FR31, FR32

### Epic 8: Brand Partnership & Lightweight Portal
*Activates the commercial model by allowing vetted partners to sponsor events, distribute offers, and publish editorially approved content without eroding trust.*
**FRs covered:** FR34, FR35, FR36, FR37, FR38, FR39, FR40, FR55

### Epic 9: Ongoing Access & Support
*Handles the financial relationship (subscriptions), GDPR compliance, and ongoing user support (crisis resources, feedback).*
**FRs covered:** FR6, FR7, FR41, FR42, FR43, FR49, FR53

## Epic 1: Safe Identity & Onboarding 
*Establishes the foundation of the platform: letting women arrive securely, verify their identity context, and safely manage their profile.*

### Story 1.1: Database Schema & Keycloak Roles Setup
As a platform administrator,
I want the core identity data models and Keycloak RBAC roles configured,
So that the identity system can support the 5-role permission model and user profile data.

**Acceptance Criteria:**
**Given** an empty or existing Keycloak realm,
**When** the initialization script or Terraform is run,
**Then** the 5 roles (member, moderator, editorial, admin, brand_partner) are created,
**And** the Prisma schema is updated to include a `role` field on the `User` model along with profile fields (`avatar`, `bio`, `displayName`, `lifeStage`, `journeyContext`).

### Story 1.2: User Registration & SSO (FR1)
As a new visitor,
I want to securely create an account using my email or social login (Google/Apple),
So that I can access the La Luma platform.

**Acceptance Criteria:**
**Given** I am an unauthenticated visitor on the native app or web,
**When** I press "Sign in with Google", "Sign in with Apple", or enter my email/password,
**Then** I am authenticated via Keycloak,
**And** a User record is created in the PostgreSQL database via JIT provisioning with the default `member` role,
**And** my secure session (JWT) is established across restarts.

### Story 1.3: Onboarding Journey - Context Selection (FR2)
As a newly registered member,
I want to select my current life stage and journey context during onboarding,
So that my experience is tailored to my specific reality as a single mother.

**Acceptance Criteria:**
**Given** I have just completed registration and have no context fields set,
**When** I load the app for the first time,
**Then** I am routed to a safe, guided onboarding flow,
**And** I can select my "life stage" and "journey context",
**And** I cannot bypass this step, but I can change these settings later in my profile.

### Story 1.4: Warm Empty State & Group Recommendations (FR3)
As a newly registered member completing onboarding,
I want to be presented with 3 recommended groups relevant to my context before my feed loads,
So that I don't face a confusing or empty platform on my first visit.

**Acceptance Criteria:**
**Given** I am completing the final step of the onboarding flow,
**When** I submit my life stage and journey context,
**Then** I see a "Warm Guided Screen" suggesting exactly 3 relevant groups,
**And** I can join them with a single tap,
**And** proceeding past this screen loads my chronological feed populated with those groups' content.

### Story 1.5: Profile Viewing & Editing (FR4)
As a member,
I want to view and edit my profile information (avatar, bio, display name),
So that I can control how I represent myself to the community.

**Acceptance Criteria:**
**Given** I am an authenticated member,
**When** I navigate to the Profile Settings screen,
**Then** I can upload a new avatar image, update my bio, and change my display name,
**And** saving these changes updates my public presence across the platform asynchronously.

### Story 1.6: Admin User Management (FR8, FR54)
As an admin,
I want to be able to deactivate/remove accounts and manage user roles via an admin interface,
So that I can enforce community safety and delegate operational duties.

**Acceptance Criteria:**
**Given** I am authenticated with the `admin` role,
**When** I access the Admin Dashboard -> User Management section,
**Then** I can view a list of all registered users,
**And** I can assign/revoke roles (e.g., promote a member to moderator),
**And** I can deactivate a user account, preventing them from logging in immediately without hard-deleting their data.

## Epic 2: The Core Community (Groups & Feed)
*The heart of La Luma. Allows members to find, join, and engage with location and context-based spaces in a calm, chronological sequence.*

### Story 2.1: Database Schema for Groups & Feed
As a backend developer,
I want to update the Prisma schema for Groups, Post relations, and user memberships,
So that the data layer can support group discovery, joining, and chronological feed queries.

**Acceptance Criteria:**
**Given** the existing database schema,
**When** the migration is run,
**Then** the `Group`, `GroupMembership`, and `Post` models are created/updated,
**And** relations between Users, Groups, and Posts are correctly established.

### Story 2.2: Admin Group Creation (FR17)
As an admin or moderator,
I want to create and configure new community groups via the admin dashboard,
So that members have curated, safe spaces to converse.

**Acceptance Criteria:**
**Given** I am an authenticated admin or moderator,
**When** I navigate to the group management interface and submit a new group's details (name, description, visibility),
**Then** the group is created in the database,
**And** it becomes available for members to discover and join.

### Story 2.3: Group Discovery & Search (FR13, FR14)
As a member,
I want to browse a directory of available groups and search for specific topics/groups,
So that I can find communities relevant to my current reality.

**Acceptance Criteria:**
**Given** I am an authenticated member,
**When** I access the "Discover Groups" section or use the global search bar,
**Then** I see a paginated list of available groups,
**And** searching filters the results accurately by group name or description.

### Story 2.4: Joining & Leaving Groups (FR12)
As a member,
I want to join groups I am interested in and leave groups I no longer want to participate in,
So that I can control which content appears in my personal feed.

**Acceptance Criteria:**
**Given** I am viewing a group's details,
**When** I tap the "Join" or "Leave" button,
**Then** my membership status is immediately updated via optimistic UI,
**And** the backend persists the creation/deletion of my `GroupMembership` record.

### Story 2.5: Chronological Group-Filtered Feed (FR15)
As a member,
I want to view a chronological feed of posts, filtered only to the groups I have joined,
So that my experience is calm, predictable, and free from opaque algorithmic sorting.

**Acceptance Criteria:**
**Given** I am an authenticated member who has joined at least one group,
**When** I view my main home feed,
**Then** I see a list of posts originating *only* from my joined groups,
**And** they are strictly ordered by creation date (newest first),
**And** scrolling to the bottom loads older posts using cursor-based pagination.

### Story 2.6: Real-time Feed Updates
As a member viewing my feed,
I want new posts to appear in real-time without refreshing the page,
So that I feel connected to the active heartbeat of the community.

**Acceptance Criteria:**
**Given** I am viewing my home feed or a specific group feed,
**When** another user publishes a new post in a group I follow,
**Then** I receive a Socket.io event that seamlessly injects the new post at the top of my feed,
**And** a non-intrusive "New posts available" indicator allows me to scroll to view them.

### Story 2.7: System Status Display (FR56)
As a member,
I want to see global system status messages (e.g., "Planned maintenance", "High volume in crisis support"),
So that I am informed about platform operations that might affect my experience.

**Acceptance Criteria:**
**Given** an admin has published an active system status message,
**When** I load any main page of the application,
**Then** I see a dismissed-able banner or prominent indicator containing the message,
**And** its design respects trauma-informed principles (informative, not alarming).

## Epic 3: Core Expression (Named Content)
*Allows users to share, read, and reply to named posts.*

### Story 3.1: Named Post Creation (FR9)
As a member,
I want to create a structured post within a group using my real identity,
So that I can share my experiences or ask questions to the community.

**Acceptance Criteria:**
**Given** I am an authenticated member belonging to a group,
**When** I create a new post with text content and submit it,
**Then** the post is visible in the group feed with my specific display name and avatar,
**And** the post creation adheres to the server-side keyword blocklist check (epic 6 dependency).

### Story 3.2: Media Uploads for Posts/Comments (FR10)
As a member creating a post or comment,
I want to attach images securely,
So that I can share visual context with the community.

**Acceptance Criteria:**
**Given** I am creating a post or comment,
**When** I attach an image file,
**Then** the UI confirms upload initiation within 3 seconds,
**And** the file is uploaded to object storage directly via a signed URL,
**And** the resulting media URL is attached to my post/comment payload.

### Story 3.3: Post Editing & Deletion (FR9)
As a member who has previously posted,
I want to edit the text of my post or permanently delete it,
So that I can correct mistakes or remove content I no longer wish to share.

**Acceptance Criteria:**
**Given** I am viewing a post I authored,
**When** I select "Edit" and update the text,
**Then** the post displays an "(edited)" badge to the community,
**And When** I select "Delete",
**Then** the post and its associated media are soft-deleted from the feed and database.

### Story 3.4: Commenting on Posts (FR11)
As a member,
I want to write replies/comments underneath a post,
So that I can provide support or engage in a discussion.

**Acceptance Criteria:**
**Given** I am viewing a post in my feed,
**When** I submit a text comment,
**Then** the comment appears linearly underneath the post,
**And** the post's comment count is incremented,
**And** the post author receives a notification (Epic 5 dependency).

### Story 3.5: Post and Comment Reactions (FR11)
As a member,
I want to add lightweight reactions (e.g., hearts, "heard") to posts and comments,
So that I can show solidarity without needing to write a full reply.

**Acceptance Criteria:**
**Given** I am viewing a post or comment,
**When** I tap the reaction icon,
**Then** the UI updates optimistically,
**And** the server increments the reaction count for that specific piece of content.

## Epic 4: Protected Anonymity Engine
*Isolates the technical complexity of the anonymous posting feature securely.*

### Story 4.1: Encrypted Anonymous Identity Schema
As a backend developer,
I want to implement the isolated Postgres schema with field-level encryption for tracking anonymous posts,
So that we can retain a court-order-compliant identity link without exposing it to the standard API or database queries.

**Acceptance Criteria:**
**Given** the existing database structure,
**When** the new migration is run,
**Then** a new isolated schema/table is created to link original `userId` to `postId`,
**And** the mapping data is AES-256 encrypted using a secure environment key,
**And** standard Post data payloads returned to clients never contain the original author's identity.

### Story 4.2: Anonymous Post Creation (FR5)
As a member in a vulnerable moment,
I want to publish a post anonymously,
So that I can share something deeply personal without my named profile being attached to it in the community.

**Acceptance Criteria:**
**Given** I am creating a new post,
**When** I select the "Post Anonymously" toggle and submit,
**Then** the UI confirms my explicit consent for anonymous posting,
**And** the server generates a placeholder anonymous avatar and display name (e.g., "[Color] [Noun]"),
**And** the post is published to the feed without exposing my real identity to other members.

### Story 4.3: Anonymous Post UI Rendering
As a member reading the feed,
I want to see anonymous posts clearly distinguished from named posts,
So that I understand the context in which the vulnerability was shared, and the author feels protected.

**Acceptance Criteria:**
**Given** I am viewing the chronological feed,
**When** I encounter a post submitted anonymously,
**Then** the UI distinctly renders the server-generated anonymous avatar (e.g., stylized shapes) and display name,
**And** attempting to tap/click the author's profile does nothing (no profile view exists for anonymous names).

## Epic 5: Real-Time Connection (Messaging & Notifications)
*Powers horizontal peer-to-peer connection through direct messages and robust push notifications.*

### Story 5.1: Direct Messaging Infrastructure (FR16)
As a member,
I want to send private, direct messages to other members,
So that I can build deeper 1-on-1 connections securely.

**Acceptance Criteria:**
**Given** I am viewing another member's named profile,
**When** I tap "Message" and send a text payload,
**Then** a private 1-on-1 thread is created or updated,
**And** the recipient receives the message in real-time if they are online (via Socket.io).

### Story 5.2: Push Notification Foundation (FCM/APNs) (FR44, FR45)
As a mobile app user,
I want to receive reliable push notifications for direct messages and active post updates,
So that I know when someone is reaching out or replying to me while I am not actively in the app.

**Acceptance Criteria:**
**Given** I have granted OS-level notification permissions,
**When** I receive a new DM or a reply to my post,
**Then** a push notification is delivered to my device via Capacitor (using APNs/FCM),
**And** the notification payload strips sensitive group names or specific message content to protect lock-screen privacy.

### Story 5.3: Actionable Notification Deep Linking
As a member receiving a push notification,
I want tapping the notification to open directly to the relevant conversation, post, or event,
So that I don't have to manually search for the context of the alert.

**Acceptance Criteria:**
**Given** I have received a push notification about a specific DM,
**When** I tap the notification from my OS lock screen,
**Then** the La Luma app opens and routes me directly to that specific conversation thread.

### Story 5.4: Notification Preferences & Privacy (FR48)
As a privacy-conscious member,
I want to configure which categories of notifications I receive, AND implicitly know that notification previews won't leak sensitive group details on my lock screen,
So that I can maintain my privacy from people who might see my phone.

**Acceptance Criteria:**
**Given** I am an authenticated member,
**When** I visit my Notification Settings,
**Then** I can toggle pushes off/on granularly for DMs, Groups, Events, and Moderation individually.

### Story 5.5: System & Event Push Notifications (FR33, FR46, FR47)
As a member,
I want to receive push notifications for event reminders and updates on content I reported to the moderation team,
So that I stay informed on crucial logistics and my safety actions.

**Acceptance Criteria:**
**Given** I am registered for an upcoming event OR have reported a post,
**When** the event is 24 hours away OR my report is resolved by a moderator,
**Then** I receive a contextual push notification updating me on the status.

## Epic 6: Moderation & Trust Engine
*Implements the community safety guardrails. Allows members to report issues, automatically blocks severe keywords, and async-processes sentiment to protect the community within SLAs.*

### Story 6.1: Real-Time Keyword Blocklist (FR20)
As a platform administrator,
I want the system to synchronously check new posts against a severe keyword blocklist before saving them,
So that worst-case content never reaches the primary database or feed.

**Acceptance Criteria:**
**Given** a user is submitting a new post or comment,
**When** the payload contains words matching the exact phrases in the blocklist (managed via env or db),
**Then** the server forcefully rejects the request with a descriptive error,
**And** the data is not written to the database.

### Story 6.2: AI Sentiment Pipeline via BullMQ (FR21)
As a backend developer,
I want to implement a BullMQ worker queue that asynchronously sends all new posts to a third-party AI Sentiment API,
So that posts can be evaluated for safety without blocking the user's immediate UI response.

**Acceptance Criteria:**
**Given** a new post is saved to the database,
**When** the successful write occurs,
**Then** a new job is dispatched to a Redis-backed BullMQ queue,
**And** a background worker processes the job by calling the Sentiment API (e.g., AWS Comprehend or Perspective API) and records the confidence score/flags.

### Story 6.3: User Reporting & UI Placeholders (FR18, FR24)
As a member,
I want to report concerning posts/comments and see them instantly hidden from my view,
So that I don't have to keep looking at harmful content while moderation reviews it.

**Acceptance Criteria:**
**Given** I am viewing a post,
**When** I tap "Report" and submit a reason,
**Then** the UI instantly replaces the post with a trauma-informed placeholder stating "You have reported this content. Thank you for keeping the community safe.",
**And** the backend places the item into the moderation queue.

### Story 6.4: Member Mute & Block (FR19)
As a member,
I want to mute or block specific users,
So that I can enforce my personal boundaries and prevent them from contacting me or seeing my named posts.

**Acceptance Criteria:**
**Given** I am viewing another member's profile or post,
**When** I select "Block User",
**Then** their past and future posts disappear from my feed,
**And** they are prevented from sending me Direct Messages.

### Story 6.5: Moderation Queue Dashboard (FR22, FR26, FR50)
As a moderator,
I want a dedicated dashboard showing reported or AI-flagged content (along with AI confidence scores),
So that I can efficiently review incidents and meet the 2-hour SLA.

**Acceptance Criteria:**
**Given** I am authenticated with the `moderator` or `admin` role,
**When** I access the Moderation Dashboard,
**Then** I see an ordered list of flagged items (prioritized by AI severity or user reports),
**And** each item displays the original content, the reporter's reason, and any AI analysis scores.

### Story 6.6: Moderation Actions & Escalation (FR23, FR27)
As a moderator reviewing a flagged post,
I want to apply actions (Remove, Issue Warning, Add to Watchlist) or escalate to an Admin,
So that I can enforce the community guidelines accurately.

**Acceptance Criteria:**
**Given** I am viewing an item in the Moderation Queue,
**When** I select an action like "Remove Content",
**Then** the content is soft-deleted and removed from all community feeds,
**And** it is replaced by an administrative placeholder ("Removed by Moderation") for anyone who had previously seen it.

### Story 6.7: Reporter Notification & Audit Log (FR25, FR51)
As an admin,
I want reporters to be notified when their report is resolved, and for all moderator actions to be logged immutably,
So that we maintain transparency with users and have an audit trail for compliance.

**Acceptance Criteria:**
**Given** a moderator has taken action on a user-submitted report,
**When** the action is saved,
**Then** an audit log record is created capturing the timestamp, moderator ID, and action taken,
**And** the original reporter receives an in-app notification confirming the review is complete.

### Story 6.8: Publishing Community Guidelines (FR52)
As an admin,
I want to manage and publish the central Community Guidelines document from the admin panel,
So that all members have access to the binding rules of the platform.

**Acceptance Criteria:**
**Given** I am authenticated as an `admin`,
**When** I edit and publish the Community Guidelines markdown/text,
**Then** the updated guidelines are immediately reflected on the public and member-facing policy pages.

## Epic 7: Luma Spaces (Physical Events)
*Bridges the digital community into the physical world, allowing members to discover, RSVP, and attend safe local events.*

### Story 7.1: Physical Events Database Infrastructure
As a backend developer,
I want to create the Prisma schemas for Events, Event Registrations, and Waitlists,
So that the system can support event discovery and attendance tracking.

**Acceptance Criteria:**
**Given** the existing database structure,
**When** the migration is run,
**Then** `Event`, `EventRegistration`, and `EventWaitlist` models are created,
**And** geolocation and timing fields are correctly typed and indexed.

### Story 7.2: Admin Event Creation & Management (FR32)
As a moderator or admin,
I want to create, edit, and cancel Luma Spaces events (including capacity limits),
So that I can schedule physical meetups for the community.

**Acceptance Criteria:**
**Given** I am an authenticated admin/moderator,
**When** I complete the event creation form (title, desc, location, time, capacity),
**Then** the event is visible to members immediately or scheduled for publication,
**And** modifying capacity dynamically updates the required registration space.

### Story 7.3: Event Discovery & Browsing (FR28)
As a member,
I want to browse a chronological list or map of upcoming Luma Spaces events,
So that I can find meetups happening in my local area.

**Acceptance Criteria:**
**Given** I am an authenticated member,
**When** I access the "Luma Spaces" tab,
**Then** I see a paginated, date-ordered list of upcoming events,
**And** events that I am already registered for are visually flagged.

### Story 7.4: Event Registration (FR29)
As a member,
I want to register/RSVP for an upcoming Luma Spaces event,
So that I can secure my spot and receive attendance details.

**Acceptance Criteria:**
**Given** an event has available capacity,
**When** I select "Register",
**Then** an `EventRegistration` is created for me,
**And** the remaining capacity of the event decreases by 1,
**And** the UI shows a success state with the event's precise location (which was previously blurred).

### Story 7.5: Event Waitlist Queueing (FR30)
As a member trying to attend a full event,
I want to join a waitlist,
So that I can automatically be offered a spot if another member cancels their registration.

**Acceptance Criteria:**
**Given** an event is at 100% capacity,
**When** I view the event, the "Register" button is replaced by "Join Waitlist",
**Then** clicking it adds me to a sequential queue,
**And** I am informed of my current place in line.

### Story 7.6: "My Events" Dashboard (FR31)
As a member,
I want to view a dedicated list of events I am registered for or waitlisted on,
So that I can easily manage my schedule and access physical event details.

**Acceptance Criteria:**
**Given** I am registered for at least one event,
**When** I access "My Events",
**Then** I see my confirmed upcoming events and my current waitlist positions,
**And** I have the option to easily cancel my registration from this view.

## Epic 8: Brand Partnership & Lightweight Portal
*Activates the commercial model by allowing vetted partners to sponsor events, distribute offers, and publish editorially approved content without eroding trust.*

### Story 8.1: Brand Partner Inquiry Form (FR35)
As a prospective brand partner on the public site,
I want to submit a partnership inquiry form,
So that I can apply to work with the La Luma community.

**Acceptance Criteria:**
**Given** I am an unauthenticated visitor on the La Luma marketing site,
**When** I complete the Brand Inquiry form (Company Name, Contact, Intent, Values alignment),
**Then** my data is saved to the database,
**And** an email notification is sent to the admin/editorial team.

### Story 8.2: Brand Admin Review & Approval (FR36, FR55)
As an admin,
I want to review brand inquiries, approve/reject them, and generate a `brand_partner` Keycloak account upon approval,
So that I gatekeep commercial access and control the partner quota.

**Acceptance Criteria:**
**Given** I am an admin viewing pending inquiries,
**When** I approve a brand,
**Then** a Keycloak account is automatically provisioned with the `brand_partner` role,
**And** an introductory email with login credentials is sent to the brand contact.

### Story 8.3: Partner Dashboard & Content Submission (FR37, FR39)
As an approved brand partner,
I want to log into a lightweight dashboard to submit content drafts and discount codes (max 2 active submissions),
So that I can propose campaigns for the community.

**Acceptance Criteria:**
**Given** I am authenticated as a `brand_partner`,
**When** I log in, I am routed to a specialized Partner Dashboard (not the community feed),
**Then** I can submit a draft post (text, image, optional discount code),
**And** the system prevents me from having more than 2 submissions in the "pending review" state concurrently.

### Story 8.4: Editorial Review Workflow (FR38)
As an editorial team member,
I want to review submitted brand content to approve it, reject it with feedback, or request a revision,
So that no external content is published without meeting our community voice and safety standards.

**Acceptance Criteria:**
**Given** I am authenticated as `editorial` or `admin`,
**When** I review a pending brand submission,
**Then** I can change its status to Approved, Rejected, or Revision Requested,
**And** sending it back for revision appends my editorial notes to the item for the brand partner to see.

### Story 8.5: Sponsoring Luma Spaces (FR34)
As an admin managing events,
I want to assign an approved brand partner as the sponsor of a specific Luma Spaces event,
So that their brand is accurately represented in the event discovery UI.

**Acceptance Criteria:**
**Given** I am editing a Luma Spaces event,
**When** I select an approved brand from a dropdown,
**Then** the event displays "Sponsored by [Brand]" with their provided logo,
**And** the brand gets access to aggregated attendance data post-event.

### Story 8.6: Partner Performance Analytics (FR40)
As a brand partner,
I want to view aggregated, anonymized performance metrics for my approved campaigns (e.g., view counts, link clicks),
So that I understand the ROI of the partnership without infringing on individual user privacy.

**Acceptance Criteria:**
**Given** I have a published sponsored post,
**When** I view its status in my dashboard,
**Then** I see simple aggregate metrics (Total Views, Total Emoji Reactions, Total Link Clicks),
**And** no user demographic or identity data is ever exposed in this view.

## Epic 9: Ongoing Access & Support
*Handles the financial relationship (subscriptions), GDPR compliance, and ongoing user support (crisis resources, feedback).*

### Story 9.1: Stripe Subscription Integration (FR41, FR43)
As a member,
I want to securely subscribe to a paid tier (via Stripe) and manage/cancel my subscription,
So that I change my access level flexibly.

**Acceptance Criteria:**
**Given** I am an authenticated free-tier member,
**When** I access the Subscription Settings and select a paid tier,
**Then** I am routed to a secure Stripe Checkout session,
**And** upon success, my account access level is immediately updated via a Stripe webhook.

### Story 9.2: Membership Tier Access Control (FR42)
As a backend developer,
I want middleware that enforces access control rules based on a user's active Stripe subscription tier,
So that premium features are correctly gated without exposing logic to the client.

**Acceptance Criteria:**
**Given** an API endpoint requires a premium subscription,
**When** a free-tier user attempts to access it,
**Then** the server responds with a 403 Forbidden with a specific `REQUIRES_UPGRADE` code,
**And** the UI intercepts this to show a contextual upgrade prompt.

### Story 9.3: GDPR Account & Data Deletion (FR6)
As a member,
I want to request the complete, permanent deletion of my account and all associated personal data from the settings menu,
So that I can exercise my right to erasure.

**Acceptance Criteria:**
**Given** I am an authenticated member,
**When** I complete the account deletion sequence in settings (with explicit confirmation),
**Then** my Keycloak identity is disabled,
**And** an async job runs that anonymizes my past posts and hard-deletes my profile data and DMs within 30 days.

### Story 9.4: GDPR Data Export Request (FR7)
As a member,
I want to request an export of my personal data,
So that I receive a compiled file (e.g., JSON/ZIP) of my post history and data, fulfilling GDPR data portability laws.

**Acceptance Criteria:**
**Given** I am an authenticated member,
**When** I tap "Request Data Export",
**Then** a background worker compiles my profile, post history, and DM history into a structured file,
**And** sends a secure download link to my registered email address within 24 hours.

### Story 9.5: Day-7 "Aha Moment" Survey Engine (FR49)
As an admin,
I want the system to automatically trigger a short "Belonging Survey" to members precisely 7 days after their first login,
So that we can programmatically measure our primary success metric (community resonance).

**Acceptance Criteria:**
**Given** a member has been registered for exactly 7 days,
**When** they launch the app,
**Then** they are shown a single-question survey dialogue ("Do you feel understood here?"),
**And** their answer is recorded in the database, linked to their cohort date but anonymized from their specific user ID.

### Story 9.6: Universal Crisis Resource Signposting (FR53)
As a member who may be in distress,
I want immediate, visible access to external crisis resources (e.g., hotlines, domestic abuse support) from my profile or settings,
So that I can find immediate professional help if the platform cannot support my current emergency.

**Acceptance Criteria:**
**Given** I am viewing the main navigation menu or settings,
**When** I look for help,
**Then** there is a prominent, un-gated "Crisis Support" button,
**And** tapping it immediately displays a static list of external regional hotlines without requiring an API call.
