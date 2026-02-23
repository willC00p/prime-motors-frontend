-- First insert the items
INSERT INTO items (item_no, brand, model, color)
VALUES 
    ('SKYGO-BOLT-150', 'SKYGO', 'P1 BOLT 150', ARRAY['BLACK/SILVER', 'BROWN/SILVER']),
    ('SKYGO-LANCE-150', 'SKYGO', 'M1 LANCE 150', ARRAY['WHITE/GOLD', 'BLACK/GOLD']),
    ('MONARCH-OMNI-125', 'MONARCH', 'OMNI 125', ARRAY['SILVER/GRAY']),
    ('MONARCH-BOLT-150', 'MONARCH', 'P1 BOLT 150', ARRAY['BROWN/SILVER', 'BLACK/SILVER'])
ON CONFLICT (item_no) DO UPDATE 
SET color = ARRAY(SELECT DISTINCT UNNEST(items.color || EXCLUDED.color))
RETURNING id, model;

-- Create inventory movements for these units
INSERT INTO inventory_movements (
    branch_id,
    item_id,
    date_received,
    cost,
    purchased_qty,
    sold_qty,
    ending_qty,
    status,
    srp
)
SELECT 
    1 as branch_id,
    i.id as item_id,
    ('2025-07-01'::date + (s.* || ' days')::interval) as date_received,
    0 as cost,
    1 as purchased_qty,
    1 as sold_qty,
    0 as ending_qty,
    'sold' as status,
    CASE 
        WHEN i.model = 'P1 BOLT 150' THEN 115000.00
        WHEN i.model = 'M1 LANCE 150' THEN 97000.00
        WHEN i.model = 'OMNI 125' THEN 115000.00
    END as srp
FROM generate_series(0, 12) s
CROSS JOIN LATERAL (
    SELECT id, model FROM items
    WHERE model IN ('P1 BOLT 150', 'M1 LANCE 150', 'OMNI 125')
    ORDER BY CASE 
        WHEN s.* < 4 THEN 'P1 BOLT 150'
        WHEN s.* < 6 THEN 'M1 LANCE 150'
        WHEN s.* < 8 THEN 'OMNI 125'
        ELSE 'P1 BOLT 150'
    END = model DESC, id
    LIMIT 1
) i;

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
    (1, '2025-07-10', 'Financing', 'Belmonte', 'Arnel', 'Mapindan', '138 Albany st Brgy Silangan Cubao Quezon City', '9121109750', '0000006', '0000006', 97000.00, 97000.00, NULL, NULL, NULL, NULL),
    -- Sales record #6
    (1, '2025-07-12', 'Financing', 'Osma', 'Vincent', 'Arce', 'blk 67 L18 P6 Silangan San Mateo Rizal', '9615489353', '0000007', '0000007', 115000.00, 115000.00, NULL, NULL, NULL, NULL),
    -- Sales record #7
    (1, '2025-07-17', 'Financing', 'Sevilla', 'Julius Ceasar', 'Trinidad', '2B KJ St East Kamias Quezon City', '9455781551', '0000008', '0000008', 115000.00, 115000.00, NULL, NULL, NULL, NULL),
    -- Sales record #8
    (1, '2025-07-17', 'Financing', 'Beltran', 'Agnes', 'Paras', '2218 Cngressional Tower Center Congressiona Ave Q.C', '9668015624', '0000009', '0000009', 115000.00, 115000.00, NULL, NULL, NULL, NULL),
    -- Sales record #9
    (1, '2025-07-19', 'Financing', 'Aro', 'Christian', 'Ludia', 'P3 PCJ Cruz BF Homes Parañaque City', '9300055537', '0000010', '0000010', 97000.00, 97000.00, NULL, NULL, NULL, NULL),
    -- Sales record #10
    (1, '2025-07-22', 'Financing', 'Lantin', 'Mark Angelo', 'Casipit', '39 langka st, Brgy Project 2 Quezon City', '9670331062', '0000011', '0000011', 115000.00, 115000.00, NULL, NULL, NULL, NULL),
    -- Sales record #11
    (1, '2025-07-31', 'Financing', 'Ebora', 'Michael Charles', 'Aguinaldo', '128 Gen Luna St Brgy Ususan Taguig City', '9674632784', '0000012', '0000012', 115000.00, 115000.00, NULL, NULL, NULL, NULL),
    -- Sales record #12
    (1, '2025-07-31', 'Financing', 'Labramonte', 'Arjay', 'Garcia', '119 Santa Cecilla St Brgy Maly San Mateo Rizal', '9670143216', '0000013', '0000013', 115000.00, 115000.00, NULL, NULL, NULL, NULL),
    -- Sales record #13
    (1, '2025-08-08', 'Financing', 'Francisco', 'Alvin', 'Bajado', 'Blk 6 Kaingin 1 Brgy Pansol Quezon City', '9649455604', '0001', '0001', 97000.00, 97000.00, NULL, NULL, NULL, NULL);

-- Insert vehicle units with inventory IDs and increment unit numbers
WITH inv_movements AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn 
    FROM inventory_movements 
    WHERE status = 'sold' AND item_id IS NOT NULL
    ORDER BY id 
    LIMIT 13
)
INSERT INTO vehicle_units (
    inventory_id,
    engine_no,
    chassis_no,
    unit_number,
    status
)
SELECT 
    m.id as inventory_id,
    CASE rn
        WHEN 1 THEN '1P57MJS1062811'
        WHEN 2 THEN '1P57MJS1062802'
        WHEN 3 THEN '1P57MJR1341803'
        WHEN 4 THEN '1P57MJS1118543'
        WHEN 5 THEN '1P57MJR1297908'
        WHEN 6 THEN '1P57MJS1121581'
        WHEN 7 THEN '1P52QMIRTC01413'
        WHEN 8 THEN '1P57MJS1118532'
        WHEN 9 THEN '1P5MJR1343561'
        WHEN 10 THEN '1P57MJS1118535'
        WHEN 11 THEN '1P57MJS1120645'
        WHEN 12 THEN '1P57MJS1121560'
        WHEN 13 THEN '1P57MJR1297850'
    END as engine_no,
    CASE rn
        WHEN 1 THEN 'LX8TDK8G2SB000098'
        WHEN 2 THEN 'LX8TDK8G1SB000089'
        WHEN 3 THEN 'LX8TDK8G0RB002412'
        WHEN 4 THEN 'LX8TDK8GSB000715'
        WHEN 5 THEN 'KX8TDK805RB001035'
        WHEN 6 THEN 'LX8TDK8GXSB000964'
        WHEN 7 THEN 'LWMTJV1C5RT001413'
        WHEN 8 THEN 'LX8TDK8G9SB000728'
        WHEN 9 THEN 'LX8TDK8U8RB001451'
        WHEN 10 THEN 'LX8TDK8G3SB000711'
        WHEN 11 THEN 'LX8TDK8G1SB000917'
        WHEN 12 THEN 'LX8TDK8G9SB000986'
        WHEN 13 THEN 'LX8TDK8U4RB000989'
    END as chassis_no,
    rn as unit_number,
    'sold' as status
FROM inv_movements m;

-- Link sales to vehicle units through sales_items, including item_id
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
        v.id as vehicle_unit_id,
        i.item_id,
        ROW_NUMBER() OVER (ORDER BY v.id) as rn
    FROM vehicle_units v
    JOIN inventory_movements i ON i.id = v.inventory_id
    WHERE v.status = 'sold'
    ORDER BY v.id 
    LIMIT 13
)
INSERT INTO sales_items (
    sale_id,
    vehicle_unit_id,
    item_id,
    qty,
    unit_price,
    amount
)
SELECT 
    s.sale_id,
    v.vehicle_unit_id,
    v.item_id,
    1 as qty,
    s.total_amount as unit_price,
    s.total_amount as amount
FROM sale_data s
JOIN vehicle_data v ON v.rn = s.rn;
