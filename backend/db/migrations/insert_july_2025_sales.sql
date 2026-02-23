-- First insert the items
INSERT INTO items (item_no, brand, model, color)
VALUES 
    ('SKYGO-BOLT-150', 'SKYGO', 'P1 BOLT 150', ARRAY['BLACK/SILVER', 'BROWN/SILVER']),
    ('SKYGO-LANCE-150', 'SKYGO', 'M1 LANCE 150', ARRAY['WHITE/GOLD', 'BLACK/GOLD']),
    ('MONARCH-OMNI-125', 'MONARCH', 'OMNI 125', ARRAY['SILVER/GRAY']),
    ('MONARCH-BOLT-150', 'MONARCH', 'P1 BOLT 150', ARRAY['BROWN/SILVER', 'BLACK/SILVER'])
ON CONFLICT (item_no) DO UPDATE 
SET color = ARRAY(SELECT DISTINCT UNNEST(items.color || EXCLUDED.color));

-- Create inventory movements for these units
WITH item_models AS (
    SELECT id, model, brand
    FROM items
    WHERE model IN ('P1 BOLT 150', 'M1 LANCE 150', 'OMNI 125')
)
INSERT INTO inventory_movements (
    branch_id,
    item_id,
    date_received,
    cost,
    purchased_qty,
    sold_qty,
    ending_qty,
    status
)
SELECT 
    1 as branch_id,
    m.id as item_id,
    '2025-07-01'::date as date_received,
    0 as cost,
    1 as purchased_qty,
    1 as sold_qty,
    0 as ending_qty,
    'sold' as status
FROM generate_series(1, 13) s
CROSS JOIN LATERAL (
    SELECT id FROM item_models 
    ORDER BY id 
    LIMIT 1
) m;

-- Insert sales data for July-August 2025
INSERT INTO sales (
    branch_id,
    date_sold,
    category_of_sales,
    last_name,
    first_name,
    middle_name,
    address,
    contact_no,
    dr_no,
    si_no,
    total_amount,
    loan_amount,
    terms,
    downpayment_percentage,
    rebates_commission,
    monthly_amortization
) VALUES
    -- Sales record #1
    (1, '2025-07-01', 'Financing', 'Luto', 'Atanacio Jr', 'Ty', '#54 buensoceso homes 2 Brgy Merville Paranaque', '9171625999', '0000002', '0000002', 115000.00, 115000.00, 36, 5, 200, 5741),
    -- Sales record #2
    (1, '2025-07-05', 'Financing', 'Servas', 'Jimboy', 'Papa', 'B2 L15 Westville 2A Ligas III Bacoor Cavite', '9542297123', '0000003', '0000003', 115000.00, 115000.00, 36, 5, 200, 5741),
    -- Sales record #3
    (1, '2025-07-05', 'Financing', 'Valleja', 'Mercidito', 'Avila', 'P1 B11 L21 Parklane Subd Brgy Santiago General Trias Cavite', '9154879564', '0000004', '0000004', 115000.00, 115000.00, 36, 5, 200, 5741),
    -- Sales record #4
    (1, '2025-07-08', 'Financing', 'Custodio', 'Ryan', 'Pardo', '106 Impieral St Brgy E. Rod Cubao Quezon City', '9273481722', '0000005', '0000005', 115000.00, 115000.00, 24, 6.5, 200, 7447),
    -- Sales record #5
    (1, '2025-07-10', 'Financing', 'Belmonte', 'Arnel', 'Mapindan', '138 Albany st Brgy Silangan Cubao Quezon City', '9121109750', '0000006', '0000006', 97000.00, NULL, NULL, NULL, NULL, NULL),
    -- Sales record #6
    (1, '2025-07-12', 'Financing', 'Osma', 'Vincent', 'Arce', 'blk 67 L18 P6 Silangan San Mateo Rizal', '9615489353', '0000007', '0000007', 115000.00, NULL, NULL, NULL, NULL, NULL),
    -- Sales record #7
        (1, '2025-07-17', 'Financing', 'Sevilla', 'Julius Ceasar', 'Trinidad', '2B KJ St East Kamias Quezon City', '9455781551', '0000008', '0000008', 115000.00, NULL, NULL, NULL, NULL, NULL),
    -- Sales record #8
    (1, '2025-07-17', 'Financing', 'Beltran', 'Agnes', 'Paras', '2218 Cngressional Tower Center Congressiona Ave Q.C', '9668015624', '0000009', '0000009', 115000.00, NULL, NULL, NULL, NULL, NULL),
    -- Sales record #9
    (1, '2025-07-19', 'Financing', 'Aro', 'Christian', 'Ludia', 'P3 PCJ Cruz BF Homes Parañaque City', '9300055537', '0000010', '0000010', 97000.00, NULL, NULL, NULL, NULL, NULL),
    -- Sales record #10
    (1, '2025-07-22', 'Financing', 'Lantin', 'Mark Angelo', 'Casipit', '39 langka st, Brgy Project 2 Quezon City', '9670331062', '0000011', '0000011', 115000.00, NULL, NULL, NULL, NULL, NULL),
    -- Sales record #11
    (1, '2025-07-31', 'Financing', 'Ebora', 'Michael Charles', 'Aguinaldo', '128 Gen Luna St Brgy Ususan Taguig City', '9674632784', '0000012', '0000012', 115000.00, NULL, NULL, NULL, NULL, NULL),
    -- Sales record #12
    (1, '2025-07-31', 'Financing', 'Labramonte', 'Arjay', 'Garcia', '119 Santa Cecilla St Brgy Maly San Mateo Rizal', '9670143216', '0000013', '0000013', 115000.00, NULL, NULL, NULL, NULL, NULL),
    -- Sales record #13
    (1, '2025-08-08', 'Financing', 'Francisco', 'Alvin', 'Bajado', 'Blk 6 Kaingin 1 Brgy Pansol Quezon City', '9649455604', '0001', '0001', 97000.00, NULL, NULL, NULL, NULL, NULL);
    -- Sales record #8
    (1, '2025-07-17', 'Financing', 'Beltran', 'Agnes', 'Paras', '2218 Cngressional Tower Center Congressiona Ave Q.C', '9668015624', '0000009', '0000009', NULL, NULL, NULL, NULL, NULL, NULL),
    -- Sales record #9
    (1, '2025-07-19', 'Financing', 'Aro', 'Christian', 'Ludia', 'P3 PCJ Cruz BF Homes Parañaque City', '9300055537', '0000010', '0000010', 97000.00, NULL, NULL, NULL, NULL, NULL),
    -- Sales record #10
    (1, '2025-07-22', 'Financing', 'Lantin', 'Mark Angelo', 'Casipit', '39 langka st, Brgy Project 2 Quezon City', '9670331062', '0000011', '0000011', NULL, NULL, NULL, NULL, NULL, NULL),
    -- Sales record #11
    (1, '2025-07-31', 'Financing', 'Ebora', 'Michael Charles', 'Aguinaldo', '128 Gen Luna St Brgy Ususan Taguig City', '9674632784', '0000012', '0000012', NULL, NULL, NULL, NULL, NULL, NULL),
    -- Sales record #12
    (1, '2025-07-31', 'Financing', 'Labramonte', 'Arjay', 'Garcia', '119 Santa Cecilla St Brgy Maly San Mateo Rizal', '9670143216', '0000013', '0000013', 0.00, NULL, NULL, NULL, NULL, NULL),
    -- Sales record #13
    (1, '2025-08-08', 'Financing', 'Francisco', 'Alvin', 'Bajado', 'Blk 6 Kaingin 1 Brgy Pansol Quezon City', '9649455604', '0001', '0001', NULL, NULL, NULL, NULL, NULL, NULL);

-- Now insert or update the items and their inventory
WITH item_data (brand, model, color) AS (
    VALUES 
    ('SKYGO', 'P1 BOLT 150', ARRAY['BLACK/SILVER']),
    ('SKYGO', 'M1 LANCE 150', ARRAY['WHITE/GOLD', 'BLACK/GOLD']),
    ('MONARCH', 'OMNI 125', ARRAY['SILVER/GRAY']),
    ('MONARCH', 'P1 BOLT 150', ARRAY['BROWN/SILVER', 'BLACK/SILVER'])
)
INSERT INTO items (brand, model, color)
SELECT brand, model, color FROM item_data
ON CONFLICT (brand, model) DO UPDATE
SET color = ARRAY(SELECT DISTINCT UNNEST(items.color || EXCLUDED.color));

-- Insert vehicle units and link to sales
INSERT INTO vehicle_units (
    inventory_id,
    engine_no,
    chassis_no,
    status
) VALUES
    (NULL, '1P57MJS1062811', 'LX8TDK8G2SB000098', 'sold'),
    (NULL, '1P57MJS1062802', 'LX8TDK8G1SB000089', 'sold'),
    (NULL, '1P57MJR1341803', 'LX8TDK8G0RB002412', 'sold'),
    (NULL, '1P57MJS1118543', 'LX8TDK8GSB000715', 'sold'),
    (NULL, '1P57MJR1297908', 'KX8TDK805RB001035', 'sold'),
    (NULL, '1P57MJS1121581', 'LX8TDK8GXSB000964', 'sold'),
    (NULL, '1P52QMIRTC01413', 'LWMTJV1C5RT001413', 'sold'),
    (NULL, '1P57MJS1118532', 'LX8TDK8G9SB000728', 'sold'),
    (NULL, '1P5MJR1343561', 'LX8TDK8U8RB001451', 'sold'),
    (NULL, '1P57MJS1118535', 'LX8TDK8G3SB000711', 'sold'),
    (NULL, '1P57MJS1120645', 'LX8TDK8G1SB000917', 'sold'),
    (NULL, '1P57MJS1121560', 'LX8TDK8G9SB000986', 'sold'),
    (NULL, '1P57MJR1297850', 'LX8TDK8U4RB000989', 'sold');

-- Update sales with vehicle unit IDs once they are created
-- Link sales to vehicle units through sales_items
WITH sale_data AS (
    SELECT 
        s.id as sale_id,
        s.total_amount,
        ROW_NUMBER() OVER (ORDER BY s.date_sold, s.dr_no) as rn
    FROM sales s
    WHERE s.dr_no IN ('0000002', '0000003', '0000004', '0000005', '0000006', '0000007', 
                    '0000008', '0000009', '0000010', '0000011', '0000012', '0000013', '0001')
),
vehicle_data AS (
    SELECT 
        id as vehicle_unit_id,
        ROW_NUMBER() OVER (ORDER BY id) as rn
    FROM vehicle_units 
    WHERE status = 'sold'
    ORDER BY id 
    LIMIT 13
)
INSERT INTO sales_items (
    sale_id,
    vehicle_unit_id,
    qty,
    unit_price,
    amount
)
SELECT 
    s.sale_id,
    v.vehicle_unit_id,
    1 as qty,
    s.total_amount as unit_price,
    s.total_amount as amount
FROM sale_data s
JOIN vehicle_data v ON v.rn = s.rn;
