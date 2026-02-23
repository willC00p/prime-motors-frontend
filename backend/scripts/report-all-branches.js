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
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Get all branches
            const branches = yield prisma.branches.findMany({
                orderBy: { name: 'asc' }
            });
            console.log(`\n=== Inventory Status for All Branches ===\n`);
            console.log('Branch'.padEnd(30) + 'Active'.padEnd(12) + 'Transferred'.padEnd(15) + 'Total');
            console.log('='.repeat(70));
            let totalActive = 0;
            let totalTransferred = 0;
            for (const branch of branches) {
                // Count active inventory (vehicle_units)
                const activeCount = yield prisma.$queryRaw `
        SELECT COUNT(*) as count
        FROM vehicle_units vu
        JOIN inventory_movements im ON vu.inventory_id = im.id
        WHERE im.branch_id = ${branch.id}
      `;
                // Count transferred history
                const transferredCount = yield prisma.$queryRaw `
        SELECT COUNT(*) as count
        FROM transferred_history
        WHERE branch_id = ${branch.id}
      `;
                const active = Number(activeCount[0].count);
                const transferred = Number(transferredCount[0].count);
                const total = active + transferred;
                totalActive += active;
                totalTransferred += transferred;
                console.log(branch.name.padEnd(30) +
                    active.toString().padEnd(12) +
                    transferred.toString().padEnd(15) +
                    total.toString());
            }
            console.log('='.repeat(70));
            console.log('TOTAL'.padEnd(30) +
                totalActive.toString().padEnd(12) +
                totalTransferred.toString().padEnd(15) +
                (totalActive + totalTransferred).toString());
            console.log('');
        }
        catch (error) {
            console.error('Error:', error);
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
main();
