CREATE SCHEMA IF NOT EXISTS billing;

CREATE TABLE billing.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    monthly_limit INT NOT NULL,
    overage_price_cents INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE billing.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_id UUID NOT NULL,
    plan_id UUID NOT NULL REFERENCES billing.plans(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'cancelled', 'suspended')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE billing.usage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_id UUID NOT NULL,
    month DATE NOT NULL,
    count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (lab_id, month)
);

-- Seed default plans
INSERT INTO billing.plans (name, monthly_limit, overage_price_cents) VALUES
    ('bronze', 40, 5000),
    ('silver', 80, 5000),
    ('gold', 145, 5000),
    ('platinum', 300, 5000),
    ('bundle', 300, 4000);

CREATE INDEX idx_subscriptions_lab_id ON billing.subscriptions(lab_id);
CREATE INDEX idx_usage_records_lab_month ON billing.usage_records(lab_id, month);
