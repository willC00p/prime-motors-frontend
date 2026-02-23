-- Part 2: Tuguegarao per-unit seeder (sanitized values)
-- This mirrors the logic in seed_tuguegarao_inventory.sql but is split into a separate file for incremental runs.

DO $$
DECLARE
  r record;
  parsed_date date;
  clean_engine text;
  clean_chassis text;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      -- branch, item_no, date_received, supplier, details, dr_no, si_no, brand, model, color, engine_no, chassis_no, pnpc_status, beg_inv, purchased, transfer, sales, ending_inv, note_date, remarks
  ('TUGUEGARAO','TM175','09/12/2025','TRENDWELL MOTORS OPC',NULL,'11561',NULL,'MONARCH','OMNI125','SILVER/GRAY','1P52QMISTC00248','LWMTJV1C3ST000248','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
      ('TUGUEGARAO','SG150T','09/12/2025','TRENDWELL MOTORS OPC',NULL,'11561',NULL,'SKYGO','LANCE150','WHITE/GOLD','1P57MJR1297888','LX8TDK8U8RB001014','AVAILABLE',0,NULL,0,NULL,NULL,NULL,'DELIVERED - Tuguegarao'),
      ('TUGUEGARAO','SG150T','09/12/2025','TRENDWELL MOTORS OPC',NULL,'11565',NULL,'SKYGO','LANCE150','WHITE/GOLD','1P57MJS1067183','LX8TDK8U9SB000136','AVAILABLE',0,NULL,0,NULL,NULL,NULL,'DELIVERED - Tuguegarao'),
      ('TUGUEGARAO','SG150T','09/12/2025','TRENDWELL MOTORS OPC',NULL,'11565',NULL,'SKYGO','LANCE150','WHITE/GOLD','1P57MJR1343554','LX8TDK8UXRB001466','AVAILABLE',0,NULL,0,NULL,NULL,NULL,'DELIVERED - Tuguegarao'),
      ('TUGUEGARAO','SG150T','09/12/2025','TRENDWELL MOTORS OPC','TRANSFER TO BAGGAO','11568',NULL,'SKYGO','LANCE150','WHITE/GOLD','1P57MJS1067226','LX8TDK8UXSB000162','AVAILABLE',0,NULL,0,NULL,NULL,NULL,'DELIVERED - Tuguegarao - transfer to Baggao'),
      ('TUGUEGARAO','SG150T','09/12/2025','TRENDWELL MOTORS OPC','TRANSFER TO BAGGAO','11568',NULL,'SKYGO','LANCE150','WHITE/GOLD','1P57MJR1343564','LX8TDK8U3RB001471','AVAILABLE',0,NULL,0,NULL,NULL,NULL,'DELIVERED - Tuguegarao - transfer to Baggao'),
      ('TUGUEGARAO','WM125','09/12/2025','TRENDWELL MOTORS OPC',NULL,'11568',NULL,'MONARCH','OMNI125','SILVER/GRAY','IP52QMISTC00270','LWMTJV1C7STD00270','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
  ('TUGUEGARAO','TM175','09/12/2025','TRENDWELL MOTORS OPC',NULL,'11568',NULL,'MONARCH','TM125','RED','158FM12S5106266','LX8PCJ504SE003766','AVAILABLE',0,NULL,0,NULL,NULL,NULL,'Baggao'),
  ('TUGUEGARAO','TM175','09/12/2025','TRENDWELL MOTORS OPC',NULL,'11568',NULL,'MONARCH','TM125','RED','156FMI2S5106270','LX8PCJ506SE003770','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
  ('TUGUEGARAO','TM175','09/12/2025','TRENDWELL MOTORS OPC','BAGGAO','11568',NULL,'MONARCH','TM175','RED','162FMKS5106718','LX8PCL502SE007939','AVAILABLE',0,NULL,0,NULL,NULL,NULL,'Baggao'),
  ('TUGUEGARAO','TM175','09/12/2025','TRENDWELL MOTORS OPC',NULL,'11568',NULL,'MONARCH','TM175','RED','162FMKS5106745','LX8PCL505SE007966','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
      ('TUGUEGARAO','TM150T','09/23/2025','TMOPC-BATAAN',NULL,'11591',NULL,'MONARCH','BOLT150','BLACK/SILVER','1P57MJS1226926','LX8TDK8G5SB001357','AVAILABLE',0,NULL,0,NULL,NULL,'2025-10-01','DELIVERED - Tuguegarao'),
      ('TUGUEGARAO','TM150T','09/23/2025','TMOPC-BATAAN',NULL,'11591',NULL,'MONARCH','BOLT150','BLACK/SILVER','1P57MJS1226946','LX8TDK8G4SB001365','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
      ('TUGUEGARAO','TM150T','09/23/2025','TMOPC-BATAAN',NULL,'11591',NULL,'MONARCH','BOLT150','BLACK/SILVER','1P57MJS1226934','LX8TDK8G7SB001389','AVAILABLE',0,NULL,0,NULL,NULL,NULL,'DELIVERED - Tuguegarao'),
      ('TUGUEGARAO','TM150T','09/26/2025','TMOPC-BATAAN',NULL,'11591',NULL,'MONARCH','BOLT150','BLACK/SILVER','1P57MJS1226929','LX8TDK8G8SB001367','AVAILABLE',0,NULL,0,NULL,NULL,NULL,'DELIVERED - Tuguegarao'),
      ('TUGUEGARAO','TM150T','09/26/2025','TMOPC-BATAAN',NULL,'11591',NULL,'MONARCH','BOLT150','BLACK/SILVER','1P57MJS1226947','LX8TDK8G6SB001366','AVAILABLE',0,NULL,0,NULL,NULL,NULL,'DELIVERED - Tuguegarao'),
      ('TUGUEGARAO','TM150T','09/23/2025','TMOPC-BATAAN',NULL,'11591',NULL,'MONARCH','BOLT150','BLACK/SILVER','1P57MJS1226930','LX8TDK8GXSB001385','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
      ('TUGUEGARAO','TM150T','09/23/2025','TMOPC-BATAAN',NULL,'11591',NULL,'MONARCH','BOLT150','BLACK/SILVER','1P57MJS1226950','LX8TDK8G7SB001392','AVAILABLE',0,NULL,0,NULL,NULL,'2025-10-14','DELIVERED - Tuguegarao'),
      ('TUGUEGARAO','TM150T','09/23/2025','TMOPC-BATAAN','TRANSFER TO GATTARAN','11591',NULL,'MONARCH','BOLT150','BLACK/SILVER','1P57MJS1226921','LX8TDK8GXSB001354','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao - transfer to Gattaran'),
      ('TUGUEGARAO','TM150T','09/23/2025','TMOPC-BATAAN','TRANSFER TO GATTARAN','11591',NULL,'MONARCH','BOLT150','BLACK/SILVER','1P57MJS1226922','LX8TDK8G2SB001400','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao - transfer to Gattaran'),
      ('TUGUEGARAO','TM150T','09/23/2025','TMOPC-BATAAN',NULL,'11591',NULL,'MONARCH','BOLT150','BLACK/SILVER','1P57MJS1226940','LX8TDK8G9SB001362','AVAILABLE',0,NULL,0,NULL,NULL,'2025-10-13','DELIVERED - Tuguegarao'),
      ('TUGUEGARAO','TM150T','09/23/2025','TMOPC-BATAAN',NULL,'11591',NULL,'MONARCH','BOLT150','BLACK/SILVER','1P57MJS1226924','LX8TDK8G3SB001356','AVAILABLE',0,NULL,0,NULL,NULL,NULL,'DELIVERED - Tuguegarao'),
      ('TUGUEGARAO','TM150T','09/23/2025','TMOPC-BATAAN','TRANSFER TO GATTARAN','11591',NULL,'MONARCH','BOLT150','BLACK/SILVER','1P57MJS1226937','LX8TDK8G9SB001359','AVAILABLE',1,NULL,NULL,NULL,NULL,'2025-10-18','Tuguegarao'),
      ('TUGUEGARAO','TM150T','09/23/2025','TMOPC-BATAAN',NULL,'11591',NULL,'MONARCH','BOLT150','BLACK/SILVER','1P57MJS1226917','LX8TDK8G4SB001351','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
      ('TUGUEGARAO','TM150T','09/23/2025','TMOPC-BATAAN',NULL,'11591',NULL,'MONARCH','BOLT150','BLACK/SILVER','1P57MJS1226942','LX8TDK8G0SB001363','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
      ('TUGUEGARAO','TM150T','09/23/2025','TMOPC-BATAAN',NULL,'11591',NULL,'MONARCH','BOLT150','BLACK/SILVER','1P57MJS1226928','LX8TDK8G7SB001358','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
      ('TUGUEGARAO','TM150T','09/23/2025','TMOPC-BATAAN',NULL,'11591',NULL,'MONARCH','BOLT150','BLACK/SILVER','1P57MJS1226938','LX8TDK8G5SB001360','AVAILABLE',0,NULL,0,NULL,NULL,'2025-10-04','DELIVERED - Tuguegarao'),
      ('TUGUEGARAO','TM150T','09/23/2025','TMOPC-BATAAN',NULL,'11591',NULL,'MONARCH','BOLT150','BLACK/SILVER','1P57MJS1226936','LX8TDK8G5SB001391','AVAILABLE',0,NULL,0,NULL,NULL,NULL,'DELIVERED - Tuguegarao'),
      ('TUGUEGARAO','TM150T','09/23/2025','TMOPC-BATAAN',NULL,'11591',NULL,'MONARCH','BOLT150','BLACK/SILVER','1P57MJS1121604','LX8TDK8G1SB001002','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
      ('TUGUEGARAO','TM150T','09/23/2025','TMOPC-BATAAN',NULL,'11591',NULL,'MONARCH','BOLT150','BLACK/SILVER','1P57MJS1226931','LX8TDK8G1SB001386','AVAILABLE',0,NULL,0,NULL,NULL,'2025-10-13','DELIVERED - Tuguegarao'),
      ('TUGUEGARAO','TM150T','09/23/2025','TMOPC-BATAAN',NULL,'11591',NULL,'MONARCH','BOLT150','BLACK/SILVER','1P57MJS1226935','LX8TDK8G3SB001390','AVAILABLE',0,NULL,0,NULL,NULL,NULL,'DELIVERED - Tuguegarao'),
      ('TUGUEGARAO','TM150T','09/23/2025','TMOPC-BATAAN',NULL,'11592',NULL,'MONARCH','BOLT150','BLACK/SILVER','1P57MJS1226941','LX8TDK8GXSB001368','AVAILABLE',0,NULL,0,NULL,NULL,NULL,'DELIVERED - Tuguegarao'),
      ('TUGUEGARAO','TM150T','09/23/2025','TMOPC-BATAAN',NULL,'11592',NULL,'MONARCH','BOLT150','BLACK/SILVER','1P57MJS1226930','LX8TDK8GXSB001385','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
      ('TUGUEGARAO','TM150T','09/23/2025','TMOPC-BATAAN',NULL,'11589',NULL,'MONARCH','BOLT150','BLACK/SILVER','1P57MJS1121604','LX8TDK8G1SB001002','AVAILABLE',0,NULL,0,NULL,NULL,NULL,'DELIVERED - Tuguegarao'),
      ('TUGUEGARAO','TM150T','09/23/2025','TMOPC-BATAAN',NULL,'11589',NULL,'MONARCH','BOLT150','BLACK/SILVER','1P57MJS1226919','LX8TDK8G8SB001353','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
      ('TUGUEGARAO','TM150T','09/26/2025','TMOPC-BATAAN',NULL,'11649',NULL,'MONARCH','BOLT150','BROWN/SILVER','1P57MJS1227306','LX8TDK8G9SB001555','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
      ('TUGUEGARAO','TM150T','09/26/2025','TMOPC-BATAAN',NULL,'11649',NULL,'MONARCH','BOLT150','BROWN/SILVER','1P57MJS1227379','LX8TDK8G8SB001613','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
      ('TUGUEGARAO','TM150T','09/26/2025','TMOPC-BATAAN',NULL,'11649',NULL,'MONARCH','BOLT150','BROWN/SILVER','1P57MJS1227299','LX8TDK8G7SB001568','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
      ('TUGUEGARAO','TM150T','09/26/2025','TMOPC-BATAAN','TRANSFER TO GATTARAN','11649',NULL,'MONARCH','BOLT150','BROWN/SILVER','1P57MJS1227303','LX8TDK8GXSB001600','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao - transfer to Gattaran'),
  ('TUGUEGARAO','TM150T','09/26/2025','TMOPC-BATAAN',NULL,'11649',NULL,'MONARCH','BOLT150','BROWN/SILVER','1P57MJS1227378','LX8TDK8G6SB001612','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
  ('TUGUEGARAO','TM150T','09/26/2025','TMOPC-BATAAN',NULL,'11649',NULL,'MONARCH','BOLT150','BROWN/SILVER','1P57MJS1227380','LX8TDK8GSB001614','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
  ('TUGUEGARAO','TM150T','09/26/2025','TMOPC-BATAAN',NULL,'11649',NULL,'MONARCH','BOLT150','BROWN/SILVER','1P57MJS1227319','LX8TDK8G2SB001591','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
  ('TUGUEGARAO','TM150T','09/26/2025','TMOPC-BATAAN',NULL,'11649',NULL,'MONARCH','BOLT150','BROWN/SILVER','1P57MJS1227342','LX8TDK8G3SB001602','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
  ('TUGUEGARAO','TM150T','09/26/2025','TMOPC-BATAAN',NULL,'11649',NULL,'MONARCH','BOLT150','BROWN/SILVER','1P57MJS1227327','LX8TDK8G3SB001566','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
  ('TUGUEGARAO','TM150T','09/26/2025','TMOPC-BATAAN',NULL,'11649',NULL,'MONARCH','BOLT150','BROWN/SILVER','1P57MJS1227311','LX8TDK8G4SB001558','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
  ('TUGUEGARAO','TM150T','09/26/2025','TMOPC-BATAAN',NULL,'11649',NULL,'MONARCH','BOLT150','BROWN/SILVER','1P57MJS1227326','LX8TDK8G1SB001596','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
  ('TUGUEGARAO','TM150T','09/26/2025','TMOPC-BATAAN','TRANSFER TO GATTARAN','11649',NULL,'MONARCH','BOLT150','BROWN/SILVER','1P57MJS1227297','LX8TDK8G2SB001588','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao - transfer to Gattaran'),
  -- moved textual "DELIVERED" into remarks and left numeric fields guarded
  ('TUGUEGARAO','TM150T','09/26/2025','TMOPC-BATAAN','TRANSFER TO GATTARAN','11649',NULL,'MONARCH','BOLT150','BROWN/SILVER','1P57MJS1227315','LX8TDK8G6SB001562','AVAILABLE',0,NULL,NULL,NULL,NULL,NULL,'DELIVERED - Tuguegarao'),
  ('TUGUEGARAO','TM150T','09/26/2025','TMOPC-BATAAN',NULL,'11649',NULL,'MONARCH','BOLT150','BROWN/SILVER','1P57MJS1227295','LX8TDK8G9SB001586','AVAILABLE',0,NULL,NULL,NULL,NULL,NULL,'DELIVERED - Tuguegarao'),
  ('TUGUEGARAO','TM175','10/24/2025','TMOPC-BATAAN','TRANSFER TO SOLANA W/PNPC','12963',NULL,'MONARCH','TM175','RED','162FMKS106902','LX8PCL504SE008123','AVAILABLE',0,NULL,NULL,NULL,NULL,NULL,'TRANSFER TO SOLANA W/PNPC - Tuguegarao'),
  ('TUGUEGARAO','TM175','10/24/2025','TMOPC-BATAAN','TRANSFER TO SOLANA with pnpc','12963',NULL,'MONARCH','TM175','BLACK','162FMKS5106920','LX8PCL506SE0008141','AVAILABLE',0,NULL,NULL,NULL,NULL,'10-28/2025','TRANSFER TO SOLANA with pnpc - Tuguegarao'),
  ('TUGUEGARAO','TM175','10/24/2025','TMOPC-BATAAN',NULL,'12963',NULL,'MONARCH','TM175','BLACK','162FMKS5106922','LX8PCL50XSE008143','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
  ('TUGUEGARAO','TM175','10/24/2025','TMOPC-BATAAN','TRANSFER TO BAGGAO','12963',NULL,'MONARCH','TM175','BLACK','162FMKS5106927','LX8PCL509SE008148','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao - transfer to Baggao'),
  ('TUGUEGARAO','TM175','10/24/2025','TMOPC-BATAAN',NULL,'12963',NULL,'MONARCH','TM175','BLACK','162FMKS5106929','LX8PCL507SE008150','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
  ('TUGUEGARAO','TM175','10/24/2025','TMOPC-BATAAN','TRANSFER TO BAGGAO','12963',NULL,'MONARCH','TM175','BLACK','162FMKS5106930','LX8PCL509SE008151','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao - transfer to Baggao'),
  ('TUGUEGARAO','TM175','10/24/2025','TMOPC-BATAAN',NULL,'12963',NULL,'MONARCH','TM175','BLACK','162FMKS5106932','LX8PCL502SE008153','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
  ('TUGUEGARAO','TM175','10/24/2025','TMOPC-BATAAN',NULL,'12963',NULL,'MONARCH','TM175','BLACK','162FMKS5106934','LX8PCL506SE008155','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
  ('TUGUEGARAO','TM175','10/24/2025','TMOPC-BATAAN',NULL,'12963',NULL,'MONARCH','TM175','BLACK','162FMKS5106936','LX8PCL50XSE008157','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
  ('TUGUEGARAO','TM175','10/24/2025','TMOPC-BATAAN',NULL,'12963',NULL,'MONARCH','TM175','BLACK','162FMKS5106924','LX8PCL503SE008145','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
  ('TUGUEGARAO','TM175','10/24/2025','TMOPC-BATAAN',NULL,'12963',NULL,'MONARCH','TM175','BLACK','162FMKS5106912','LX8PCL507SE008133','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
  ('TUGUEGARAO','TM175','10/24/2025','TMOPC-BATAAN','TRANSFER TO BAGGAO','12963',NULL,'MONARCH','TM175','BLACK','162FMKS5106933','LX8PCL504SE008154','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao - transfer to Baggao'),
  ('TUGUEGARAO','TM175','10/24/2025','TMOPC-BATAAN','TRANSFER TO BAGGAO','12963',NULL,'MONARCH','TM175','BLACK','162FMKS5106931','LX8PCL500SE008152','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao - transfer to Baggao'),
  ('TUGUEGARAO','TM175','10/24/2025','TMOPC-BATAAN','TRANSFER TO BAGGAO','12963',NULL,'MONARCH','TM175','BLACK','162FMKS5106937','LX8PCL501SE008158','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao - transfer to Baggao'),
  ('TUGUEGARAO','TM175','10/24/2025','TMOPC-BATAAN',NULL,'12963',NULL,'MONARCH','TM175','BLACK','162FMKS5106928','LX8PCL500SE008149','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
  ('TUGUEGARAO','TM175','10/24/2025','TMOPC-BATAAN',NULL,'12963',NULL,'MONARCH','TM175','BLACK','162FMKS5106938','LX8PCL503SE008159','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
  ('TUGUEGARAO','TM175','10/24/2025','TMOPC-BATAAN',NULL,'12963',NULL,'MONARCH','TM175','BLUE','162FMKS5106968','LX8PCL501SE008189','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
  ('TUGUEGARAO','TM175','10/24/2025','TMOPC-BATAAN','TRANSFER TO BAGGAO','12963',NULL,'MONARCH','TM175','BLUE','162FMKS5106989','LX8PCL50XSE008210','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao - transfer to Baggao'),
  ('TUGUEGARAO','TM175','10/24/2025','TMOPC-BATAAN',NULL,'12963',NULL,'MONARCH','TM175','BLACK','162FMKS5106919','LX8PCL504SE008140','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
  ('TUGUEGARAO','TM175','10/24/2025','TMOPC-BATAAN',NULL,'12963',NULL,'MONARCH','TM175','BLUE','162FMKS5106988','LX8PCL503SE008209','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
  ('TUGUEGARAO','TM175','10/24/2025','TMOPC-BATAAN',NULL,'12963',NULL,'MONARCH','TM175','BLUE','162FMKS5106971','LX8PCL501SE008192','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
  ('TUGUEGARAO','TM175','10/24/2025','TMOPC-BATAAN','TRANSFER TO BAGGAO','12963',NULL,'MONARCH','TM175','BLUE','162FMKS5106959','LX8PCL505SE008180','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao - transfer to Baggao'),
  ('TUGUEGARAO','TM175','10/24/2025','TMOPC-BATAAN','TRANSFER TO BAGGAO','12963',NULL,'MONARCH','TM175','RED','162FMKS5106897','LX8PCL500SE008118','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao - transfer to Baggao'),
  ('TUGUEGARAO','TM175','10/24/2025','TMOPC-BATAAN',NULL,'12963',NULL,'MONARCH','TM175','RED','162FMKS5106870','LX8PCL506SE008091','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
  ('TUGUEGARAO','TM175','10/24/2025','TMOPC-BATAAN',NULL,'12963',NULL,'MONARCH','TM175','RED','162FMKS5106845','LX8PCL507SE008066','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
  ('TUGUEGARAO','TM150','10/29/2025','TMOPC-BATAAN',NULL,'11456',NULL,'MONARCH','TM150','RED','161FMJS5105818','LX8PCK509SE011688','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
  ('TUGUEGARAO','TM150','10/29/2025','TMOPC-BATAAN',NULL,'11456',NULL,'MONARCH','TM150','BLACK','161FMJS5105826','LX8PCK508SE011696','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
  ('TUGUEGARAO','TM150','10/29/2025','TMOPC-BATAAN',NULL,'11456',NULL,'MONARCH','TM150','BLACK','161FMJS5105823','LX8PCK502SE011693','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
  ('TUGUEGARAO','TM150','10/29/2025','TMOPC-BATAAN',NULL,'11456',NULL,'MONARCH','TM150','RED','161FMJS5105822','LX8PCK500SE011692','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao'),
  ('TUGUEGARAO','TM150','10/29/2025','TMOPC-BATAAN',NULL,'11456',NULL,'MONARCH','TM150','BLACK','161FMJS5105825','LX8PCK506SE011695','AVAILABLE',1,NULL,NULL,NULL,NULL,NULL,'Tuguegarao')
    ) AS t(branch, item_no, date_received, supplier, details, dr_no, si_no, brand, model, color, engine_no, chassis_no, pnpc_status, beg_inv, purchased, transfer, sales, ending_inv, note_date, remarks)
  LOOP
    DECLARE
      br_id INT;
      sup_id INT;
      item_id INT;
      inv_id INT;
      sold_qty INT := 0;
      trans_qty INT := 0;
    BEGIN
      -- normalize and validate date_received
      IF r.date_received IS NULL OR trim(r.date_received) = '' THEN
        parsed_date := CURRENT_DATE;
      ELSIF r.date_received ~ '^[0-9]{1,2}/[0-9]{1,2}/[0-9]{4}$' THEN
        parsed_date := to_date(r.date_received, 'MM/DD/YYYY');
      ELSIF r.date_received ~ '^[0-9]{1,2}/[0-9]{1,2}/[0-9]{2}$' THEN
        parsed_date := (to_date(r.date_received, 'MM/DD/YY') + interval '2000 years')::date;
      ELSE
        parsed_date := COALESCE(r.date_received::date, CURRENT_DATE);
      END IF;

      clean_engine := NULLIF(regexp_replace(coalesce(r.engine_no, ''), '\\s+', '', 'g'), '');
      clean_chassis := NULLIF(regexp_replace(coalesce(r.chassis_no, ''), '\\s+', '', 'g'), '');

      -- resolve branch
      SELECT id INTO br_id FROM branches WHERE name ILIKE '%' || r.branch || '%' LIMIT 1;
      IF br_id IS NULL THEN
        INSERT INTO branches (name) VALUES (r.branch) RETURNING id INTO br_id;
      END IF;

      -- resolve supplier
      SELECT id INTO sup_id FROM suppliers WHERE name ILIKE '%' || split_part(coalesce(r.supplier, ''), ' ', 1) || '%' LIMIT 1;
      IF sup_id IS NULL THEN
        IF coalesce(r.supplier, '') <> '' THEN
          INSERT INTO suppliers (name, created_at) VALUES (coalesce(r.supplier, ''), NOW()) RETURNING id INTO sup_id;
        ELSE
          sup_id := NULL;
        END IF;
      END IF;

      -- resolve item
      SELECT id INTO item_id FROM items WHERE model ILIKE r.model AND brand ILIKE '%' || r.brand || '%' LIMIT 1;
      IF item_id IS NULL THEN
        SELECT id INTO item_id FROM items WHERE item_no ILIKE '%' || r.item_no || '%' LIMIT 1;
      END IF;
      IF item_id IS NULL THEN
        INSERT INTO items (item_no, brand, model, color, cost_of_purchase, srp, created_at)
        VALUES (
          coalesce(r.item_no,''),
          coalesce(r.brand,''),
          coalesce(r.model,''),
          ARRAY[coalesce(r.color,'')],
          CASE
            WHEN lower(coalesce(r.item_no,'')) LIKE '%tm125%' OR lower(coalesce(r.model,'')) LIKE '%tm125%' THEN 40940
            WHEN lower(coalesce(r.item_no,'')) LIKE '%tm175%' OR lower(coalesce(r.model,'')) LIKE '%tm175%' THEN 44500
            WHEN lower(coalesce(r.item_no,'')) LIKE '%sg1502t%' OR lower(coalesce(r.model,'')) LIKE '%sg1502t%' THEN 86330
            ELSE NULL
          END,
          CASE
            WHEN lower(coalesce(r.item_no,'')) LIKE '%tm125%' OR lower(coalesce(r.model,'')) LIKE '%tm125%' THEN 46000
            WHEN lower(coalesce(r.item_no,'')) LIKE '%tm175%' OR lower(coalesce(r.model,'')) LIKE '%tm175%' THEN 50000
            WHEN lower(coalesce(r.item_no,'')) LIKE '%sg1502t%' OR lower(coalesce(r.model,'')) LIKE '%sg1502t%' THEN 97000
            ELSE NULL
          END,
          NOW()
        ) RETURNING id INTO item_id;
      END IF;

      -- ensure canonical cost/srp for known models (update existing items when matched)
      UPDATE items
      SET cost_of_purchase = CASE
            WHEN lower(item_no) LIKE '%tm125%' OR lower(model) LIKE '%tm125%' THEN 40940
            WHEN lower(item_no) LIKE '%tm175%' OR lower(model) LIKE '%tm175%' THEN 44500
            WHEN lower(item_no) LIKE '%sg1502t%' OR lower(model) LIKE '%sg1502t%' THEN 86330
            ELSE cost_of_purchase END,
          srp = CASE
            WHEN lower(item_no) LIKE '%tm125%' OR lower(model) LIKE '%tm125%' THEN 46000
            WHEN lower(item_no) LIKE '%tm175%' OR lower(model) LIKE '%tm175%' THEN 50000
            WHEN lower(item_no) LIKE '%sg1502t%' OR lower(model) LIKE '%sg1502t%' THEN 97000
            ELSE srp END
      WHERE id = item_id
        AND (
          lower(item_no) LIKE '%tm125%' OR lower(model) LIKE '%tm125%'
          OR lower(item_no) LIKE '%tm175%' OR lower(model) LIKE '%tm175%'
          OR lower(item_no) LIKE '%sg1502t%' OR lower(model) LIKE '%sg1502t%'
        );
      

      -- treat ending_inv carefully: values may be text in the VALUES list, so only cast when it's all digits
      IF r.ending_inv IS NOT NULL AND (trim(r.ending_inv::text) ~ '^[0-9]+$' AND r.ending_inv::int = 0) THEN
        sold_qty := 1;
      ELSE
        sold_qty := 0;
      END IF;
      -- Check for transfer indicators: purchased=0, transfer column, details field, or remarks indicate transfer away from Tuguegarao
      -- All rows with ANY transfer indication should go to transferred_history
      IF COALESCE((CASE WHEN trim(COALESCE(r.purchased::text, '')) ~ '^[0-9]+$' THEN r.purchased::int ELSE NULL END), 1) = 0
         OR (r.transfer IS NOT NULL AND trim(r.transfer::text) = '0')
         OR (r.details IS NOT NULL AND lower(trim(r.details)) LIKE '%transfer%')
         OR (r.remarks IS NOT NULL AND (lower(trim(r.remarks)) LIKE '%baggao%' OR lower(trim(r.remarks)) LIKE '%transfer%')) THEN
        trans_qty := 1;
      ELSE
        trans_qty := 0;
      END IF;

      -- skip if vehicle exists in active units OR transferred history
      IF (clean_engine IS NOT NULL AND (
          EXISTS(SELECT 1 FROM vehicle_units v WHERE v.engine_no = clean_engine)
        OR EXISTS(SELECT 1 FROM transferred_history th WHERE th.engine_no = clean_engine)
        ))
         OR (clean_chassis IS NOT NULL AND (
          EXISTS(SELECT 1 FROM vehicle_units v WHERE v.chassis_no = clean_chassis)
        OR EXISTS(SELECT 1 FROM transferred_history th WHERE th.chassis_no = clean_chassis)
        )) THEN
        SELECT v.inventory_id INTO inv_id FROM vehicle_units v
        WHERE (clean_engine IS NOT NULL AND v.engine_no = clean_engine)
           OR (clean_chassis IS NOT NULL AND v.chassis_no = clean_chassis)
        LIMIT 1;
        IF inv_id IS NOT NULL THEN
          UPDATE inventory_movements im
          SET color = COALESCE(im.color, NULLIF(r.color, '')),
              srp = COALESCE(im.srp, (SELECT srp FROM items WHERE id = im.item_id)),
              cost = COALESCE(im.cost, COALESCE((SELECT cost_of_purchase FROM items WHERE id = im.item_id), (SELECT srp FROM items WHERE id = im.item_id), 0))
          WHERE im.id = inv_id;
        END IF;
        CONTINUE;
      END IF;

      IF trans_qty = 1 THEN
        -- Route transferred units to transferred_history instead of active inventory
        INSERT INTO transferred_history (
          branch_id, item_id, date_received, supplier_id, dr_no, si_no,
          cost, beginning_qty, purchased_qty, transferred_qty, sold_qty, ending_qty,
          remarks, created_at, srp, margin, color, status,
          chassis_no, engine_no, unit_number, unit_created_at, unit_status
        ) VALUES (
          br_id,
          item_id,
          parsed_date,
          sup_id,
          r.dr_no,
          r.si_no,
          COALESCE((SELECT cost_of_purchase FROM items WHERE id = item_id), (SELECT srp FROM items WHERE id = item_id), 0),
          COALESCE((CASE WHEN trim(COALESCE(r.beg_inv::text, '')) ~ '^[0-9]+$' THEN r.beg_inv::int ELSE NULL END), 1),
          COALESCE((CASE WHEN trim(COALESCE(r.purchased::text, '')) ~ '^[0-9]+$' THEN r.purchased::int ELSE NULL END), 1),
          trans_qty,
          sold_qty,
          COALESCE((CASE WHEN trim(COALESCE(r.ending_inv::text, '')) ~ '^[0-9]+$' THEN r.ending_inv::int ELSE NULL END), (CASE WHEN trim(COALESCE(r.beg_inv::text, '')) ~ '^[0-9]+$' THEN r.beg_inv::int ELSE 0 END)),
          r.remarks,
          NOW(),
          (SELECT srp FROM items WHERE id = item_id),
          CASE WHEN (SELECT srp FROM items WHERE id = item_id) IS NOT NULL AND COALESCE((SELECT cost_of_purchase FROM items WHERE id = item_id),0) > 0
               THEN (((SELECT srp FROM items WHERE id = item_id) - COALESCE((SELECT cost_of_purchase FROM items WHERE id = item_id),0)) / COALESCE((SELECT cost_of_purchase FROM items WHERE id = item_id),1)) * 100
               ELSE 0 END,
          NULLIF(r.color, ''),
          'transferred',
          clean_chassis,
          clean_engine,
          1,
          NOW(),
          'transferred'
        );
      ELSE
        INSERT INTO inventory_movements (branch_id, item_id, date_received, supplier_id, dr_no, si_no, cost, beginning_qty, purchased_qty, transferred_qty, sold_qty, ending_qty, color, srp, remarks, created_at)
        VALUES (
          br_id,
          item_id,
          parsed_date,
          sup_id,
          r.dr_no,
          r.si_no,
          COALESCE((SELECT cost_of_purchase FROM items WHERE id = item_id), (SELECT srp FROM items WHERE id = item_id), 0),
          COALESCE((CASE WHEN trim(COALESCE(r.beg_inv::text, '')) ~ '^[0-9]+$' THEN r.beg_inv::int ELSE NULL END), 1),
          COALESCE((CASE WHEN trim(COALESCE(r.purchased::text, '')) ~ '^[0-9]+$' THEN r.purchased::int ELSE NULL END), 1),
          trans_qty,
          sold_qty,
          COALESCE((CASE WHEN trim(COALESCE(r.ending_inv::text, '')) ~ '^[0-9]+$' THEN r.ending_inv::int ELSE NULL END), (CASE WHEN trim(COALESCE(r.beg_inv::text, '')) ~ '^[0-9]+$' THEN r.beg_inv::int ELSE 0 END)),
          NULLIF(r.color, ''),
          (SELECT srp FROM items WHERE id = item_id),
          r.remarks,
          NOW()
        ) RETURNING id INTO inv_id;

        INSERT INTO vehicle_units (inventory_id, chassis_no, engine_no, unit_number, created_at)
        VALUES (inv_id, clean_chassis, clean_engine, 1, NOW());
      END IF;

    END;
  END LOOP;
END;
$$;

-- show results
SELECT v.id, v.engine_no, v.chassis_no, b.name AS branch, i.item_no, im.date_received, im.ending_qty, im.remarks
FROM vehicle_units v
JOIN inventory_movements im ON im.id = v.inventory_id
JOIN branches b ON b.id = im.branch_id
JOIN items i ON i.id = im.item_id
WHERE b.name ILIKE '%Tuguegarao%' AND im.created_at > now() - interval '1 hour'
ORDER BY v.id;
