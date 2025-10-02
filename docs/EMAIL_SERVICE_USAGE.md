# Email Service - Quick Reference Guide

## 📧 EmailService Class

Located at: `apps/api/src/services/EmailService.ts`

### Initialization

The email service is automatically initialized as a singleton:

```typescript
import { emailService } from './services/EmailService';
```

**Environment Variables Required:**
- `ACS_CONNECTION_STRING` - Azure Communication Services connection string
- `ACS_SENDER_ADDRESS` - Verified sender email address

**Graceful Degradation:**
If environment variables are missing, the service logs a warning and disables email features (no crashes).

---

## 🎯 Available Methods

### 1. Generic Email Sending

```typescript
await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Welcome to RYTHM',
  plainText: 'Plain text version',
  html: '<h1>HTML version</h1>', // Optional
  replyTo: 'support@rythm.training', // Optional
});
```

**Returns:** `{ success: boolean; messageId?: string; error?: string }`

---

### 2. Backup Notification

```typescript
await emailService.sendBackupNotification({
  adminEmail: 'admin@example.com',
  backupId: 'backup-2025-10-02-123456',
  status: 'success', // or 'failure'
  size: 1024 * 1024 * 5, // 5 MB (optional)
  duration: 3500, // milliseconds (optional)
  error: 'Connection timeout', // Only for failures (optional)
  tenantName: 'Acme Corp', // Optional
});
```

**Features:**
- ✅/❌ Color-coded status headers
- Formatted size (KB/MB/GB)
- Duration in seconds
- Error details box (for failures)
- Professional HTML template

---

### 3. Password Reset Email

```typescript
await emailService.sendPasswordReset({
  userEmail: 'user@example.com',
  userName: 'John Doe',
  resetToken: 'abc123xyz789',
  resetUrl: 'https://rythm.training/reset-password',
  expiresInHours: 1, // Optional, defaults to 1 hour
});
```

**Features:**
- Secure reset link with token
- Expiration warning
- Security reminder (don't share link)
- Call-to-action button
- Plain text fallback

---

### 4. Workout Reminder

```typescript
await emailService.sendWorkoutReminder({
  userEmail: 'user@example.com',
  userName: 'Jane Smith',
  sessionName: 'Upper Body Strength',
  scheduledTime: new Date('2025-10-02T18:00:00Z'),
  exerciseCount: 6, // Optional
});
```

**Features:**
- Motivational design with gradient header
- Session details box
- Formatted time (local timezone)
- Exercise count preview
- Call-to-action

---

### 5. Admin Alert

```typescript
await emailService.sendAdminAlert({
  adminEmail: 'admin@example.com',
  alertType: 'system_health', // or 'security', 'tenant_activity', 'resource_limit'
  severity: 'warning', // 'info', 'warning', 'error', 'critical'
  subject: 'High CPU Usage Detected',
  message: 'API server CPU usage exceeded 90% for 5 minutes',
  details: { // Optional structured data
    cpu: '92%',
    memory: '78%',
    duration: '5m',
  },
});
```

**Features:**
- Severity-based color coding
- Emoji indicators (ℹ️/⚠️/❌/🚨)
- Structured details formatting
- Timestamp included
- Professional alert template

---

## 🔧 Utility Methods

### Check if Email Service is Ready

```typescript
if (emailService.isReady()) {
  // Send email
} else {
  console.warn('Email service not configured');
}
```

### Get Sender Address

```typescript
const sender = emailService.getSenderAddress();
console.log(`Emails sent from: ${sender}`);
```

---

## 🏗️ Integration Examples

### Example 1: Backup Route with Email Notification

```typescript
import { emailService } from '../services/EmailService';

router.post('/api/backups', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const backup = await backupService.createBackup();
    const duration = Date.now() - startTime;
    
    // Send success email (async, don't block response)
    if (emailService.isReady() && req.user?.email) {
      emailService.sendBackupNotification({
        adminEmail: req.user.email,
        backupId: backup.filename,
        status: 'success',
        size: backup.size,
        duration,
      }).catch(err => console.error('Email notification failed:', err));
    }
    
    res.json({ success: true, data: backup });
  } catch (error) {
    // Send failure email
    if (emailService.isReady() && req.user?.email) {
      emailService.sendBackupNotification({
        adminEmail: req.user.email,
        backupId: `failed-${Date.now()}`,
        status: 'failure',
        error: error.message,
      }).catch(err => console.error('Email notification failed:', err));
    }
    
    res.status(500).json({ error: error.message });
  }
});
```

### Example 2: Password Reset Flow

```typescript
router.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  
  const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  if (!user.rows[0]) {
    // Security: Don't reveal if user exists
    return res.json({ success: true, message: 'If account exists, reset link sent' });
  }
  
  // Generate secure token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = await bcrypt.hash(resetToken, 10);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  
  // Store token in database
  await db.query(
    'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE user_id = $3',
    [hashedToken, expiresAt, user.rows[0].user_id]
  );
  
  // Send email
  await emailService.sendPasswordReset({
    userEmail: email,
    userName: `${user.rows[0].first_name} ${user.rows[0].last_name}`,
    resetToken,
    resetUrl: `${process.env.FRONTEND_URL}/reset-password`,
    expiresInHours: 1,
  });
  
  res.json({ success: true, message: 'If account exists, reset link sent' });
});
```

### Example 3: Scheduled Workout Reminders (Cron Job)

```typescript
import cron from 'node-cron';

// Run every hour to check for upcoming workouts
cron.schedule('0 * * * *', async () => {
  console.log('🔔 Checking for workout reminders...');
  
  // Find sessions scheduled in next hour with reminders enabled
  const upcomingSessions = await db.query(`
    SELECT 
      s.session_id,
      s.session_name,
      s.scheduled_at,
      u.email,
      u.first_name,
      COUNT(e.exercise_id) as exercise_count
    FROM sessions s
    JOIN users u ON s.user_id = u.user_id
    LEFT JOIN exercises e ON e.session_id = s.session_id
    WHERE s.scheduled_at BETWEEN NOW() AND NOW() + INTERVAL '1 hour'
      AND s.reminder_sent = FALSE
      AND u.email_notifications_enabled = TRUE
    GROUP BY s.session_id, u.email, u.first_name
  `);
  
  for (const session of upcomingSessions.rows) {
    await emailService.sendWorkoutReminder({
      userEmail: session.email,
      userName: session.first_name,
      sessionName: session.session_name,
      scheduledTime: new Date(session.scheduled_at),
      exerciseCount: session.exercise_count,
    });
    
    // Mark as sent
    await db.query(
      'UPDATE sessions SET reminder_sent = TRUE WHERE session_id = $1',
      [session.session_id]
    );
  }
  
  console.log(`✅ Sent ${upcomingSessions.rows.length} workout reminders`);
});
```

---

## 🚨 Error Handling Best Practices

### 1. Non-blocking Email Sends

Always send emails asynchronously in request handlers:

```typescript
// ✅ GOOD - Don't block response
emailService.sendBackupNotification({...})
  .catch(err => console.error('Email failed:', err));

res.json({ success: true });

// ❌ BAD - Blocks response, slows down user experience
await emailService.sendBackupNotification({...});
res.json({ success: true });
```

### 2. Graceful Degradation

Check if service is ready before attempting to send:

```typescript
if (emailService.isReady()) {
  emailService.sendEmail({...}).catch(console.error);
} else {
  console.warn('Email service not configured - skipping notification');
}
```

### 3. Retry Logic (Optional)

For critical emails, implement retry:

```typescript
async function sendWithRetry(emailFn: () => Promise<any>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await emailFn();
      if (result.success) return result;
    } catch (error) {
      console.error(`Email attempt ${i + 1} failed:`, error);
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1))); // Exponential backoff
    }
  }
}
```

---

## 📊 Monitoring

### Log Analysis

```bash
# Check email service logs
docker logs rythm-api-1 | grep "EmailService"

# Filter successful emails
docker logs rythm-api-1 | grep "Email sent successfully"

# Filter failed emails
docker logs rythm-api-1 | grep "Email failed"
```

### Azure Portal Monitoring

1. Navigate to **Azure Communication Services** resource
2. Go to **Insights** → **Email Logs**
3. Filter by:
   - Time range
   - Message status (Succeeded/Failed/Delivered)
   - Recipient email

---

## 🎨 Email Template Customization

To customize email templates, edit the HTML in:
- `sendBackupNotification()` - Line 163
- `sendPasswordReset()` - Line 238
- `sendWorkoutReminder()` - Line 309
- `sendAdminAlert()` - Line 379

**Best Practices:**
- Keep HTML simple (inline CSS only)
- Always include plain text version
- Test in multiple email clients
- Use semantic HTML (`<table>` for layouts)
- Avoid external images (use data URIs or CDN)

---

## 📝 Testing Checklist

Before deploying:

- [ ] Environment variables configured (`ACS_CONNECTION_STRING`, `ACS_SENDER_ADDRESS`)
- [ ] Sender address verified in Azure Portal
- [ ] Test email to personal account (check inbox + spam)
- [ ] Test all email types (backup, password reset, reminder, alert)
- [ ] Verify HTML rendering in Gmail, Outlook, Apple Mail
- [ ] Check plain text fallback
- [ ] Confirm email analytics in Azure Portal
- [ ] Test error handling (invalid email, service down)

---

## 🔗 Related Documentation

- [Full Setup Guide](./EMAIL_SERVICE_SETUP.md) - Azure resource provisioning
- [Azure ACS Email Docs](https://learn.microsoft.com/azure/communication-services/quickstarts/email/send-email)
- [Backup Service](../apps/api/src/services/backup.service.ts) - Integration example

---

*Last updated: October 2, 2025*
