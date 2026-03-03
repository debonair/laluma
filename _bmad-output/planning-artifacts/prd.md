---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
classification:
  projectType: Mobile-first social community platform (Capacitor web/mobile + Node.js API)
  domain: Consumer Social / Community Safety Platform / FemTech
  complexity: High — driven by trust, psychological safety requirements, and trauma-informed design constraints
  projectContext: Brownfield — La Luma is a brand and identity transformation of the existing Luma platform
  workstreams:
    - Adapt existing features (auth, groups, feed, messaging, content, directory, subscriptions)
    - Build Luma Spaces from scratch (greenfield, highest build risk)
  keyConstraints:
    - Trauma-informed design is a first-class product requirement
    - Community safety and psychological safety drive architecture decisions
    - Content, copy, and community policy work is ~60% of total effort
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-luma-2026-03-02.md
  - _bmad-output/project-context.md
  - docs/index.md
  - docs/project-overview.md
  - docs/architecture-backend.md
  - docs/architecture-frontend.md
  - docs/data-models.md
  - docs/api-contracts.md
  - docs/source-tree-analysis.md
  - docs/development-guide.md
  - docs/deployment-guide.md
  - docs/integration-architecture.md
workflowType: 'prd'
---

# Product Requirements Document — La Luma

**Author:** Duma
**Date:** 2026-03-02

> **How to use this document:** This PRD is the source of truth for La Luma MVP. Any capability not listed in the Functional Requirements section is out of scope. Feature requests must be added here before implementation begins. The Functional Requirements are the binding capability contract for UX design, architecture, and engineering.

---

## Executive Summary

*"La Luma is the place where you don't have to be strong."* Single mothers hold everything together for their children, their employers, their families. La Luma is the one environment built around the assumption that her strength is real — and her complexity deserves a dedicated home.

La Luma is the world's first purpose-built digital ecosystem exclusively for single mothers — a community safety platform that treats single motherhood as a primary identity rather than a demographic subset. It combines safe community spaces, location-based connection, curated real-world events (Luma Spaces), and aligned brand partnerships into one integrated platform.

La Luma addresses a failure of the existing market: platforms like Peanut serve broad motherhood without acknowledging the distinct emotional, financial, and social realities of solo parenting. Single mothers represent a high-need, high-engagement demographic that no dedicated global platform currently serves. La Luma fills that gap.

**The founding insight** is emotional rather than technical: single mothers are not underserved because the technology doesn't exist — they're underserved because no platform has treated their lived experience as worth centering.

**Timing rationale:** Heightened economic pressure and fragmented social infrastructure for single-parent households have created an acute, unmet need for dedicated community infrastructure — at exactly the moment digital platforms have the capability to serve it properly.

**Commercial model:** Safety → Community → Commerce. Brand partnership features are gated behind verified community establishment — no sponsored content appears until community health metrics are met. This is not an advertising platform with a community layer; it is a community platform with a commercially valuable audience.

---

### What Makes This Special

La Luma's differentiator is identity ownership — it is the only platform where a single mother does not have to explain, justify, or contextualise her circumstances. She arrives as herself.

**Key differentiators vs. existing platforms:**
- Only platform that treats single motherhood as a first-class identity (not a segment)
- Moves beyond social networking into practical infrastructure: events, curated local services, aligned brand value
- Identity-based belonging produces higher retention and deeper loyalty than interest-based matching
- Luma Spaces provides a physical-world touchpoint no digital-only competitor can replicate
- Safety → Community → Commerce sequence is a product rule, not just a philosophy

**Retention driver:** Identity recognition, not habit. She stays because La Luma is the only context in her life where her reality is treated as normal.

**Foundation:** A functional prototype has been built and validated with co-founders and early users, establishing proof of concept and generating initial product feedback before structured product development begins.

---

## Project Classification

| Dimension | Classification |
|---|---|
| **Project Type** | Mobile-first social community platform — Capacitor iOS/Android + React web app, Node.js/Express API |
| **Domain** | Consumer Social / Community Safety Platform / FemTech |
| **Complexity** | High — trauma-informed design is a first-class constraint; community safety requirements drive architecture; real-time features (Socket.io); dual workstream delivery |
| **Project Context** | Brownfield — existing prototype repositioned as La Luma; ~60% effort is content, copy, community policy, and design reframing; ~40% is code |
| **Workstream 1** | Adapt: auth/identity, groups, feed, content, messaging, directory, subscriptions, notifications |
| **Workstream 2** | Build: Luma Spaces — event discovery, registration, attendance, sponsor integration (greenfield; highest build risk) |

---

## Success Criteria

### User Success

**Behavioural indicators:**
- Returns 2–3 times per week without a specific prompt
- Reads or interacts with 3–5 posts within first 7 days
- Posts, comments, or reacts at least once in first week
- Joins one relevant sub-group within onboarding
- Attends or registers for a Luma Spaces event within 30 days
- Refers at least one other single mother within 90 days

**Aha moment (measurable):** ≥70% of first-cohort users report feeling "understood or seen" within their first 7 days — measured via post-onboarding survey at day 7.

---

### Business Success

| Horizon | Target | Signal |
|---|---|---|
| **3 months** | 500–1,000 registered users | Product-market fit validation |
| **3 months** | 30–40% weekly active rate | Engagement over acquisition |
| **3 months** | 1–2 Luma Spaces events (50–100 attendees each) | Format validated |
| **3 months** | 1–2 brand partners signed | Revenue model activated |
| **3 months** | 10–15% word-of-mouth referral rate | Community trust present |
| **12 months** | 5,000–10,000 registered users | Growth path confirmed |
| **12 months** | 35–45% monthly active rate | Stickiness established |
| **12 months** | 5–10 recurring brand partners | Revenue diversified |

**Investor milestone:** Demonstrable community health metrics combined with 1 confirmed brand partnership by month 3 form the core fundraising narrative for seed/angel stage.

---

### Technical Success

- Platform stable under concurrent real-time load (Socket.io messaging and notifications)
- Community safety SLA: **2-hour first-response** for flagged content; **24-hour resolution** — achievable with manual moderation at MVP scale
- Content and copy reframing complete across all user-facing surfaces before launch
- Luma Spaces delivers event discovery, registration, and attendance tracking as a coherent end-to-end user flow
- Zero critical community safety incidents attributable to platform failure in first 90 days

---

### Measurable Outcomes

| Metric | Target | Method |
|---|---|---|
| Month-one retention | ≥30% | Users returning after day 0–7 |
| Comment-to-post ratio | Active (>1.0) | Feed analytics |
| Aha moment validated | ≥70% of first cohort | Day-7 post-onboarding survey |
| Word-of-mouth recommendation score | ≥40 (first cohort) | Post-onboarding survey |
| Brand partner renewal | ≥80% at 6 months | Partnership renewal rate |
| Moderation first response | ≤2 hours | Incident log |

---

## Product Scope

> For strategic rationale, risk context, and phased roadmap detail — see [Project Scoping & Phased Development](#project-scoping--phased-development) below.

### MVP — Minimum Viable Product

**Workstream 1 — Adapt:** Auth/identity, groups, feed, content, messaging, directory, subscriptions, notifications — all copy, policy, and UX reframed for single mothers.

**Workstream 2 — Build:** Luma Spaces — lightweight event listing, registration, attendance tracking. No full ticketing in MVP.

**Excluded:** Marketplace, brand self-serve portal, multi-language localisation, automated moderation.

---

### Growth Features (Post-MVP)

- Full Luma Spaces ticketing and in-platform payments
- Brand partner self-serve portal with campaign management
- AI-assisted content moderation
- Multi-language and regional localisation
- Mentorship matching layer

---

### Vision (Future)

- Global event calendar with local chapters and hybrid format
- Financial empowerment tools and curated service partnerships
- Research and advocacy platform generating single-mother insights
- Community-led governance model

---

## User Journeys

### Journey 1 — Nadia: New Arrival (Primary User — Happy Path)

**Who she is:** Nadia, 34. Separated eight months ago after a 9-year relationship. Two children: 7 and 4. Works part-time in admin. Has a small family network but hasn't told most friends the full story yet.

**Opening scene:** 11pm. Kids are asleep. Nadia types "support for single mums" into a search bar for the third time this week. She finds La Luma referenced in a forum thread: *"It's the only place I've ever felt like I didn't have to explain myself."*

**Rising action:** She creates a profile. Onboarding doesn't ask how she became a single mother — it asks where she is in her journey. She selects "newly navigating this." Before her feed loads, she sees a warm guided screen: *"Start here — here are three groups where women like you are talking right now."* She joins two. Within 20 minutes she reads a post that lifts something off her chest she didn't know she was carrying.

**Climax:** She replies for the first time. Three women respond. Not with advice. With recognition. She registers for a Luma Spaces coffee morning — the first social event she's booked since the separation.

**Resolution:** At day 7, she answers a survey: *"Do you feel understood here?"* She selects: *Yes, completely.* She has returned every day this week.

**Capabilities revealed:** Identity-safe onboarding, life-stage selection, warm guided empty state (surfaces 3 relevant groups pre-feed), location-based group discovery, real-time comments and reactions, Luma Spaces event discovery + registration, day-7 survey trigger.

---

### Journey 2 — Sarah: Safety Test (Primary User — Edge Case)

**Who she is:** Sarah, 41. Five years solo parenting, highly active La Luma member and community contributor.

**Opening scene:** Sarah scrolls her feed and encounters a post with a subtle shaming tone toward mothers who use childcare. She hits Report.

**Rising action:** The UI confirms: *"Flagged for review — we'll respond within 2 hours."* The AI sentiment pipeline (third-party API) has already flagged the post at time of publishing and placed it in the moderation queue before Sarah's report arrived.

**Climax:** Internal team reviews: AI flag + user report + full context. Post removed. Sarah notified: *"The post you reported has been reviewed and removed. Thank you for helping keep this community safe."*

**Resolution:** Trust goes up. Community feels safer because the system acted — visibly and within SLA.

**Capabilities revealed:** Content reporting flow, AI sentiment API flag on publish, moderation queue, 2-hour SLA, reporter notification on resolution, audit trail.

---

### Journey 3 — The Moderation Team: AI-Assisted Review (Internal Operations)

**Who they are:** La Luma's internal moderation team working alongside an AI sentiment layer.

**AI approach (MVP):** Third-party sentiment API (Perspective API or AWS Comprehend) — faster to integrate, sufficient for text-based content at MVP scale. Custom model is Phase 2.

**Opening scene:** 12 items in the review queue. Seven flagged by AI overnight. Five user-reported.

**Rising action:** Moderator opens first AI-flagged item. System shows: post text, sentiment score, triggering phrases, flag category. Post is borderline — person in distress, not attacking. Decision: *"No action — watchlist."* AI learns from decisions over time. Next item: unapproved service promotion. Removed with a private message directing to brand partnership channels.

**Resolution:** Queue cleared within SLA. Moderation report logs AI accuracy rate, actions taken, and patterns for editorial review.

**Capabilities revealed:** Third-party AI sentiment API integration, moderation queue dashboard, AI flag reason + confidence score, moderator decision workflow (action types), watchlist/escalation, moderation audit log, SLA tracking, AI feedback loop.

---

### Journey 4 — Marcus at BabyGold: Brand Partner Activation

**Who he is:** Marcus, partnerships lead at a quality children's clothing brand. He applies expecting a sales process. He gets vetted instead.

**Rising action:** Application accepted. Activation designed: 20% discount code, a sponsored post written by La Luma's editorial team, and event sponsorship. Marcus submits initial content brief. Editorial team responds: *"The headline implies urgency-purchasing — that doesn't fit our community tone. Here's what would work better."*

**Branch — rejection-recovery:** The feedback is specific and transparent — not a rejection, a redirection. Marcus revises. The content is approved. The revised post outperforms the original would have.

**Resolution:** At 6 months, Marcus renews. *"They made us better at communicating with this audience."* The editorial-standards-maintained, partner-not-alienated trust loop is complete.

**Capabilities revealed:** Partnership inquiry form, brand vetting workflow, brand partner portal (lightweight MVP), content submission + editorial review + revision flow, sponsored content publishing, discount code distribution, Luma Spaces sponsor integration, partner performance reporting.

---

### Journey Requirements Summary

| Capability | Revealed By |
|---|---|
| Identity-safe onboarding + life-stage selection | J1 |
| Warm guided empty state (3 group suggestions) | J1 |
| Location-based group discovery | J1 |
| Real-time commenting and reactions | J1 |
| Luma Spaces event discovery + registration | J1, J4 |
| Day-7 post-onboarding survey | J1 |
| Content reporting flow | J2 |
| AI sentiment API (Perspective API / AWS Comprehend) — MVP | J2, J3 |
| 2-hour moderation SLA | J2, J3 |
| Reporter notification on resolution | J2 |
| Moderation queue + decision workflow | J3 |
| AI flag reason + confidence score | J3 |
| Moderation audit log + SLA tracking | J3 |
| Partnership inquiry + brand vetting | J4 |
| Content submission + editorial review + revision flow | J4 |
| Sponsored content publishing | J4 |
| Discount code distribution | J4 |
| Partner performance reporting | J4 |

---

## Domain-Specific Requirements

### Legal Prerequisites (Launch Blockers)

- **Community guidelines and terms of service must be drafted, legally reviewed, and published before launch.** These are the foundation of every moderation decision and every user report — without them, enforcement has no basis.

### Privacy & Data Protection

- GDPR compliance required from day one — consent management, right to erasure, data portability
- All user data encrypted at rest and in transit
- No profile data shared with brand partners without explicit consent
- Data processing agreement required with AI moderation API provider; no personally identifiable information sent to AI pipeline
- **Anonymous posting — legal design:** Platform retains a private identity link between anonymous posts and user accounts for safeguarding. Community never sees this link. Legal review of anonymity architecture required before launch

### Community Safety & Duty of Care

- Duty of care extends beyond standard platform liability — design accounts for users in crisis states
- Moderation SLA: 2-hour first response / 24-hour resolution — operationally enforced
- **Keyword pre-filter (server-side, runs on post submission):** Synchronous blocklist for severe content categories before async AI sentiment check; prevents worst-case content appearing during the 5-second async window
- Safeguarding escalation protocol + crisis resource signposting required in MVP
- Zero-tolerance policy for predatory behaviour, solicitation, or commercial exploitation — enforceable at platform level

### Community Integrity & Access

- Community integrity maintained through identity specificity, not formal verification — the platform's voice, content, and norms are the gatekeeping mechanism
- Community reporting + moderator review handles edge cases
- Formal KYC out of scope for MVP and incompatible with the platform's privacy values

### Brand Partner Compliance

- Sponsored content labelled per UK ASA advertising standards
- No brand content published without editorial approval — contractually and operationally enforced
- Partner performance data aggregated and anonymised — no individual user data

### Technical Constraints

- WebSocket infrastructure (Socket.io) scalable under concurrent load
- AI sentiment API asynchronous — post visible immediately, flag applied within 5 seconds
- Safety incident records retained minimum 3 years or as required by applicable law
- All moderation decisions logged with timestamps for audit

### Integration Requirements

- Third-party AI sentiment API (Perspective API or AWS Comprehend) — data processing agreement required
- Stripe — subscriptions (MVP), event ticketing (Phase 2)
- Push notifications — FCM/APNs
- Crisis resource signposting — external links (MVP), in-platform (Phase 2)

### Risk Mitigations

| Risk | Mitigation |
|---|---|
| Bad-faith community access | Identity-specific design + community reporting + moderator review |
| Brand partner damages trust | Editorial vetting + content approval + code of conduct in contract |
| AI over-flags sensitive content | Human review of all flags + feedback loop |
| GDPR breach via AI processing | DPA with provider + no PII in AI pipeline |
| Anonymous post creates safeguarding gap | Platform identity link retained; legal review before launch |
| Member in crisis | Keyword pre-filter + crisis resource signposting + escalation path |
| Over-retention of data | Safety records 3 years min; general content per GDPR |

---

## Innovation & Novel Patterns

### Detected Innovation Areas

**1. Identity-first niche community design**
La Luma challenges the dominant assumption of social platforms: that a broad audience is more valuable than a deep one. Aggregating around primary life identity — rather than interest or geography — is genuinely rare at platform level. The bet is that identity-depth creates engagement and retention that interest-breadth cannot match.

**2. The digital-to-physical bridge (Luma Spaces)**
Luma Spaces bridges the online community and real-world connection through trust-filtered events. The UX innovation: **event safety is a product feature, not an assumption.** A member's safety is established before she walks in the door — because she's already part of a vetted community. The journey starts when she joins La Luma, not when she arrives at the coffee morning.

**3. Moderation SLA as a public brand promise**
La Luma makes its moderation response time a visible commitment to members — a publicly communicated SLA. Most platforms moderate quietly and never report response times. Making the 2-hour first-response SLA visible positions moderation as a trust product, not a compliance cost.

**4. Safety → Community → Commerce flywheel**
The commercial model inverts the standard ad-tech sequence. La Luma builds community trust first, then gates commercial access behind that trust — making the audience more valuable to brand partners (verified engagement, not impressions) while protecting the community from the degradation that ad-first models cause.

**5. Relationship-based commercial model**
Hand-selected partners, editorially controlled content, performance measured by redemption and renewal rather than CPM impressions. The model is viable at 50,000 deeply engaged users — profitability is decoupled from volume. This is a structural commercial innovation.

---

### Market Context & Competitive Landscape

| Competitor | What they do | What La Luma does differently |
|---|---|---|
| Peanut | Broad motherhood community | Single-mother identity is primary, not a segment |
| Meetup | Event discovery | Events trust-filtered through established community |
| Facebook Groups | Interest-based community | Identity-based, curated, safety-designed |
| Generic forums | Anonymous peer support | Named community with design-based integrity |

No competitor combines identity-specific community + trust-filtered physical events + relationship-based brand partnerships + visible moderation SLA in one platform.

---

### Validation Approach

| Innovation | Validation Signal |
|---|---|
| Identity-first community | Day-7 belonging survey ≥70%; 3-month retention vs. benchmark |
| Luma Spaces physical bridge | Event attendance rate; % online members attending offline; repeat rate |
| Moderation SLA as brand promise | Community trust survey; reporter satisfaction post-resolution |
| Safety → Commerce flywheel | Brand partner renewal at 6 months; sponsored content engagement vs. benchmark |
| Relationship-based commercial model | Revenue per user vs. ad-supported benchmarks; partner renewal rate |

---

### Risk Mitigation

| Innovation Risk | Mitigation |
|---|---|
| Identity-first niche too small | Revenue diversified across subscriptions, events, partnerships |
| Luma Spaces doesn't scale | Launch 1–2 cities; validate format before expansion |
| Commerce layer breaks trust | Safety → Community → Commerce enforced as product rule |
| Public SLA creates liability | SLA is operational target, not contractual guarantee; performance logged |
| Relationship model requires editorial resource | Brand vetting reduces revision cycles; editorial team is core operational cost |

---

## Mobile-First Community Platform — Technical Requirements

### Platform Architecture

- Mobile-first: iOS + Android via Capacitor; web app as secondary surface
- API-first: RESTful + WebSocket API; mobile and web are both consumers
- Real-time: Socket.io for messaging, notifications, feed updates
- Auth: JWT + refresh tokens; Google/Apple social login supported

### Mobile-Specific Requirements

- Push notifications: FCM (Android) + APNs (iOS). Delivery reliability monitored post-launch. **If below 85%, Flutter native app is the preferred resolution — ahead of a native bridge workaround.**
- Offline-tolerant: feed and group content cached locally; graceful degradation when offline
- Deep linking: notifications and shared links route to specific posts, events, groups
- App store compliance: content moderation policy documented for iOS/Android submission
- Permissions: camera (profile/images), notifications, location (optional, local discovery)

### API Design

- RESTful CRUD endpoints: users, groups, posts, events, partnerships
- WebSocket events: new messages, new posts in followed groups, moderation actions, event updates
- Pagination: cursor-based for feeds; **cursor is server-side generated and opaque to clients** (prevents manipulation, ensures cross-session consistency)
- File uploads: multipart to signed URLs → direct-to-cloud (S3/R2)
- API versioning: `v1` prefix from day one

### Permissions & Role Matrix

| Role | Community | Moderation | Events | Brand Portal |
|---|---|---|---|---|
| **Member** | Post, comment, react, report | Report only | Register, attend | View sponsored content |
| **Moderator** | All member actions | Review, action, escalate | Create, manage | — |
| **Editorial** | — | — | — | Review, approve, publish |
| **Admin** | All | All | All | All |
| **Brand Partner** | — | — | Sponsor events | Submit (max 2 active), view analytics |

MVP brand partner limit: 2 active submissions per partner — protects editorial pipeline at launch.

### Content & Feed Architecture

- **Chronological feed — deliberate trust design decision.** Members can predict what they'll see. Algorithmic ranking only introduced if community health research demonstrates it improves belonging outcomes, not engagement metrics.
- Anonymous posts: server-side identity link maintained; never exposed to community
- AI sentiment API called asynchronously on every post submission; result updates moderation queue within 5 seconds
- Keyword blocklist checked synchronously on post submission (server-side) before write to database

### State Management

- Refresh token in secure storage; session persistent across restarts
- Optimistic UI for post submission; rollback on API failure
- Notification badge synced in real-time via WebSocket

### Testing Requirements

- Unit: auth, groups, posts, moderation pipeline
- Integration: AI sentiment flagging pipeline
- E2E: onboarding, post creation, report + moderation, event registration
- Device coverage: iOS latest + -1, Android latest + -1, mobile web (Chrome, Safari)

### Growth Roadmap — Native Flutter App

**Flutter native app (Growth / Phase 2):** Replaces Capacitor WebView wrapper. Eliminates bridge reliability issues for push notifications and improves feed scroll performance. Requires dedicated Flutter/Dart engineering capacity — not compatible with current web-first team composition. Prioritise after product-market fit is validated.

---

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Community validation MVP — prove resonance and belonging before scaling reach or commerce.

**MVP goal:** 500–1,000 members who say *"I belong here"* + 1 brand partner who renews.

**Resource requirements:** 2–3 fullstack engineers (Node.js + Capacitor), 1 product/editorial lead, 1 community manager, 1 part-time moderation. Legal adviser for community guidelines + GDPR review.

**Pre-launch prerequisites:**
- Community guidelines + terms of service drafted and legally reviewed
- AI moderation API DPA signed before any real user data is processed — plan 4–6 weeks lead time
- Pre-launch cohort of 50–100 women recruited via co-founder network and single-mother communities; warm community must exist when first public users arrive

---

### Phase 1 — MVP: Prove Resonance

**Core journeys supported:** Nadia (new arrival), Sarah (safety test), moderation team (AI-assisted review)

**Must-have capabilities:**
- Identity-safe onboarding + life-stage selection + warm guided empty state
- Community groups (post, comment, react, join)
- Chronological group-filtered feed (intentionally not algorithmic)
- Anonymous posting with server-side identity link
- Direct messaging
- Content reporting + AI sentiment flagging + keyword pre-filter + moderation queue
- Luma Spaces: event listing, registration, attendance tracking
- Brand partner: inquiry form, content submission + editorial review, discount code distribution (max 2 active submissions per partner)
- Subscriptions (basic tier)
- Push notifications (FCM/APNs via Capacitor)
- Day-7 belonging survey

**Excluded from MVP:** Full ticketing/payments, brand self-serve portal, automated moderation decisions, multi-language, marketplace

**Launch approach:** Controlled — first cohort small and managed; scale only after moderation SLA is consistently met

---

### Phase 2 — Growth: Prove Scale

- Full Luma Spaces ticketing + Stripe payments
- Brand partner self-serve portal with campaign management
- Flutter native app — improves push reliability and scroll performance
- Advanced moderation tooling with AI feedback loop
- Mentorship matching layer
- Multi-city Luma Spaces expansion
- Enhanced analytics and brand partner performance dashboard

---

### Phase 3 — Expansion: Prove Vision

- Global event calendar with local chapters
- Financial empowerment tools + curated service partnerships
- Research and advocacy platform
- Community-led governance model
- In-platform crisis resource integration

---

### Risk Mitigation

| Risk | Mitigation |
|---|---|
| Empty platform at launch | 50–100 pre-launch cohort seeded before public opening |
| Moderation overwhelmed at launch | Controlled launch; scale after SLA consistently met |
| DPA delays AI pipeline | Begin DPA process during build; 4–6 week lead time |
| Push notification unreliability | Monitor from day 1; Flutter native app in Phase 2 if < 85% |
| Brand model doesn't land | 1 partner renewal = MVP success; Phase 2 gated on this |
| Editorial overload | 2-active-submission cap per partner |

---

## Functional Requirements

**Capability Area Index:**

| Area | FRs |
|---|---|
| 1. Identity & Membership | FR1–FR8 |
| 2. Community & Content | FR9–FR17 |
| 3. Community Safety & Moderation | FR18–FR27 |
| 4. Events (Luma Spaces) | FR28–FR34 |
| 5. Brand Partnerships | FR35–FR40 |
| 6. Subscriptions & Access | FR41–FR43 |
| 7. Notifications & Engagement | FR44–FR49 |
| 8. Administration & Operations | FR50–FR56 |

### 1. Identity & Membership

- FR1: A visitor can create an account using email or social login (Google, Apple)
- FR2: A new member can complete onboarding by selecting their life stage and journey context
- FR3: A new member is presented with 3 recommended groups before their feed loads
- FR4: A member can view and edit their profile
- FR5: A member can post anonymously with platform-level identity retained for safeguarding
- FR6: A member can request deletion of their account and all personal data
- FR7: A member can export their personal data
- FR8: An admin can deactivate or remove a member account

### 2. Community & Content

- FR9: A member can create, read, update, and delete their own posts
- FR10: A member can attach images to posts and comments
- FR11: A member can comment on and react to posts
- FR12: A member can join and leave community groups
- FR13: A member can browse and discover groups beyond their currently joined groups
- FR14: A member can search for groups, posts, or other members
- FR15: A member can view a chronological feed filtered by their joined groups
- FR16: A member can send and receive direct messages with other members
- FR17: An admin or moderator can create community groups; members may propose new groups in Phase 2

### 3. Community Safety & Moderation

- FR18: A member can report a post or comment for guideline violation
- FR19: A member can block or mute another member
- FR20: The system applies a server-side keyword blocklist check on every post before publication
- FR21: The system calls the AI sentiment API asynchronously on every post and surfaces flagged posts in the moderation queue
- FR22: A moderator can view the moderation queue including AI flag reason and confidence score
- FR23: A moderator can remove content, issue warnings, add accounts to a watchlist, or take no action
- FR24: When content is removed, a visible placeholder is shown to group members indicating moderation action
- FR25: A reporter receives a notification when their reported content has been reviewed and resolved
- FR26: All moderation decisions are logged with timestamps and moderator identity for audit
- FR27: A moderator can escalate items to a senior moderator or admin

### 4. Events (Luma Spaces)

- FR28: A member can browse upcoming Luma Spaces events
- FR29: A member can register for a Luma Spaces event
- FR30: A member can join a waitlist for a fully booked event
- FR31: A member can view their registered and waitlisted events
- FR32: A moderator or admin can create, edit, and cancel events
- FR33: A member receives reminders for upcoming registered events
- FR34: A brand partner can be associated as a sponsor of a Luma Spaces event

### 5. Brand Partnerships

- FR35: A prospective brand partner can submit a partnership inquiry via a contact form
- FR36: An admin or editorial team member can approve or reject a brand partnership application
- FR37: An approved brand partner can submit content for editorial review (maximum 2 active submissions)
- FR38: An editorial team member can approve, reject with feedback, or request revision of brand content
- FR39: A brand partner can distribute a discount code to La Luma members
- FR40: An approved brand partner can view aggregated, anonymised performance metrics for their content

### 6. Subscriptions & Access

- FR41: A member can subscribe to a paid tier
- FR42: The system enforces access control based on subscription tier
- FR43: A member can manage and cancel their subscription

### 7. Notifications & Engagement

- FR44: A member receives push notifications for community activity in their groups
- FR45: A member receives push notifications for direct messages
- FR46: A member receives push notifications for moderation resolution (if they reported content)
- FR47: A member receives push notifications for upcoming event reminders
- FR48: A member can configure which categories of notification they receive
- FR49: The system triggers a day-7 post-onboarding survey to active members

### 8. Administration & Operations

- FR50: An admin can view a moderation activity report including AI flag accuracy and SLA performance
- FR51: An admin can export moderation records for compliance or legal review
- FR52: An admin can manage and publish community guidelines
- FR53: The system provides a crisis resource signpost accessible to any member at any time
- FR54: An admin can manage user roles (member, moderator, editorial, partner)
- FR55: An admin can manage brand partner accounts and their active submission quota
- FR56: An admin can publish a system status message visible to all members

---

## Non-Functional Requirements

### Performance

- Feed loads within 2 seconds on a 4G mobile connection
- Standard API responses complete within 500ms under normal load
- Real-time events (messages, notifications) delivered within 1 second via WebSocket
- AI sentiment flag applied to posts within 5 seconds of submission
- Image upload confirmation within 3 seconds; upload may continue asynchronously

### Security

- All user data encrypted at rest (AES-256) and in transit (TLS 1.2+)
- Auth tokens expire and rotate; refresh tokens stored in secure device storage
- Anonymous post identity links stored in an isolated data store, access-controlled to admin and safeguarding roles only
- All API endpoints require authentication; role-based access control enforced at API layer
- OWASP Top 10 addressed in security review before launch
- No personally identifiable information transmitted to third-party AI API
- Data processing agreement in place with all third-party processors before live user data is handled

### Privacy

- **Data minimisation:** collect only the minimum personal data necessary for each function
- **Purpose limitation:** data collected for one purpose is not used for a different purpose without explicit user consent
- These are binding architectural principles, not optional features

### Scalability

- 95th-percentile response times maintained at 10× initial user volume without architectural changes
- WebSocket infrastructure scales with concurrent user base
- Media assets served via CDN; platform traffic not burdened by media delivery
- Database designed for horizontal scaling; connection pooling in place from day one
- Push notification delivery handles burst load during high-engagement events

### Reliability

- Target 99.5% uptime for the first 12 months, excluding scheduled maintenance
- Scheduled maintenance: minimum 48-hour advance notice; no maintenance during peak usage hours
- Moderation queue prioritised during incident response; safety-critical functions take precedence
- Daily automated backups; recovery point objective (RPO) of 24 hours
- Graceful degradation: third-party API failures do not break core community features

### Accessibility

- WCAG 2.1 AA compliance for web application and Capacitor mobile app
- Screen reader compatible — VoiceOver (iOS) and TalkBack (Android)
- Minimum 4.5:1 colour contrast ratio on all UI elements
- No content conveyed by colour alone; all interactive elements have accessible labels
- **Trauma-informed design:** all user-facing language, imagery, and interaction patterns reviewed against trauma-informed design principles before launch

### Internationalisation Readiness

- All user-facing strings externalised and not hardcoded from day one
- Multi-language support is Phase 2; i18n infrastructure must be present in Phase 1
- No retrofitting cost for localisation when Phase 2 begins

### Integration Quality

- AI sentiment API: async and non-blocking; false positive rate target <20% (≥80% of AI flags validated as genuine by human review); persistent breach triggers model or provider review
- FCM/APNs push delivery: failures logged and retried; no silent failure
- Stripe: PCI DSS compliant; card data never touches La Luma servers
- All third-party integrations monitored; degraded state alerted to operations team within 5 minutes of failure
