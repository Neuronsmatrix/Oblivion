CREATE SCHEMA IF NOT EXISTS labs;

CREATE TABLE labs.batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    total_items INT NOT NULL,
    processed_items INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE labs.batch_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES labs.batches(id) ON DELETE CASCADE,
    image_key VARCHAR(512) NOT NULL,
    case_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_batches_lab_id ON labs.batches(lab_id);
CREATE INDEX idx_batch_items_batch_id ON labs.batch_items(batch_id);
