# Email Logging Guidelines

> **CRITICAL**: ALL emails sent by the RYTHM platform MUST be logged to the database for audit, compliance, and debugging purposes.

## 📋 Overview

The RYTHM platform implements comprehensive email logging to track all communications sent to users. This provides:
- **Audit trail** for compliance and security
- **Debugging** capabilities for delivery issues
- **Analytics** on email performance and user engagement
- **Admin visibility** into platform communications

## 🚫 DO NOT

**Never send emails directly using Azure SDK or any other email library.**

❌ **Wrong:**
```typescript
import { EmailClient } from "@azure/communication-email";

// DON'T DO THIS
const emailClient = new EmailClient(connectionString);
await emailClient.beginSend({
  senderAddress: "noreply@rythm.com",
  content: {
    subject: "Test Email",
    plainText: "Hello",
  },
  recipients: {
    to: [{ address: "user@example.com" }],
  },
});
```

## ✅ DO

**Always use the EmailService class** which automatically logs all emails to the database.

✅ **Correct:**
```typescript
import { EmailService } from '@/services/EmailService';

const emailService = new EmailService();

// For specialized email types, use dedicated methods:
await emailService.sendBackupNotification({
  to: 'user@example.com',
  tenantId: 'tenant-123',
  tenantName: 'Acme Fitness',
  backupId: 'backup-456',
  status: 'completed',
  size: 1024000,
  duration: 5.2,
});

// For generic emails:
await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Welcome to RYTHM',
  plainTextBody: 'Welcome to our platform!',
  htmlBody: '<h1>Welcome to our platform!</h1>',
  emailType: 'generic',
  tenantId: 'tenant-123',
  userId: 'user-789',
  metadata: {
    campaignId: 'welcome-2025',
    source: 'registration',
  },
});
```

## 📊 Email Types

Every email must specify an `emailType` from these options:

| Type | Purpose | Required Metadata |
|------|---------|-------------------|
| `backup_notification` | Backup completion alerts | `backupId`, `status`, `size`, `duration` |
| `password_reset` | Password reset links | `resetToken`, `expiresInHours` |
| `workout_reminder` | Scheduled workout reminders | `sessionId`, `scheduledTime`, `workoutName` |
| `admin_alert` | System alerts for admins | `alertType`, `severity`, `details` |
| `generic` | Other communications | Custom metadata as needed |

## 🔍 Required Parameters

### Minimum Required
```typescript
{
  to: string,              // Recipient email address
  subject: string,         // Email subject line
  plainTextBody: string,   // Plain text version (fallback)
  htmlBody: string,        // HTML version (preferred)
  emailType: EmailType,    // One of the 5 types above
}
```

### Recommended Context
```typescript
{
  tenantId?: string,       // The tenant context (for multi-tenant isolation)
  userId?: string,         // The recipient user ID (for user tracking)
  metadata?: object,       // Type-specific context data
  replyTo?: string,        // Custom reply-to address
}
```

## 🎯 Best Practices

### 1. Always Include Context
```typescript
// ✅ Good - Includes all relevant context
await emailService.sendPasswordReset({
  to: user.email,
  userId: user.user_id,
  tenantId: user.tenant_id,
  resetToken: token,
  expiresInHours: 24,
});

// ❌ Bad - Missing context
await emailService.sendEmail({
  to: user.email,
  subject: 'Reset Password',
  plainTextBody: 'Click here to reset',
  htmlBody: '<a href="...">Reset</a>',
  emailType: 'password_reset',
  // Missing: userId, tenantId, metadata
});
```

### 2. Use Specialized Methods
The EmailService provides dedicated methods for common email types:

```typescript
// ✅ Preferred - Type-safe, enforces required metadata
await emailService.sendBackupNotification({ ... });
await emailService.sendPasswordReset({ ... });
await emailService.sendWorkoutReminder({ ... });
await emailService.sendAdminAlert({ ... });

// ⚠️ Less Preferred - Generic, manual metadata
await emailService.sendEmail({
  emailType: 'backup_notification',
  metadata: { backupId, status, size, duration },
  ...
});
```

### 3. Handle Errors Gracefully
```typescript
try {
  await emailService.sendPasswordReset({
    to: user.email,
    userId: user.user_id,
    tenantId: user.tenant_id,
    resetToken: token,
    expiresInHours: 24,
  });
  
  console.log('Password reset email sent and logged');
} catch (error) {
  console.error('Failed to send password reset:', error);
  // Email log will contain the error details
  // Application can still continue
}
```

### 4. Provide Rich Metadata
```typescript
// ✅ Good - Rich metadata for debugging
await emailService.sendWorkoutReminder({
  to: user.email,
  userId: user.user_id,
  tenantId: user.tenant_id,
  sessionId: session.session_id,
  scheduledTime: session.scheduled_at,
  workoutName: session.name,
  metadata: {
    // Additional context
    reminderType: 'pre-workout',
    leadTimeMinutes: 30,
    userTimezone: user.timezone,
    notificationPreference: user.notification_preference,
  },
});

// ❌ Bad - Minimal metadata
await emailService.sendWorkoutReminder({
  to: user.email,
  sessionId: session.session_id,
  // Missing context
});
```

## 📈 Database Schema

All emails are logged to the `email_logs` table:

```sql
CREATE TABLE email_logs (
  email_log_id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(tenant_id),
  user_id UUID REFERENCES users(user_id),
  email_type email_type NOT NULL,
  status email_status DEFAULT 'pending',
  to_address TEXT NOT NULL,
  from_address TEXT NOT NULL,
  reply_to_address TEXT,
  subject TEXT NOT NULL,
  plain_text_body TEXT NOT NULL,
  html_body TEXT NOT NULL,
  message_id TEXT,           -- Azure Communication Services message ID
  error_message TEXT,         -- If sending failed
  metadata JSONB,             -- Type-specific context
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Status Flow
1. `pending` → Email created, not yet sent
2. `sent` → Successfully sent to Azure Communication Services
3. `delivered` → Confirmed delivery to recipient (if tracking enabled)
4. `failed` → Send failed (error_message populated)
5. `bounced` → Email bounced (invalid address, full mailbox, etc.)

## 🔍 Viewing Email Logs

### Admin UI
Navigate to **Admin Dashboard → Email Logs** (requires `system_admin` role):
- Filter by email type, status, recipient
- Search across subject and body content
- View full email details including HTML preview
- Check delivery timestamps and error messages

### API Endpoints
```typescript
// List emails (paginated)
GET /api/email-logs?page=1&limit=50&email_type=password_reset&status=sent

// Get specific email
GET /api/email-logs/:email_log_id

// Get statistics
GET /api/email-logs/stats/summary
```

## 🛠️ Implementation Checklist

When adding new email functionality:

- [ ] Import EmailService from `apps/api/src/services/EmailService.ts`
- [ ] Choose appropriate `emailType` or add new type if needed
- [ ] Include `tenantId` and `userId` when available
- [ ] Provide relevant `metadata` for the email type
- [ ] Use specialized method if available (e.g., `sendBackupNotification`)
- [ ] Test email appears in admin UI with correct metadata
- [ ] Verify error handling (email log created even if send fails)
- [ ] Update this documentation if adding new email type

## 🚨 Security Considerations

1. **PII Protection**: Email logs contain user email addresses and message content. Ensure proper access controls.
2. **Retention Policy**: Consider implementing data retention policies for old email logs.
3. **Admin Access**: Only `system_admin` role can view email logs (contains sensitive data).
4. **Metadata Sanitization**: Don't include passwords, tokens, or sensitive data in metadata beyond what's necessary.

## 📚 Related Documentation

- [Email Service Setup Guide](./EMAIL_SERVICE_SETUP.md) - Azure Communication Services configuration
- [Email Service Usage Guide](./EMAIL_SERVICE_USAGE.md) - Code examples and API reference
- [Admin UI Guide](./ADMIN_UI_GUIDE.md) - Using the email logs admin interface

## 🤝 Contributing

When adding new email types:

1. Update `EmailType` enum in the database migration
2. Add specialized method to `EmailService` class
3. Define metadata interface for the new type
4. Update this documentation with examples
5. Add email type to admin UI filters

---

**Remember**: Email logging is not optional. It's a core requirement for compliance, debugging, and platform transparency.
