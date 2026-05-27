CREATE SCHEMA IF NOT EXISTS cases;

CREATE TABLE cases.cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    patient_name VARCHAR(255),
    patient_age INT,
    patient_ethnicity VARCHAR(100),
    image_key VARCHAR(512) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cases.diagnoses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases.cases(id) ON DELETE CASCADE,
    syndrome_id UUID,
    syndrome_name VARCHAR(255) NOT NULL,
    confidence DOUBLE PRECISION NOT NULL,
    rank INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cases_user_id ON cases.cases(user_id);
CREATE INDEX idx_cases_status ON cases.cases(status);
CREATE INDEX idx_diagnoses_case_id ON cases.diagnoses(case_id);
