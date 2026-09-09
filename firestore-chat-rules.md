# Firestore Security Rules for Chat System

Deploy these rules in your Firebase Console → Firestore → Rules, or via `firebase deploy --only firestore:rules`.

**Important:** Merge these with your existing Firestore rules. Do not replace your entire rules file.

## Recommended Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ===== EXISTING RULES =====
    // Keep your existing rules for products, settings, etc.
    // ...

    // ===== CHAT SYSTEM RULES =====

    // Conversations
    match /conversations/{conversationId} {

      // Anyone can create a conversation (customers start chats)
      allow create: if request.resource.data.keys().hasAll(['customerName', 'status', 'createdAt'])
                    && request.resource.data.status == 'open';

      // Read: Only the customer who owns this conversation, or admin
      // Since we don't have Firebase Auth in this project, we use a relaxed read rule.
      // For production with Firebase Auth, use:
      //   allow read: if request.auth.uid == resource.data.customerId
      //               || request.auth.token.admin == true;
      allow read: if true;

      // Update: Allow (for status changes, unread count resets)
      allow update: if true;

      // Delete: Allow (admins can delete conversations)
      allow delete: if true;

      // Messages subcollection
      match /messages/{messageId} {
        // Anyone can read messages in conversations they can access
        allow read: if true;

        // Anyone can create a message (customer or admin)
        allow create: if request.resource.data.keys().hasAll(['message', 'senderType', 'createdAt'])
                      && request.resource.data.message is string
                      && request.resource.data.message.size() <= 2000
                      && request.resource.data.senderType in ['customer', 'admin'];

        // Allow updating isRead field
        allow update: if request.resource.data.diff(resource.data).affectedKeys().hasOnly(['isRead']);

        // Allow deleting messages
        allow delete: if true;
      }
    }
  }
}
```

## Security Notes

### Current Architecture Limitations

This project uses **client-side Firebase** (NEXT_PUBLIC keys) without Firebase Authentication. This means:

1. **Firestore Security Rules cannot verify user identity** — there's no `request.auth` context.
2. The rules above are **permissive** to allow the chat to function.
3. **Customer isolation** is enforced at the **application level**, not the database level:
   - Customers only see their own conversations because the client queries filter by `customerId` or `guestSessionId`.
   - A determined attacker could potentially read other conversations by crafting Firestore queries.

### Recommended Production Hardening

For production with strict security:

1. **Enable Firebase Authentication** — even anonymous auth adds a `request.auth.uid` that rules can verify.
2. **Store admin UIDs** — use custom claims or a Firestore `admins` collection to identify admin users.
3. **Tighten rules** — replace `allow read: if true` with proper auth checks.

### Example with Firebase Auth enabled:

```javascript
match /conversations/{conversationId} {
  allow read: if request.auth != null && (
    request.auth.uid == resource.data.customerId ||
    request.auth.token.admin == true
  );
  allow create: if request.auth != null;
  allow update: if request.auth != null;
}
```

### XSS Prevention

Messages are sanitized before storage:
- `<`, `>`, `"`, `'` are HTML-entity encoded
- Maximum 2000 characters enforced
- No HTML rendering — text-only display

### Rate Limiting

Firestore does not have built-in rate limiting. For abuse prevention:
- Consider adding a Cloud Function that monitors write frequency
- Or use Firebase App Check to prevent unauthorized API access
