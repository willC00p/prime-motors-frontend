# PowerShell script to batch update remaining seed files
# This script updates the transfer detection logic and adds transferred_history routing

$files = @(
    "seed_roxas_inventory.sql",
    "seed_antipolo_inventory.sql",
    "seed_aurora_inventory.sql",
    "seed_baggao_inventory.sql",
    "seed_cauayan_inventory.sql",
    "seed_gattaran_inventory.sql",
    "seed_ilagan_inventory.sql",
    "seed_tumauini_inventory.sql",
    "seed_tuguegarao_inventory_part2.sql"
)

foreach ($file in $files) {
    $path = "c:\prime-motors\backend\db\$file"
    if (Test-Path $path) {
        Write-Host "Processing $file..."
        
        $content = Get-Content $path -Raw
        
        # Pattern 1: Update transfer detection logic
        $oldPattern1 = 'IF r\.remarks IS NOT NULL AND trim\(r\.remarks\) <> '''' AND r\.remarks NOT ILIKE ''%CASH SALE%'' THEN\s+trans_qty := 1;\s+ELSE\s+trans_qty := 0;\s+END IF;'
        $newPattern1 = @'
-- Check purchased=0 which indicates transfer (not a new purchase)
      -- All rows with purchased=0 should go to transferred_history
      IF COALESCE(r.purchased, 1) = 0 THEN
        trans_qty := 1;
      ELSE
        trans_qty := 0;
      END IF;
'@
        
        $content = $content -replace $oldPattern1, $newPattern1
        
        # Save the file
        Set-Content -Path $path -Value $content -NoNewline
        Write-Host "Updated $file"
    } else {
        Write-Host "File not found: $file" -ForegroundColor Red
    }
}

Write-Host "`nBatch update complete!"
