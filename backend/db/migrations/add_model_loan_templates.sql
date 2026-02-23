-- Create model_loan_templates table
CREATE TABLE IF NOT EXISTS model_loan_templates (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    term_months INTEGER NOT NULL CHECK (term_months IN (12, 24, 36)),
    loan_amount DECIMAL(12,2) NOT NULL,
    downpayment_percentage DECIMAL(5,2) NOT NULL,
    rebates_commission DECIMAL(12,2) NOT NULL,
    monthly_amortization DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(item_id, term_months)
);
