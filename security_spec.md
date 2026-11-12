# AssetSilo Security Specification & Test Matrix

## 1. Data Invariants
1. **User Identity Invariant**: A user profile document at `/users/{userId}` can only be created, read, or modified by the authenticated user whose `request.auth.uid == userId`. Users cannot impersonate other accounts or mutate `userId`.
2. **File Ownership Invariant**: A file document at `/files/{fileId}` must have `userId == request.auth.uid`. A user cannot read, create, update, or delete any file belonging to another user.
3. **Immutability of Identity & Creation**: When updating a file, the `userId` field cannot be altered, ensuring zero ownership transfer or orphaned ownership attacks.
4. **Volumetric & Schema Guardrails**: Strings, IDs, and payload sizes must conform to boundaries defined in `firebase-blueprint.json` (`name` <= 255 chars, `clientName` <= 120 chars, `notes` <= 1000 chars, `size` is positive number).

---

## 2. The "Dirty Dozen" Threat Payloads (Must Return PERMISSION_DENIED)

1. **Payload 1 (Ghost Write / Unauthenticated Create)**:
   Unauthenticated user attempts to create a file at `/files/ghost_01` without `request.auth`.
2. **Payload 2 (Cross-User Read Violation)**:
   Authenticated user `user_A` attempts to read `/files/file_B` belonging to `user_B`.
3. **Payload 3 (Identity Spoofing on Create)**:
   User `user_A` attempts to create `/files/spoof_01` with `userId: 'user_B'`.
4. **Payload 4 (Orphaned Subversion / Ownership Transfer)**:
   User `user_A` attempts to update their own file `/files/file_A` by changing `userId` to `'user_B'`.
5. **Payload 5 (Global Blanket Collection Read)**:
   User `user_A` issues an unrestricted list query across all files without `where("userId", "==", "user_A")`.
6. **Payload 6 (Oversized Payload / Denial of Wallet Attack)**:
   User `user_A` attempts to write `name` with a 100,000-character string exceeding the 255-character boundary.
7. **Payload 7 (Negative / Invalid Size Injection)**:
   User attempts to inject a negative file size (`size: -99999`) or non-number into `size`.
8. **Payload 8 (Foreign Document Mutation)**:
   User `user_A` attempts to delete a file document `/files/file_B` belonging to `user_B`.
9. **Payload 9 (Profile Impersonation Read)**:
   User `user_A` attempts to fetch `/users/user_B`'s private profile.
10. **Payload 10 (Profile Hijacking Write)**:
    User `user_A` attempts to create or overwrite `/users/user_B`'s profile document.
11. **Payload 11 (Shadow Field Injection on Update)**:
    User `user_A` attempts to update `/files/file_A` with unauthorized administrative keys (`isAdmin: true`, `isApproved: true`).
12. **Payload 12 (Invalid Document ID Injection)**:
    Attacker passes malicious multi-kilobyte script strings in the document path.

---

## 3. Test Runner Definitions
All access control rules are mapped directly in `firestore.rules` and verified through unit checks and permission tests.
