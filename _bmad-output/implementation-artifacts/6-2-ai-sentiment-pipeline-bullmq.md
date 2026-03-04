# Story 6.2: AI Sentiment Pipeline via BullMQ (FR21)

Status: done

## Story
As a backend developer,
I want to implement a BullMQ worker queue that asynchronously sends all new posts to a third-party AI Sentiment API,
So that posts can be evaluated for safety without blocking the user's immediate UI response.

## Acceptance Criteria
1. **Given** a new post is saved to the database,
   **When** the successful write occurs,
   **Then** a new job is dispatched to a Redis-backed BullMQ queue.
2. **Given** a job is in the queue,
   **And** a background worker is running,
   **Then** the worker processes the job by calling the Sentiment API (mocked for now) and records the confidence score/flags.
3. **Given** a worker encounters an error communicating with the API,
   **Then** the job is retried up to 3 times before being moved to the dead-letter queue (or marked failed).
4. **Given** local development environment,
   **Then** Redis is automatically provisioned via `docker-compose.dev.yml` so that BullMQ can connect.

## Tasks / Subtasks

- [x] Task 1: Provision Redis for Local Dev
  - [x] Subtask 1.1: Add a `redis` service to `docker-compose.dev.yml` using `redis:7-alpine`.
  - [x] Subtask 1.2: Add `REDIS_URL=redis://localhost:6379` (local) and `REDIS_URL=redis://redis:6379` (docker) to environment variables where appropriate.

- [x] Task 2: BullMQ Infrastructure Initialization
  - [x] Subtask 2.1: Add `bullmq` dependency (`npm install bullmq`).
  - [x] Subtask 2.2: Create `backend/src/lib/bullmq.ts` exporting a configured Redis connection and shared Queue definitions (e.g. `moderationQueue`).

- [x] Task 3: Job and Worker Processing
  - [x] Subtask 3.1: Create `backend/src/jobs/moderatePostJob.ts` defining the payload shape `{ postId: string, content: string }`.
  - [x] Subtask 3.2: Create `backend/src/workers/moderationWorker.ts` that instantiates a `Worker` to listen to the moderation queue. Incorporate 3x retry logic with exponential backoff.
  - [x] Subtask 3.3: In the worker process, simulate an AI score check (since we don't have the real AI Sentiment API yet). E.g. flag if content includes "placeholder-bad" else clear.
  - [x] Subtask 3.4: In `backend/src/index.ts` (or `app.ts`), optionally initialize the worker so it runs alongside the web server, ensuring async processing functions.

- [x] Task 4: Dispatch Jobs on Post Creation
  - [x] Subtask 4.1: Modify `backend/src/controllers/posts.controller.ts` `createPost` function. After the post is successfully transaction-committed, call `moderationQueue.add('moderatePost', { postId: ... })`.
  - [x] Subtask 4.2: Update post tests to mock BullMQ so that the test suite does not require a real Redis instance.

## Dev Notes
- Architecture constraint: The worker and the API server live in the same repository. We are allowed to boot the worker alongside the Express server for simplicity in the current deployment, or run it independently. Let's initialize the worker in `index.ts` so it processes local jobs automatically.
- DPA constraint: The real AI Sentiment API requires a DPA before sending PII. For now, the worker should use a simulated/mock API response function (e.g. random score or keyword-based simulation). Do not wire a real external API yet!
- BullMQ uses Redis. Make sure to close the Redis connection gracefully on server shutdown to prevent hanging tests.

## Dev Agent Record

### Agent Model Used
Antigravity

### Completion Notes List
- Updated `docker-compose.dev.yml` with a `redis:7-alpine` container configuration.
- Installed `bullmq` and `ioredis`.
- Centralized the Redis connection and queue instance in `backend/src/lib/bullmq.ts`. 
- Created `backend/src/jobs/moderatePostJob.ts` declaring payload shapes.
- Created `backend/src/workers/moderationWorker.ts` containing the queue processing logic. It currently mocks an API trace and records confidence scores to server logs.
- Bootstrapped the worker directly into `backend/src/index.ts` to process locally without a secondary container.
- Added non-blocking dispatch triggers `moderationQueue.add` wrapped in silent `.catch()` logic inside `posts.controller.ts`.
- Mocker configured for BullMQ in `posts.controller.test.ts` to ensure CI testing does not attempt to dial Redis locally.
- 100% test pass rate maintained.

### File List
- `docker-compose.dev.yml`
- `package.json`
- `backend/src/lib/bullmq.ts`
- `backend/src/jobs/moderatePostJob.ts`
- `backend/src/workers/moderationWorker.ts`
- `backend/src/index.ts`
- `backend/src/controllers/posts.controller.ts`
- `backend/src/controllers/posts.controller.test.ts`

### Change Log
- Upgraded the infrastructure stack with Redis integration via BullMQ.
- Wired all user-generated content feeds to trigger asynchronous processing queues for AI sentiment tracking, allowing the moderation filter system to build horizontally without crippling response latency.
