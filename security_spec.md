# Security Specification & Threat Model

This document outlines the security specifications, data invariants, threat payloads, and security assertions for our Firestore database structure.

## 1. Data Invariants

- **Ownership Consistency**: A conversation, message, or memory cannot be accessed, read, created, or updated by any user other than its legitimate `userId` owner.
- **Strict Role Verification**: Message `role` field must strictly be restricted to 'user' or 'model'.
- **Temporal Verification**: Timestamps or other structural meta fields cannot be spoofed by unauthorized entities.

## 2. The "Dirty Dozen" Payloads (Threat Vectors)

1. **Spoofed User ID Creation on Conversation**: Trying to create a conversation with a spoofed `userId` different from current authenticated UID.
2. **PII Reading on Foreign Conversations**: Authenticated User A attempting to list or fetch conversations belonging to User B.
3. **Cross-Tenant Conversation Title Modification**: Authenticated User A attempting to modify the title of a conversation belonging to User B.
4. **Spoofed User ID on Message Creation**: Creating a message in conversation X with a `userId` field pointing to a different user.
5. **Unauthorized Message Stream Updating**: Attempting to write or update other users' streaming text lines.
6. **Shadow Update / Ghost Field Insertion**: Trying to write a message with arbitrary metadata parameters not defined in the schema.
7. **Cross-User Message Listing**: Initiating an unqualified list query to scrape all messages in the database.
8. **Malicious ID Poisoning**: Trying to create a document with a junk ID of huge size (e.g., > 1.5KB) or with illegal characters.
9. **Creation of Memory without Ownership**: Injecting custom fact memories into another user's profile.
10. **Memory Content Swapping**: Attempting to alter another user's saved memory facts.
11. **Spoofed Importance Level on Memories**: Injecting a memory fact with importance values outside the bounds of 1 to 5.
12. **Anonymous Write Attempts**: Performing create, update, or delete operations while unauthenticated.

## 3. Test Runner Design

All above payloads must lead to instant `PERMISSION_DENIED` errors at the Firestore rules boundaries.

```typescript
// firestore.rules.test.ts placeholder verifying the Dirty Dozen behavior
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
// Tests verifying that spoofed user IDs or unauthenticated reads/writes are denied.
```


