CREATE SCHEMA IF NOT EXISTS notifier;

CREATE TABLE IF NOT EXISTS notifier.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    read BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifier.notifications(user_id, created_at DESC);
