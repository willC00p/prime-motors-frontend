-- Create loan_payments table to track monthly payments
CREATE TABLE IF NOT EXISTS loan_payments (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL,
    amount_paid DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50),
    reference_number VARCHAR(100),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
    CONSTRAINT fk_sale_id FOREIGN KEY (sale_id) REFERENCES sales(id)
);

-- Add payment status and remaining balance to sales table
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'ongoing' CHECK (payment_status IN ('ongoing', 'completed', 'default')),
ADD COLUMN IF NOT EXISTS remaining_balance DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS next_payment_date DATE;
