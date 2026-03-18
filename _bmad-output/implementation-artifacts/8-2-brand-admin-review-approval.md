# Story 8.2: Brand Admin Review & Approval

Status: ready-for-dev

## Story

As an admin,
I want to review brand inquiries, approve/reject them, and generate a `brand_partner` Keycloak account upon approval,
So that I gatekeep commercial access and control the partner quota.

## Acceptance Criteria

1. **Given** I am an admin viewing pending inquiries,
2. **When** I approve a brand,
3. **Then** a Keycloak account is automatically provisioned with the `brand_partner` role,
4. **And** an introductory email with login credentials is sent to the brand contact.

## Tasks / Subtasks

- [ ] [BACKEND] Implement Review APIs (AC: 1, 2)
  - [ ] Add `listInquiries` to `brandPartnerService`
  - [ ] Add `updateInquiryStatus` to `brandPartnerService`
  - [ ] Add `GET /api/brand-partners/inquiries` to `brandPartners.routes` (Role: admin, moderator)
  - [ ] Add `PATCH /api/brand-partners/inquiries/:id/status` to `brandPartners.routes` (Role: admin)
- [ ] [BACKEND] Keycloak Integration (AC: 3)
  - [ ] Implement `provisionPartnerAccount` in `brandPartnerService` using `getKeycloakAdminClient`
  - [ ] Handle role assignment (`brand_partner`)
- [ ] [BACKEND] Notification Simulation (AC: 4)
  - [ ] Implement email log simulation for partner credentials
- [ ] [FRONTEND] Admin Review Interface (AC: 1, 2)
  - [ ] Create `AdminInquiryList` component
  - [ ] Implement Approve/Reject actions with status updates

## Dev Notes

- **Keycloak Utility**: Use `backend/src/utils/keycloak.ts` to get the admin client.
- **Roles**: Ensure the `brand_partner` role exists in the realm before assignment.
- **Database**: Update `BrandInquiry` status to 'approved' or 'rejected'.
- **Security**: Only users with `admin` role (from Keycloak) should be able to approve/reject.

### Project Structure Notes

- Backend routes in `backend/src/routes/brandPartners.routes.ts`
- Backend controllers in `backend/src/controllers/brandPartnerController.ts`
- Backend services in `backend/src/services/brandPartnerService.ts`
- Frontend components in `frontend/src/components/admin/`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 8.2]
- [Source: backend/src/utils/keycloak.ts]
