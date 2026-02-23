-- Base schema for prime motors database

CREATE TABLE IF NOT EXISTS branches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    item_no VARCHAR(50) UNIQUE NOT NULL,
    brand VARCHAR(100),
    model VARCHAR(100),
    color VARCHAR(50)[] DEFAULT '{}',
    engine_no VARCHAR(100),
    chassis_no VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    srp DECIMAL(12,2)
);

CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    tin_number VARCHAR(50),
    contact_person VARCHAR(100),
    contact_number VARCHAR(50),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_movements (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER NOT NULL REFERENCES branches(id),
    item_id INTEGER NOT NULL REFERENCES items(id),
    date_received DATE NOT NULL,
    supplier_id INTEGER REFERENCES suppliers(id),
    dr_no VARCHAR(50),
    si_no VARCHAR(50),
    cost DECIMAL(12,2) NOT NULL,
    beginning_qty INTEGER DEFAULT 0,
    purchased_qty INTEGER DEFAULT 0,
    transferred_qty INTEGER DEFAULT 0,
    sold_qty INTEGER DEFAULT 0,
    ending_qty INTEGER,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    srp DECIMAL(12,2),
    margin DECIMAL(12,2) GENERATED ALWAYS AS (
        CASE
            WHEN srp IS NOT NULL AND cost > 0 THEN ((srp - cost) / cost) * 100
            ELSE 0
        END
    ) STORED
);

CREATE INDEX idx_inv_movements_item ON inventory_movements(item_id);

CREATE TABLE IF NOT EXISTS vehicle_units (
    id SERIAL PRIMARY KEY,
    inventory_id INTEGER NOT NULL REFERENCES inventory_movements(id) ON DELETE CASCADE,
    chassis_no VARCHAR(100),
    engine_no VARCHAR(100),
    unit_number INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(inventory_id, unit_number)
);

CREATE INDEX idx_vehicle_units_inventory ON vehicle_units(inventory_id);

CREATE TABLE IF NOT EXISTS payment_schedules (
    id SERIAL PRIMARY KEY,
    reference_type VARCHAR(20) NOT NULL,
    reference_id INTEGER NOT NULL,
    due_date DATE NOT NULL,
    amount_due DECIMAL(14,2) NOT NULL,
    paid_amount DECIMAL(14,2) DEFAULT 0,
    paid_date DATE,
    status VARCHAR(20) DEFAULT 'PENDING',
    remarks TEXT
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    po_number VARCHAR(50) UNIQUE NOT NULL,
    branch_id INTEGER REFERENCES branches(id),
    supplier_id INTEGER REFERENCES suppliers(id),
    date_issued DATE NOT NULL,
    due_date DATE,
    contact_person VARCHAR(100),
    contact_number VARCHAR(50),
    payment_term VARCHAR(100),
    payment_mode VARCHAR(50),
    prompt_rebate_pct DECIMAL(5,2),
    prepared_by VARCHAR(100),
    checked_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_po_due_date ON purchase_orders(due_date);

CREATE TABLE IF NOT EXISTS purchase_order_items (
    id SERIAL PRIMARY KEY,
    purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES items(id),
    model_code VARCHAR(50),
    color VARCHAR(50),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    amount DECIMAL(14,2),
    delivery_status VARCHAR(20) DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER REFERENCES branches(id),
    date_sold DATE NOT NULL,
    customer_name VARCHAR(150),
    dr_no VARCHAR(50),
    si_no VARCHAR(50),
    total_amount DECIMAL(14,2) NOT NULL,
    payment_method VARCHAR(50)
);

CREATE INDEX idx_sales_date ON sales(date_sold);

CREATE TABLE IF NOT EXISTS sales_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES items(id),
    qty INTEGER NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    amount DECIMAL(14,2)
);
