-- Create a table to hold transferred units history, combining key fields
-- from inventory_movements and vehicle_units so transferred entries are not
-- mixed with active inventory.

CREATE TABLE IF NOT EXISTS transferred_history (
  id                      SERIAL PRIMARY KEY,
  -- inventory_movements-like fields
  branch_id               INT NOT NULL,
  item_id                 INT NOT NULL,
  date_received           DATE NOT NULL,
  supplier_id             INT,
  dr_no                   VARCHAR(50),
  si_no                   VARCHAR(50),
  cost                    NUMERIC(12,2) NOT NULL DEFAULT 0,
  beginning_qty           INT DEFAULT 0,
  purchased_qty           INT DEFAULT 0,
  transferred_qty         INT DEFAULT 1,
  sold_qty                INT DEFAULT 0,
  ending_qty              INT,
  remarks                 TEXT,
  created_at              TIMESTAMPTZ DEFAULT now(),
  srp                     NUMERIC(12,2),
  margin                  NUMERIC(12,2) DEFAULT 0,
  color                   VARCHAR(50),
  status                  VARCHAR(20) DEFAULT 'transferred',

  -- vehicle_units-like fields
  chassis_no              VARCHAR(100),
  engine_no               VARCHAR(100),
  unit_number             INT DEFAULT 1,
  unit_created_at         TIMESTAMPTZ DEFAULT now(),
  unit_status             VARCHAR(20) DEFAULT 'transferred',

  -- optional backlink to original ids if ever needed
  original_inventory_id   INT,
  original_vehicle_unit_id INT,

  CONSTRAINT fk_trans_hist_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE NO ACTION,
  CONSTRAINT fk_trans_hist_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE NO ACTION,
  CONSTRAINT fk_trans_hist_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE NO ACTION
);

CREATE INDEX IF NOT EXISTS idx_trans_hist_engine ON transferred_history(engine_no);
CREATE INDEX IF NOT EXISTS idx_trans_hist_chassis ON transferred_history(chassis_no);
CREATE INDEX IF NOT EXISTS idx_trans_hist_branch ON transferred_history(branch_id);
CREATE INDEX IF NOT EXISTS idx_trans_hist_item ON transferred_history(item_id);
