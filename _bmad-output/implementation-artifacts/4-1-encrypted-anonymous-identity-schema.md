# Story 4.1: Encrypted Anonymous Identity Schema

Status: done

## Story
As a backend developer,
I want to implement the isolated Postgres schema with field-level encryption for tracking anonymous posts,
So that we can retain a court-order-compliant identity link without exposing it to the standard API or database queries.

## Acceptance Criteria
1. **Given** the existing database structure,
   **When** the new migration is run,
   **Then** a new isolated schema/table is created to link original `userId` to `postId`,
   **And** the mapping data is AES-256 encrypted using a secure environment key,
   **And** standard Post data payloads returned to clients never contain the original author's identity.

## Tasks / Subtasks
- [x] Task 1: Database Schema Updates
  - [x] Subtask 1.1: Create `AnonymousPostLink` model in Prisma.
  - [x] Subtask 1.2: Add relation mapping encrypted user identity.
- [x] Task 2: Service Layer for Encryption
  - [x] Subtask 2.1: Add encryption/decryption utilities using `crypto` module.
  - [x] Subtask 2.2: Ensure the encryption key is loaded from `.env`.
- [x] Task 3: Unit Testing
  - [x] Subtask 3.1: Write tests for the crypto utility service.

## Dev Notes
- We want to avoid putting this identity directly in the `posts` table if possible or store it encrypted.
- The `AnonymousPostLink` model uses standard Prisma but we apply programmatic encryption/decryption for the user identifier before save and after select (if we ever need to read it).

## Dev Agent Record

### Agent Model Used
Antigravity

### Debug Log References
- `crypto.ts` successfully encrypts and decrypts AES-256-GCM.
- Prisma schema generated and validated.

### Completion Notes List
- Evaluated adversarial review expectations on new `crypto.ts` and `AnonymousPostLink` tables schema. Added missing edge case handling for corrupted data.
- Built and unit tested `crypto.ts` functions for isolated payload decryption, covering AES-256 validation.

### File List
- `backend/prisma/schema.prisma`
- `backend/src/utils/crypto.ts`
- `backend/src/utils/crypto.test.ts`
