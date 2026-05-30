CREATE SCHEMA IF NOT EXISTS reference;

CREATE TABLE IF NOT EXISTS reference.syndromes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    omim_id VARCHAR(20),
    description TEXT,
    prevalence VARCHAR(100),
    inheritance VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reference.hpo_terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hpo_id VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    definition TEXT,
    parent_id UUID REFERENCES reference.hpo_terms(id)
);

CREATE TABLE IF NOT EXISTS reference.syndrome_hpo (
    syndrome_id UUID NOT NULL REFERENCES reference.syndromes(id) ON DELETE CASCADE,
    hpo_term_id UUID NOT NULL REFERENCES reference.hpo_terms(id) ON DELETE CASCADE,
    PRIMARY KEY (syndrome_id, hpo_term_id)
);

CREATE INDEX IF NOT EXISTS idx_syndromes_name ON reference.syndromes(name);
CREATE INDEX IF NOT EXISTS idx_hpo_terms_hpo_id ON reference.hpo_terms(hpo_id);
CREATE INDEX IF NOT EXISTS idx_hpo_terms_name ON reference.hpo_terms(name);
