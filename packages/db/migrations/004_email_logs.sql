-- Email Logs Migration
-- Tracks all emails sent by the RYTHM platform for auditing and debugging

-- Create email log type enum
CREATE TYPE email_type AS ENUM (
  'backup_notification',
  'password_reset',
  'workout_reminder',
  'admin_alert',
  'generic'
);

CREATE TYPE email_status AS ENUM (
  'pending',
  'sent',
  'failed',
  'delivered',
  'bounced'
);

-- Email logs table
CREATE TABLE email_logs (
    email_log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    
    -- Email metadata
    email_type email_type NOT NULL DEFAULT 'generic',
    status email_status NOT NULL DEFAULT 'pending',
    
    -- Recipients
    to_address TEXT NOT NULL,
    from_address TEXT NOT NULL,
    reply_to_address TEXT,
    
    -- Content
    subject TEXT NOT NULL,
    plain_text_body TEXT NOT NULL,
    html_body TEXT,
    
    -- Sending details
    message_id TEXT, -- Azure Communication Services message ID
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    
    -- Metadata for context
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_email_logs_tenant_id ON email_logs(tenant_id);
CREATE INDEX idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_to_address ON email_logs(to_address);
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at DESC);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at DESC) WHERE sent_at IS NOT NULL;

-- Updated_at trigger
CREATE TRIGGER update_email_logs_updated_at
    BEFORE UPDATE ON email_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE email_logs IS 'Audit log of all emails sent by RYTHM platform';
COMMENT ON COLUMN email_logs.message_id IS 'Azure Communication Services message ID for tracking delivery';
COMMENT ON COLUMN email_logs.metadata IS 'Additional context (e.g., backup_id, session_id, alert_type)';

-- Sample query to get email statistics
-- SELECT 
--   email_type,
--   status,
--   COUNT(*) as count,
--   AVG(EXTRACT(EPOCH FROM (delivered_at - sent_at))) as avg_delivery_time_seconds
-- FROM email_logs
-- WHERE sent_at > NOW() - INTERVAL '7 days'
-- GROUP BY email_type, status
-- ORDER BY email_type, status;
