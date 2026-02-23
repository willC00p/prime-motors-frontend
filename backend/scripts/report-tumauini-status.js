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
            // Find Tumauini branch
            const branch = yield prisma.branches.findFirst({
                where: { name: { contains: 'Tumauini', mode: 'insensitive' } }
            });
            if (!branch) {
                console.log('Tumauini branch not found');
                return;
            }
            console.log(`\n=== Tumauini Branch Inventory Status ===\n`);
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
            console.log(`Active inventory (vehicle_units):     ${active}`);
            console.log(`Transferred history:                  ${transferred}`);
            console.log(`Total units:                          ${total}`);
            // Show sample of transferred units
            console.log(`\n=== Sample Transferred Units (showing first 10) ===\n`);
            const transferredSamples = yield prisma.$queryRaw `
      SELECT engine_no, chassis_no, remarks
      FROM transferred_history
      WHERE branch_id = ${branch.id}
      LIMIT 10
    `;
            transferredSamples.forEach((unit, index) => {
                console.log(`${index + 1}. Engine: ${unit.engine_no}, Chassis: ${unit.chassis_no}`);
                console.log(`   Remarks: ${unit.remarks || 'N/A'}`);
            });
            // Show sample of active units
            console.log(`\n=== Sample Active Units (showing first 10) ===\n`);
            const activeSamples = yield prisma.$queryRaw `
      SELECT vu.engine_no, vu.chassis_no, im.remarks
      FROM vehicle_units vu
      JOIN inventory_movements im ON vu.inventory_id = im.id
      WHERE im.branch_id = ${branch.id}
      LIMIT 10
    `;
            activeSamples.forEach((unit, index) => {
                console.log(`${index + 1}. Engine: ${unit.engine_no}, Chassis: ${unit.chassis_no}`);
                console.log(`   Remarks: ${unit.remarks || 'N/A'}`);
            });
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
