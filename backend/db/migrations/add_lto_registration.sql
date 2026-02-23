-- Create LTO registration tracking table
CREATE TABLE IF NOT EXISTS lto_registrations (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id),
    vehicle_unit_id INTEGER REFERENCES vehicle_units(id),
    -- Basic Information
    plate_number VARCHAR(20),
    engine_number VARCHAR(50) NOT NULL,
    chassis_number VARCHAR(50) NOT NULL,
    mv_file_number VARCHAR(50),
    cr_number VARCHAR(50), -- Certificate of Registration
    or_number VARCHAR(50), -- Official Receipt
    
    -- Important Dates
    registration_date DATE,
    expiration_date DATE,
    
    -- Documents Status
    stencil_status VARCHAR(20) DEFAULT 'pending' CHECK (stencil_status IN ('pending', 'completed', 'not_needed')),
    insurance_status VARCHAR(20) DEFAULT 'pending' CHECK (insurance_status IN ('pending', 'completed')),
    emission_status VARCHAR(20) DEFAULT 'pending' CHECK (emission_status IN ('pending', 'completed', 'not_needed')),
    
    -- TPL Insurance Details
    insurance_provider VARCHAR(100),
    insurance_policy_number VARCHAR(50),
    insurance_expiry DATE,
    
    -- LTO Requirements Status
    csr_status VARCHAR(20) DEFAULT 'pending' CHECK (csr_status IN ('pending', 'completed')), -- Certificate of Stock Report
    dir_status VARCHAR(20) DEFAULT 'pending' CHECK (dir_status IN ('pending', 'completed')), -- Dealer's Initial Report
    prf_status VARCHAR(20) DEFAULT 'pending' CHECK (prf_status IN ('pending', 'completed')), -- Police Report File
    
    -- Fees and Payments
    registration_fee DECIMAL(10,2),
    insurance_fee DECIMAL(10,2),
    
    -- Overall Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'renewed')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional Notes
    remarks TEXT,
    
    -- Create indexes for frequent queries
    CONSTRAINT unique_plate_number UNIQUE (plate_number),
    CONSTRAINT unique_mv_file UNIQUE (mv_file_number)
);

-- Create index for querying by sale
CREATE INDEX idx_lto_reg_sale ON lto_registrations(sale_id);

-- Create index for status queries
CREATE INDEX idx_lto_reg_status ON lto_registrations(status);

-- Create trigger to update timestamp
CREATE OR REPLACE FUNCTION update_lto_registration_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lto_registration_timestamp
    BEFORE UPDATE ON lto_registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_lto_registration_timestamp();
