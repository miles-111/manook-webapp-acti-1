# AssetSilo PC & Mobile Loadout Security Specification

## 1. Data Invariants
1. **User Identity Invariant**: A user profile document at `/users/{userId}` can only be created, read, or modified by the authenticated user whose `request.auth.uid == userId`.
2. **Config Ownership Invariant**: Every PC or Mobile aim loadout at `/users/{userId}/configs/{configId}` is strictly isolated to `request.auth.uid == userId` and must carry `userId == request.auth.uid` in the document payload.
3. **Immutability of Identity & Creation**: During updates to `/users/{userId}/configs/{configId}`, `userId` and `createdAt` cannot be modified.
4. **Volumetric & Schema Guardrails**: All fields are strictly bounded (`name` <= 100 chars, `tags` <= 160 chars, `crosshairCode` <= 255 chars, `hudCode` <= 255 chars, `resolution` <= 40 chars, `fingerSetup` <= 40 chars, `notes` <= 1000 chars, `dpi` in `[50, 32000]`, `sensitivity` in `(0, 100]`, `cameraSens`/`adsSens` in `[1, 400]`, `gyroSens` in `[0, 500]`).

---

## 2. Threat Payloads (Must Return PERMISSION_DENIED)

1. **Unauthenticated Create**: Anonymous client attempts to write `/users/u1/configs/cfg1`.
2. **Cross-User Read**: User A attempts to read `/users/userB/configs/cfg1`.
3. **Cross-User List**: User A attempts to list `/users/userB/configs`.
4. **Identity Spoofing on Create**: User A writes `/users/userA/configs/cfg1` with `userId: "userB"`.
5. **Ownership Transfer on Update**: User A updates `/users/userA/configs/cfg1` changing `userId` to `"userB"`.
6. **Shadow Field Injection**: User A includes unauthorized field `isPro: true` on config create or update.
7. **Oversized Payload**: User A submits a 50,000-character string in `notes`, `hudCode`, or `crosshairCode`.
8. **Invalid Game Enum**: User A submits `game: "UnknownGame"` outside the allowed PC/Mobile list.
9. **Negative / Out-of-Range Sensitivity**: User A submits `sensitivity: -5`, `dpi: 0`, or `cameraSens: 9999`.
10. **Cross-User Delete**: User A attempts to delete `/users/userB/configs/cfg1`.
11. **Profile Hijack**: User A attempts to create or read `/users/userB`.
12. **Invalid ID Injection**: Attacker passes malformed multi-kilobyte document IDs.
