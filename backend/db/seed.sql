-- Clear existing data
TRUNCATE branches, suppliers, items, inventory_movements CASCADE;

-- Seed data for branches
INSERT INTO branches (name, address) VALUES
('Main Branch', '123 Main Street, Metro Manila'),
('North Branch', '456 North Ave, Quezon City'),
('South Branch', '789 South Road, Alabang'),
('East Branch', '321 East Avenue, Marikina'),
('West Branch', '567 West Road, Pasig City'),
('Central Branch', '890 Central Ave, Mandaluyong City'),
('Makati Branch', '234 Ayala Ave, Makati City'),
('BGC Branch', '678 BGC Boulevard, Taguig City');

-- Additional Prime Motors branches provided by user
INSERT INTO branches (name, address) VALUES
('Prime Motors Baggao', 'Zone 1 San Jose Baggao Cagayan'),
('Prime Motors Aurora', 'National Highway, Brgy. San Jose, Aurora, Isabela'),
('Prime Motors Cauayan', 'District 3, Don Jose Canciller Avenue, Cauayan City, Isabela'),
('Prime Motors Ilagan', 'Brgy. Baligatan Ilagan city, Isabela'),
('Prime Motors Antipolo', 'Blk 1 Lot 54 Robinson Homes East, San Jose District 2, Antipolo City'),
('Prime Motors San Mateo', '374 General Luna Street Brgy. Guinayang San Mateo Rizal'),
('Prime Motors Gattaran', 'Centro norte, Gattaran, Cagayan'),
('Prime Motors Roxas', 'National Highway San Placido, Roxas Isabela'),
('Prime Motors Solana', 'Brgy Northeast Rizal St Centro Solana Cagayan'),
('Prime Motors Tumauini', 'PANIG-PALOS Building National Highway Brgy. Lingaling, Tumauini, Isabela'),
('Prime Motors Tuguegarao', 'Crdc Bldg., Diversion Rd. San Gabriel Vill, Tuguegarao City, Cagayan'),
('Prime Motors Kamias', '92 TRINIDAD BUILDING KAMIAS ROAD BRGY EAST KAMIAS QUEZON CITY'),
('Prime Motors Sta. Mesa', '4761 OLD STA MESA ST. BRGY. 597, STA MESA MANILA CITY');

-- Seed data for suppliers (Big 4 and Sky Go)
INSERT INTO suppliers (name, tin_number, contact_person, contact_number, address) VALUES
('Big 4 Motor Company', '123-456-789', 'James Rodriguez', '0917-111-2222', 'Big 4 Building, BGC, Taguig City'),
('Sky Go Motors', '987-654-321', 'Maria Santos', '0918-333-4444', 'Sky Tower, Ortigas Center, Pasig City'),
('Honda Philippines', '456-789-123', 'John Honda', '0917-555-6666', 'Laguna Industrial Park'),
('Yamaha Motors', '789-123-456', 'Mike Yamaha', '0918-777-8888', 'Batangas Business Center'),
('Kawasaki Motors', '234-567-890', 'Ken Kawasaki', '0917-999-0000', 'Kawasaki Plaza, Makati City'),
('Suzuki Philippines', '345-678-901', 'Sam Suzuki', '0918-222-3333', 'Suzuki Center, Quezon City'),
('KTM Asia Motorcycle', '456-789-012', 'Karl Thompson', '0917-444-5555', 'KTM Building, Muntinlupa City'),
('Royal Enfield PH', '567-890-123', 'Robert English', '0918-666-7777', 'Royal Plaza, Pasay City');

-- Seed data for items (motorcycles)
-- Big 4 Motor Company Models
INSERT INTO items (item_no, brand, model, color, engine_no, chassis_no) VALUES
('B4-THUNDER', 'Big 4', 'Thunder 250', ARRAY['Matte Black', 'Racing Red', 'Metallic Blue'], 'B4T250-001', 'B4C250-001'),
('B4-STORM', 'Big 4', 'Storm 150', ARRAY['Pearl White', 'Neon Green', 'Orange Burst'], 'B4S150-001', 'B4C150-001'),
('B4-CRUISE', 'Big 4', 'Cruiser 400', ARRAY['Vintage Brown', 'Chrome Silver', 'Deep Black'], 'B4C400-001', 'B4C400-001'),
('B4-SPRINT', 'Big 4', 'Sprint 125', ARRAY['Racing Yellow', 'Urban Gray', 'Fire Red'], 'B4S125-001', 'B4C125-001'),

-- Sky Go Models
('SG-FALCON', 'Sky Go', 'Falcon GT', ARRAY['Plasma Blue', 'Sunset Orange', 'Arctic White'], 'SGF200-001', 'SGC200-001'),
('SG-EAGLE', 'Sky Go', 'Eagle 250', ARRAY['Midnight Black', 'Desert Storm', 'Mountain Green'], 'SGE250-001', 'SGC250-001'),
('SG-HAWK', 'Sky Go', 'Hawk 150', ARRAY['Crystal White', 'Ruby Red', 'Sapphire Blue'], 'SGH150-001', 'SGC150-001'),
('SG-PHOENIX', 'Sky Go', 'Phoenix 180', ARRAY['Galaxy Black', 'Stellar Silver', 'Cosmic Red'], 'SGP180-001', 'SGC180-001'),

-- Honda Models
('HON-CLICK', 'Honda', 'Click 160', ARRAY['Pearl Red', 'Matte Black', 'Metallic Blue'], 'HCLICK-001', 'HCCLICK-001'),
('HON-PCX', 'Honda', 'PCX 160', ARRAY['Pearl White', 'Matte Black', 'Metallic Gray'], 'HPCX-001', 'HCPCX-001'),

-- Yamaha Models
('YAM-NMAX', 'Yamaha', 'NMAX 155', ARRAY['Tech Black', 'Racing Blue', 'Platinum Silver'], 'YNMAX-001', 'YCNMAX-001'),
('YAM-MIO', 'Yamaha', 'Mio Aerox', ARRAY['Race Blue', 'Vibrant Orange', 'Midnight Black'], 'YMIO-001', 'YCMIO-001');

-- Seed data for inventory movements
-- Big 4 Models Initial Stock
INSERT INTO inventory_movements 
(branch_id, item_id, date_received, supplier_id, dr_no, si_no, cost, beginning_qty, purchased_qty, ending_qty)
VALUES
(1, (SELECT id FROM items WHERE item_no = 'B4-THUNDER'), CURRENT_DATE, 1, 'DR-B4-001', 'SI-B4-001', 180000.00, 0, 10, 10),
(2, (SELECT id FROM items WHERE item_no = 'B4-STORM'), CURRENT_DATE, 1, 'DR-B4-002', 'SI-B4-002', 120000.00, 0, 15, 15),
(3, (SELECT id FROM items WHERE item_no = 'B4-CRUISE'), CURRENT_DATE, 1, 'DR-B4-003', 'SI-B4-003', 250000.00, 0, 8, 8),
(4, (SELECT id FROM items WHERE item_no = 'B4-SPRINT'), CURRENT_DATE, 1, 'DR-B4-004', 'SI-B4-004', 95000.00, 0, 20, 20),

-- Sky Go Models Initial Stock
(1, (SELECT id FROM items WHERE item_no = 'SG-FALCON'), CURRENT_DATE, 2, 'DR-SG-001', 'SI-SG-001', 160000.00, 0, 12, 12),
(2, (SELECT id FROM items WHERE item_no = 'SG-EAGLE'), CURRENT_DATE, 2, 'DR-SG-002', 'SI-SG-002', 175000.00, 0, 10, 10),
(3, (SELECT id FROM items WHERE item_no = 'SG-HAWK'), CURRENT_DATE, 2, 'DR-SG-003', 'SI-SG-003', 110000.00, 0, 18, 18),
(4, (SELECT id FROM items WHERE item_no = 'SG-PHOENIX'), CURRENT_DATE, 2, 'DR-SG-004', 'SI-SG-004', 130000.00, 0, 15, 15),

-- Honda Models Initial Stock
(1, (SELECT id FROM items WHERE item_no = 'HON-CLICK'), CURRENT_DATE, 3, 'DR-HON-001', 'SI-HON-001', 99000.00, 0, 25, 25),
(2, (SELECT id FROM items WHERE item_no = 'HON-PCX'), CURRENT_DATE, 3, 'DR-HON-002', 'SI-HON-002', 125000.00, 0, 20, 20),

-- Yamaha Models Initial Stock
(3, (SELECT id FROM items WHERE item_no = 'YAM-NMAX'), CURRENT_DATE, 4, 'DR-YAM-001', 'SI-YAM-001', 120000.00, 0, 22, 22),
(4, (SELECT id FROM items WHERE item_no = 'YAM-MIO'), CURRENT_DATE, 4, 'DR-YAM-002', 'SI-YAM-002', 85000.00, 0, 28, 28);
