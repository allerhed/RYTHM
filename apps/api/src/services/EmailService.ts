/** EmailService - Azure Communication Services Email Integration
 * Handles all email sending operations for RYTHM platform
 * 
 * Features:
 * - Backup notifications (success/failure alerts to admins)
 * - Password reset emails (secure token delivery)
 * - Workout reminders (scheduled session notifications)
 * - Admin alerts (system health, tenant activity)
 * 
 * Azure: Uses ACS Email SDK with connection string authentication
 * Environment: Requires ACS_CONNECTION_STRING and ACS_SENDER_ADDRESS
 * Error Handling: Comprehensive logging and retry-ready design
 */

import { EmailClient, KnownEmailSendStatus, EmailMessage } from '@azure/communication-email';
import { db } from '@rythm/db';

type EmailType = 'backup_notification' | 'password_reset' | 'workout_reminder' | 'admin_alert' | 'generic';

interface EmailConfig {
  connectionString: string;
  senderAddress: string;
  defaultFromName?: string;
}

interface SendEmailParams {
  to: string;
  subject: string;
  plainText: string;
  html?: string;
  replyTo?: string;
  emailType?: EmailType;
  tenantId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

interface BackupNotificationParams {
  adminEmail: string;
  backupId: string;
  status: 'success' | 'failure';
  size?: number;
  duration?: number;
  error?: string;
  tenantName?: string;
}

interface PasswordResetParams {
  userEmail: string;
  userName: string;
  resetToken: string;
  resetUrl: string;
  expiresInHours?: number;
}

interface WorkoutReminderParams {
  userEmail: string;
  userName: string;
  sessionName: string;
  scheduledTime: Date;
  exerciseCount?: number;
}

interface AdminAlertParams {
  adminEmail: string;
  alertType: 'system_health' | 'security' | 'tenant_activity' | 'resource_limit';
  severity: 'info' | 'warning' | 'error' | 'critical';
  subject: string;
  message: string;
  details?: Record<string, any>;
}

export class EmailService {
  private client: EmailClient;
  private senderAddress: string;
  private defaultFromName: string;
  private isConfigured: boolean = false;

  constructor(config?: EmailConfig) {
    const connectionString = config?.connectionString || process.env.ACS_CONNECTION_STRING;
    const senderAddress = config?.senderAddress || process.env.ACS_SENDER_ADDRESS;

    if (!connectionString || !senderAddress) {
      console.warn('EmailService: Missing ACS configuration. Email features will be disabled.');
      this.isConfigured = false;
      // Create dummy client to prevent crashes
      this.client = null as any;
      this.senderAddress = '';
      this.defaultFromName = 'RYTHM';
      return;
    }

    this.client = new EmailClient(connectionString);
    this.senderAddress = senderAddress;
    this.defaultFromName = config?.defaultFromName || 'RYTHM Training Platform';
    this.isConfigured = true;

    console.log(`✅ EmailService initialized with sender: ${this.senderAddress}`);
  }

  /**
   * Generic email sending method
   * Handles polling and status checking for email delivery
   * Logs all emails to database for audit trail
   */
  async sendEmail(params: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const emailLogId = await this.createEmailLog(params);
    
    if (!this.isConfigured) {
      console.warn('EmailService: Not configured. Skipping email send.');
      await this.updateEmailLogStatus(emailLogId, 'failed', 'Email service not configured');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const message: EmailMessage = {
        senderAddress: this.senderAddress,
        content: {
          subject: params.subject,
          plainText: params.plainText,
          ...(params.html && { html: params.html }),
        },
        recipients: {
          to: [{ address: params.to }],
        },
        ...(params.replyTo && {
          replyTo: [{ address: params.replyTo }],
        }),
      };

      console.log(`📧 Sending email to ${params.to}: "${params.subject}"`);

      const poller = await this.client.beginSend(message);

      // Poll until done (with timeout)
      const POLL_INTERVAL_MS = 2000;
      const MAX_WAIT_TIME_MS = 30000; // 30 seconds
      let elapsedTime = 0;

      while (!poller.isDone() && elapsedTime < MAX_WAIT_TIME_MS) {
        await poller.poll();
        if (!poller.isDone()) {
          await this.sleep(POLL_INTERVAL_MS);
          elapsedTime += POLL_INTERVAL_MS;
        }
      }

      const result = poller.getResult();

      if (result?.status === KnownEmailSendStatus.Succeeded) {
        console.log(`✅ Email sent successfully (ID: ${result.id})`);
        await this.updateEmailLogStatus(emailLogId, 'sent', undefined, result.id);
        return { success: true, messageId: result.id };
      } else if (result?.error) {
        console.error(`❌ Email failed: ${result.error.message}`);
        await this.updateEmailLogStatus(emailLogId, 'failed', result.error.message);
        return { success: false, error: result.error.message };
      } else {
        console.warn(`⚠️ Email status unknown after ${elapsedTime}ms`);
        await this.updateEmailLogStatus(emailLogId, 'failed', 'Email send timeout or unknown status');
        return { success: false, error: 'Email send timeout or unknown status' };
      }
    } catch (error: any) {
      console.error('❌ Email send error:', error);
      await this.updateEmailLogStatus(emailLogId, 'failed', error.message || 'Unknown error');
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  /**
   * Create email log entry in database
   */
  private async createEmailLog(params: SendEmailParams): Promise<string> {
    try {
      const result = await db.query(
        `INSERT INTO email_logs (
          tenant_id, user_id, email_type, status,
          to_address, from_address, reply_to_address,
          subject, plain_text_body, html_body, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING email_log_id`,
        [
          params.tenantId || null,
          params.userId || null,
          params.emailType || 'generic',
          'pending',
          params.to,
          this.senderAddress,
          params.replyTo || null,
          params.subject,
          params.plainText,
          params.html || null,
          JSON.stringify(params.metadata || {}),
        ]
      );
      return result.rows[0].email_log_id;
    } catch (error) {
      console.error('Failed to create email log:', error);
      // Return a dummy ID if logging fails (don't block email sending)
      return '00000000-0000-0000-0000-000000000000';
    }
  }

  /**
   * Update email log status after sending attempt
   */
  private async updateEmailLogStatus(
    emailLogId: string,
    status: 'pending' | 'sent' | 'failed' | 'delivered' | 'bounced',
    errorMessage?: string,
    messageId?: string
  ): Promise<void> {
    try {
      await db.query(
        `UPDATE email_logs 
         SET status = $1, 
             error_message = $2, 
             message_id = $3,
             sent_at = CASE WHEN $1 = 'sent' THEN NOW() ELSE sent_at END,
             updated_at = NOW()
         WHERE email_log_id = $4`,
        [status, errorMessage || null, messageId || null, emailLogId]
      );
    } catch (error) {
      console.error('Failed to update email log:', error);
      // Don't throw - logging failure shouldn't break email sending
    }
  }

  /**
   * Send backup notification to admin
   * Alerts when database backups complete or fail
   */
  async sendBackupNotification(params: BackupNotificationParams): Promise<{ success: boolean; error?: string }> {
    const { adminEmail, backupId, status, size, duration, error, tenantName } = params;

    const isSuccess = status === 'success';
    const subject = isSuccess
      ? `✅ Database Backup Completed Successfully`
      : `❌ Database Backup Failed`;

    const sizeFormatted = size ? this.formatBytes(size) : 'N/A';
    const durationFormatted = duration ? `${(duration / 1000).toFixed(2)}s` : 'N/A';

    const plainText = `
RYTHM Database Backup Notification
${isSuccess ? '✅ SUCCESS' : '❌ FAILURE'}

Backup ID: ${backupId}
${tenantName ? `Tenant: ${tenantName}` : ''}
Status: ${status.toUpperCase()}
Size: ${sizeFormatted}
Duration: ${durationFormatted}
Timestamp: ${new Date().toISOString()}

${error ? `Error Details:\n${error}\n` : ''}
${isSuccess ? 'Your database backup has been successfully created and stored in Azure Blob Storage.' : 'The backup process encountered an error. Please check your system logs for more details.'}

---
This is an automated notification from RYTHM Training Platform.
`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${isSuccess ? '#10b981' : '#ef4444'}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; }
    .detail-row { margin: 10px 0; }
    .label { font-weight: bold; color: #6b7280; }
    .value { color: #111827; }
    .error-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 15px 0; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">${isSuccess ? '✅' : '❌'} Database Backup ${isSuccess ? 'Completed' : 'Failed'}</h2>
    </div>
    <div class="content">
      <div class="detail-row">
        <span class="label">Backup ID:</span>
        <span class="value">${backupId}</span>
      </div>
      ${tenantName ? `<div class="detail-row"><span class="label">Tenant:</span> <span class="value">${tenantName}</span></div>` : ''}
      <div class="detail-row">
        <span class="label">Status:</span>
        <span class="value">${status.toUpperCase()}</span>
      </div>
      <div class="detail-row">
        <span class="label">Size:</span>
        <span class="value">${sizeFormatted}</span>
      </div>
      <div class="detail-row">
        <span class="label">Duration:</span>
        <span class="value">${durationFormatted}</span>
      </div>
      <div class="detail-row">
        <span class="label">Timestamp:</span>
        <span class="value">${new Date().toISOString()}</span>
      </div>
      
      ${error ? `<div class="error-box"><strong>Error Details:</strong><br/>${error}</div>` : ''}
      
      <p style="margin-top: 20px;">
        ${isSuccess 
          ? 'Your database backup has been successfully created and stored in Azure Blob Storage. The backup includes all tenant data and can be restored if needed.' 
          : 'The backup process encountered an error. Please check your Azure Container App logs and system health for more details.'}
      </p>
    </div>
    <div class="footer">
      This is an automated notification from RYTHM Training Platform.
    </div>
  </div>
</body>
</html>
`;

    return this.sendEmail({
      to: adminEmail,
      subject,
      plainText,
      html,
      emailType: 'backup_notification',
      metadata: {
        backupId,
        status,
        size,
        duration,
        tenantName,
      },
    });
  }

  /**
   * Send password reset email with secure token
   * Includes expiration time and reset link
   */
  async sendPasswordReset(params: PasswordResetParams): Promise<{ success: boolean; error?: string }> {
    const { userEmail, userName, resetToken, resetUrl, expiresInHours = 1 } = params;

    const subject = '🔐 Reset Your RYTHM Password';

    const plainText = `
Hi ${userName},

We received a request to reset your RYTHM account password.

To reset your password, click the link below:
${resetUrl}?token=${resetToken}

This link will expire in ${expiresInHours} hour${expiresInHours > 1 ? 's' : ''}.

If you didn't request this password reset, please ignore this email and your password will remain unchanged.

For security reasons, never share this link with anyone.

---
RYTHM Training Platform
`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 15px 0; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">🔐 Reset Your Password</h2>
    </div>
    <div class="content">
      <p>Hi <strong>${userName}</strong>,</p>
      
      <p>We received a request to reset your RYTHM account password.</p>
      
      <p>To reset your password, click the button below:</p>
      
      <div style="text-align: center;">
        <a href="${resetUrl}?token=${resetToken}" class="button">Reset Password</a>
      </div>
      
      <p style="font-size: 14px; color: #6b7280;">
        Or copy and paste this link into your browser:<br/>
        <code>${resetUrl}?token=${resetToken}</code>
      </p>
      
      <div class="warning">
        <strong>⏱️ This link will expire in ${expiresInHours} hour${expiresInHours > 1 ? 's' : ''}.</strong>
      </div>
      
      <p>If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
      
      <p><strong>Security reminder:</strong> Never share this link with anyone.</p>
    </div>
    <div class="footer">
      This is an automated email from RYTHM Training Platform.<br/>
      If you have questions, please contact your system administrator.
    </div>
  </div>
</body>
</html>
`;

    return this.sendEmail({
      to: userEmail,
      subject,
      plainText,
      html,
    });
  }

  /**
   * Send workout reminder notification
   * Reminds users about upcoming scheduled training sessions
   */
  async sendWorkoutReminder(params: WorkoutReminderParams): Promise<{ success: boolean; error?: string }> {
    const { userEmail, userName, sessionName, scheduledTime, exerciseCount } = params;

    const subject = `💪 Reminder: ${sessionName} Today`;

    const formattedTime = scheduledTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const plainText = `
Hi ${userName},

This is a reminder about your scheduled workout:

Session: ${sessionName}
Time: ${formattedTime}
${exerciseCount ? `Exercises: ${exerciseCount}` : ''}

Get ready to crush your training! 💪

Open RYTHM to view your workout details and start logging.

---
RYTHM Training Platform
`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .session-box { background: #f3f4f6; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; }
    .detail { margin: 8px 0; }
    .emoji { font-size: 48px; text-align: center; margin: 20px 0; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">💪 Workout Reminder</h2>
    </div>
    <div class="content">
      <p>Hi <strong>${userName}</strong>,</p>
      
      <p>This is a reminder about your scheduled workout:</p>
      
      <div class="session-box">
        <div class="detail">
          <strong>Session:</strong> ${sessionName}
        </div>
        <div class="detail">
          <strong>Time:</strong> ${formattedTime}
        </div>
        ${exerciseCount ? `<div class="detail"><strong>Exercises:</strong> ${exerciseCount}</div>` : ''}
      </div>
      
      <div class="emoji">💪</div>
      
      <p style="text-align: center; font-size: 18px; color: #667eea;">
        <strong>Get ready to crush your training!</strong>
      </p>
      
      <p>Open RYTHM to view your workout details and start logging your sets.</p>
    </div>
    <div class="footer">
      This is an automated reminder from RYTHM Training Platform.
    </div>
  </div>
</body>
</html>
`;

    return this.sendEmail({
      to: userEmail,
      subject,
      plainText,
      html,
      emailType: 'workout_reminder',
      metadata: {
        sessionName,
        scheduledTime: scheduledTime.toISOString(),
        exerciseCount,
      },
    });
  }

  /**
   * Send admin alert for system events
   * Notifies admins about critical system events, security issues, or resource limits
   */
  async sendAdminAlert(params: AdminAlertParams): Promise<{ success: boolean; error?: string }> {
    const { adminEmail, alertType, severity, subject, message, details } = params;

    const severityEmoji = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      critical: '🚨',
    };

    const severityColor = {
      info: '#3b82f6',
      warning: '#f59e0b',
      error: '#ef4444',
      critical: '#dc2626',
    };

    const fullSubject = `${severityEmoji[severity]} [${severity.toUpperCase()}] ${subject}`;

    const plainText = `
RYTHM Admin Alert
${severityEmoji[severity]} ${severity.toUpperCase()} - ${alertType.toUpperCase().replace('_', ' ')}

${message}

${details ? `\nDetails:\n${JSON.stringify(details, null, 2)}` : ''}

Timestamp: ${new Date().toISOString()}

---
This is an automated alert from RYTHM Training Platform.
Please investigate and take appropriate action if needed.
`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${severityColor[severity]}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .alert-type { background: #f3f4f6; padding: 10px; margin: 15px 0; border-left: 4px solid ${severityColor[severity]}; }
    .details { background: #f9fafb; padding: 15px; margin: 15px 0; border-radius: 4px; font-family: monospace; font-size: 12px; overflow-x: auto; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">${severityEmoji[severity]} Admin Alert: ${severity.toUpperCase()}</h2>
    </div>
    <div class="content">
      <div class="alert-type">
        <strong>Alert Type:</strong> ${alertType.toUpperCase().replace(/_/g, ' ')}
      </div>
      
      <p><strong>Message:</strong></p>
      <p>${message}</p>
      
      ${details ? `
        <p><strong>Details:</strong></p>
        <div class="details">
          <pre>${JSON.stringify(details, null, 2)}</pre>
        </div>
      ` : ''}
      
      <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
        <strong>Timestamp:</strong> ${new Date().toISOString()}
      </p>
      
      <p style="margin-top: 20px; padding: 12px; background: #fef3c7; border-left: 4px solid #f59e0b;">
        ⚠️ Please investigate and take appropriate action if needed.
      </p>
    </div>
    <div class="footer">
      This is an automated alert from RYTHM Training Platform.
    </div>
  </div>
</body>
</html>
`;

    return this.sendEmail({
      to: adminEmail,
      subject: fullSubject,
      plainText,
      html,
      emailType: 'admin_alert',
      metadata: {
        alertType,
        severity,
        details,
      },
    });
  }

  // Helper methods

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if email service is properly configured
   */
  isReady(): boolean {
    return this.isConfigured;
  }

  /**
   * Get sender address for reference
   */
  getSenderAddress(): string {
    return this.senderAddress;
  }
}

// Export singleton instance
export const emailService = new EmailService();
