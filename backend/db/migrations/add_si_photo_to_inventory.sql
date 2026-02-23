-- AddPhotoToInventoryMovements
ALTER TABLE inventory_movements ADD COLUMN si_photo_url VARCHAR(500);
ALTER TABLE inventory_movements ADD COLUMN si_photo_key VARCHAR(500);
