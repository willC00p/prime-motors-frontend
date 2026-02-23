import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

const seeders = [
  'db/seed_solana_inventory.sql',
  'db/seed_tuguegarao_inventory.sql',
  'db/seed_tumauini_inventory.sql',
  'db/seed_baggao_inventory.sql',
  'db/seed_tuguegarao_inventory_part2.sql',
  'db/seed_kamias_inventory.sql',
  'db/seed_sta_mesa_inventory.sql',
  'db/seed_cauayan_inventory.sql',
  'db/seed_gattaran_inventory.sql',
  'db/seed_ilagan_inventory.sql',
  'db/seed_aurora_inventory.sql',
  'db/seed_roxas_inventory.sql',
];

async function seedAllBranches() {
  console.log('Starting to seed all branch inventories...\n');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const seeder of seeders) {
    const branchName = path.basename(seeder, '.sql').replace('seed_', '').replace('_inventory', '');
    
    try {
      console.log(`🔄 Running ${branchName}...`);
      const { stdout, stderr } = await execAsync(`npm run db:sql -- ${seeder}`);
      
      if (stderr && !stderr.includes('[apply-sql]')) {
        console.log(`⚠️  ${branchName}: ${stderr}`);
      }
      
      console.log(`✅ ${branchName} completed`);
      successCount++;
    } catch (error: any) {
      console.error(`❌ ${branchName} failed:`, error.message);
      failCount++;
    }
  }
  
  console.log(`\n=== Summary ===`);
  console.log(`✅ Successful: ${successCount}/${seeders.length}`);
  console.log(`❌ Failed: ${failCount}/${seeders.length}`);
  
  if (failCount === 0) {
    console.log(`\n🎉 All branch inventories seeded successfully!`);
  }
}

seedAllBranches()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
