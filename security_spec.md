# Phase 0: Payload-First Security Specification (`security_spec.md`)

## 1. Data Invariants

1. **Global Default-Deny**: Any path not explicitly matched under `/inquiries/{inquiryId}` or `/savedResearch/{recordId}` is unconditionally denied (`allow read, write: if false;`).
2. **Verified Identity Invariant**: All writes require `request.auth != null && request.auth.token.email_verified == true`.
3. **Path Variable Hardening**: Every single-document path variable (`{inquiryId}`, `{recordId}`) must satisfy `isValidId(id)` (`id is string && id.size() >= 1 && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$')`).
4. **Inquiry Ownership & Admin Isolation**:
   - An `Inquiry` document can only be created if `incoming().authorUid == request.auth.uid` and `incoming().status == 'submitted'`.
   - Reading (`get`, `list`) an `Inquiry` is restricted to its creator (`resource.data.authorUid == request.auth.uid`) or the verified portfolio owner (`isAdmin()`).
   - Once `status == 'archived'`, the inquiry reaches a terminal state and cannot be updated further by standard users.
5. **SavedResearch Ownership Isolation**:
   - A `SavedResearch` document can only be created, read, updated, or deleted by `ownerUid == request.auth.uid`.
   - `ownerUid`, `uniprotAccession`, and `createdAt` are immutable after creation.
6. **Temporal Integrity**: `createdAt` on `create` must equal `request.time`, and `updatedAt` on `create` and `update` must equal `request.time`.

## 2. The "Dirty Dozen" Payloads

1. **Unauthenticated Write**: `auth = null`, creating `/inquiries/inq_1`.
2. **Unverified Email Spoof**: `auth = { uid: 'u1', token: { email: 'sameenap203@gmail.com', email_verified: false } }`, attempting admin read or inquiry create.
3. **Identity Spoofing on Create**: `auth.uid = 'u1'`, payload sets `authorUid: 'u2'`.
4. **Shadow Field Injection on Create**: Payload includes extra key `isAdmin: true` on `/inquiries/inq_1`.
5. **Shadow Field Injection on Update**: Update payload modifies `authorUid` or adds `hacked: true`.
6. **ID Poisoning Attack**: Document ID contains spaces/slashes or exceeds 128 chars.
7. **Denial-of-Wallet Oversized String**: `message` field contains 5,000 characters (exceeds `maxLength: 2000`).
8. **Client Timestamp Forgery**: `createdAt` is set to a past or future timestamp instead of `request.time`.
9. **Immortal Field Mutation**: Updating `createdAt` or `authorUid` on an existing document.
10. **Terminal State Bypass**: Updating an inquiry whose `existing().status == 'archived'`.
11. **Cross-Tenant List Scraping**: User `u1` runs an unfiltered `list` query on `/savedResearch` without `where('ownerUid', '==', 'u1')`.
12. **Invalid Accession Regex**: Creating `/savedResearch/rec_1` with `uniprotAccession: '<script>alert(1)</script>'`.

## 3. Test Runner Specification (`firestore.rules.test.ts`)

All 12 adversarial payloads above are asserted to return `PERMISSION_DENIED` against `firestore.rules`.
