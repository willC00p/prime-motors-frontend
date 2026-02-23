-- Idempotent seeder for Prime Motors branches
-- This will INSERT each branch only if a branch with the same name does not already exist.

BEGIN;

INSERT INTO branches (name, address)
SELECT 'Prime Motors Baggao', 'Zone 1 San Jose Baggao Cagayan'
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE name = 'Prime Motors Baggao');

INSERT INTO branches (name, address)
SELECT 'Prime Motors Aurora', 'National Highway, Brgy. San Jose, Aurora, Isabela'
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE name = 'Prime Motors Aurora');

INSERT INTO branches (name, address)
SELECT 'Prime Motors Cauayan', 'District 3, Don Jose Canciller Avenue, Cauayan City, Isabela'
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE name = 'Prime Motors Cauayan');

INSERT INTO branches (name, address)
SELECT 'Prime Motors Ilagan', 'Brgy. Baligatan Ilagan city, Isabela'
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE name = 'Prime Motors Ilagan');

INSERT INTO branches (name, address)
SELECT 'Prime Motors Antipolo', 'Blk 1 Lot 54 Robinson Homes East, San Jose District 2, Antipolo City'
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE name = 'Prime Motors Antipolo');

INSERT INTO branches (name, address)
SELECT 'Prime Motors San Mateo', '374 General Luna Street Brgy. Guinayang San Mateo Rizal'
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE name = 'Prime Motors San Mateo');

INSERT INTO branches (name, address)
SELECT 'Prime Motors Gattaran', 'Centro norte, Gattaran, Cagayan'
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE name = 'Prime Motors Gattaran');

INSERT INTO branches (name, address)
SELECT 'Prime Motors Roxas', 'National Highway San Placido, Roxas Isabela'
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE name = 'Prime Motors Roxas');

INSERT INTO branches (name, address)
SELECT 'Prime Motors Solana', 'Brgy Northeast Rizal St Centro Solana Cagayan'
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE name = 'Prime Motors Solana');

INSERT INTO branches (name, address)
SELECT 'Prime Motors Tumauini', 'PANIG-PALOS Building National Highway Brgy. Lingaling, Tumauini, Isabela'
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE name = 'Prime Motors Tumauini');

INSERT INTO branches (name, address)
SELECT 'Prime Motors Tuguegarao', 'Crdc Bldg., Diversion Rd. San Gabriel Vill, Tuguegarao City, Cagayan'
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE name = 'Prime Motors Tuguegarao');

INSERT INTO branches (name, address)
SELECT 'Prime Motors Kamias', '92 TRINIDAD BUILDING KAMIAS ROAD BRGY EAST KAMIAS QUEZON CITY'
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE name = 'Prime Motors Kamias');

INSERT INTO branches (name, address)
SELECT 'Prime Motors Sta. Mesa', '4761 OLD STA MESA ST. BRGY. 597, STA MESA MANILA CITY'
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE name = 'Prime Motors Sta. Mesa');

COMMIT;

-- Return a summary of affected rows per branch name (0 = existed already, 1 = inserted)
SELECT name, id FROM branches WHERE name LIKE 'Prime Motors %' ORDER BY name;
