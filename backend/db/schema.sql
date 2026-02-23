-- 1. Branches (for INVENTORY locations)
CREATE TABLE branches (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    address         TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Suppliers (for RECEIVED_FROM, PO contact)
CREATE TABLE suppliers (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    tin_number      VARCHAR(50),
    contact_person  VARCHAR(100),
    contact_number  VARCHAR(50),
    address         TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Items catalog
CREATE TABLE items (
    id              SERIAL PRIMARY KEY,
    item_no         VARCHAR(50) NOT NULL UNIQUE,
    brand           VARCHAR(100),
    model           VARCHAR(100),
    color           VARCHAR(50),
    engine_no       VARCHAR(100),
    chassis_no      VARCHAR(100),
    srp             NUMERIC(12,2),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Inventory records (stock movements)
CREATE TABLE inventory_movements (
    id                  SERIAL PRIMARY KEY,
    branch_id           INT NOT NULL REFERENCES branches(id),
    item_id             INT NOT NULL REFERENCES items(id),
    date_received       DATE NOT NULL,
    supplier_id         INT     REFERENCES suppliers(id),
    dr_no               VARCHAR(50),
    si_no               VARCHAR(50),
    cost                NUMERIC(12,2) NOT NULL,  -- purchased price
    srp                 NUMERIC(12,2),  -- selling price
    margin              NUMERIC(12,2) GENERATED ALWAYS AS (
                          CASE WHEN srp IS NOT NULL AND cost > 0 
                          THEN ((srp - cost) / cost) * 100 
                          ELSE 0 
                          END
                        ) STORED,
    beginning_qty       INT     DEFAULT 0,
    purchased_qty       INT     DEFAULT 0,
    transferred_qty     INT     DEFAULT 0,
    sold_qty            INT     DEFAULT 0,
    ending_qty          INT     GENERATED ALWAYS AS (
                          beginning_qty
                          + purchased_qty
                          + transferred_qty
                          - sold_qty
                        ) STORED,
    remarks             TEXT,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Purchase Orders
CREATE TABLE purchase_orders (
    id                  SERIAL PRIMARY KEY,
    po_number           VARCHAR(50) NOT NULL UNIQUE,
    branch_id           INT     REFERENCES branches(id),
    supplier_id         INT     REFERENCES suppliers(id),
    date_issued         DATE    NOT NULL,
    due_date            DATE,
    contact_person      VARCHAR(100),
    contact_number      VARCHAR(50),
    payment_term        VARCHAR(100),
    prompt_rebate_pct   NUMERIC(5,2),
    created_by          VARCHAR(100),
    approved_by         VARCHAR(100),
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Line‑items on each PO
CREATE TABLE purchase_order_items (
    id                  SERIAL PRIMARY KEY,
    purchase_order_id   INT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    item_id             INT NOT NULL REFERENCES items(id),
    model_code          VARCHAR(50),
    color               VARCHAR(50),
    quantity            INT NOT NULL,
    unit_price          NUMERIC(12,2) NOT NULL,
    amount              NUMERIC(14,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- 7. Sales transactions (for SALES)
CREATE TABLE sales (
    id                  SERIAL PRIMARY KEY,
    branch_id           INT REFERENCES branches(id),
    date_sold           DATE NOT NULL,
    customer_name       VARCHAR(150),
    dr_no               VARCHAR(50),
    si_no               VARCHAR(50),
    total_amount        NUMERIC(14,2) NOT NULL,
    payment_method      VARCHAR(50)   -- CASH, DP, INSTALLMENT, etc.
);

-- 8. Sales line‑items
CREATE TABLE sales_items (
    id                  SERIAL PRIMARY KEY,
    sale_id             INT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    item_id             INT NOT NULL REFERENCES items(id),
    qty                  INT NOT NULL,
    unit_price          NUMERIC(12,2) NOT NULL,
    amount              NUMERIC(14,2) GENERATED ALWAYS AS (qty * unit_price) STORED
);

-- 9. Payment schedules (for both PO rebates & installment plans)
CREATE TABLE payment_schedules (
    id                  SERIAL PRIMARY KEY,
    reference_type      VARCHAR(20) NOT NULL,  -- 'PO' or 'SALE'
    reference_id        INT NOT NULL,          -- purchase_orders.id or sales.id
    due_date            DATE    NOT NULL,
    amount_due          NUMERIC(14,2) NOT NULL,
    paid_amount         NUMERIC(14,2) DEFAULT 0,
    paid_date           DATE,
    status              VARCHAR(20) DEFAULT 'PENDING',  -- PENDING, PAID, LATE
    remarks             TEXT
);

-- 10. Analytics / Forecast views (example: monthly sales summary)
CREATE MATERIALIZED VIEW monthly_sales_summary AS
SELECT
  DATE_TRUNC('month', s.date_sold) AS month,
  COUNT(DISTINCT s.id) AS total_invoices,
  SUM(si.amount)         AS total_sales,
  AVG(si.amount)         AS avg_invoice_value
FROM sales s
JOIN sales_items si ON si.sale_id = s.id
GROUP BY 1
WITH DATA;

-- 11. Indexes for performance
CREATE INDEX idx_inv_movements_item   ON inventory_movements(item_id);
CREATE INDEX idx_sales_date           ON sales(date_sold);
CREATE INDEX idx_po_due_date          ON purchase_orders(due_date);
