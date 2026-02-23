"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const util_1 = require("util");
const path_1 = __importDefault(require("path"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
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
function seedAllBranches() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Starting to seed all branch inventories...\n');
        let successCount = 0;
        let failCount = 0;
        for (const seeder of seeders) {
            const branchName = path_1.default.basename(seeder, '.sql').replace('seed_', '').replace('_inventory', '');
            try {
                console.log(`🔄 Running ${branchName}...`);
                const { stdout, stderr } = yield execAsync(`npm run db:sql -- ${seeder}`);
                if (stderr && !stderr.includes('[apply-sql]')) {
                    console.log(`⚠️  ${branchName}: ${stderr}`);
                }
                console.log(`✅ ${branchName} completed`);
                successCount++;
            }
            catch (error) {
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
    });
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
