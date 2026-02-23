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
            // Find Baggao branch
            const branch = yield prisma.branches.findFirst({
                where: { name: { contains: 'Baggao', mode: 'insensitive' } }
            });
            if (!branch) {
                console.log('Baggao branch not found');
                return;
            }
            console.log(`Purging inventory for branch: ${branch.name} (ID: ${branch.id})`);
            // Delete from transferred_history using raw SQL
            const deletedTransferred = yield prisma.$executeRaw `
      DELETE FROM transferred_history WHERE branch_id = ${branch.id}
    `;
            console.log(`Deleted ${deletedTransferred} rows from transferred_history`);
            // Delete vehicle_units for this branch
            const deletedVehicles = yield prisma.$executeRaw `
      DELETE FROM vehicle_units
      WHERE inventory_id IN (
        SELECT id FROM inventory_movements WHERE branch_id = ${branch.id}
      )
    `;
            console.log(`Deleted ${deletedVehicles} rows from vehicle_units`);
            // Delete inventory_movements
            const deletedMovements = yield prisma.inventory_movements.deleteMany({
                where: { branch_id: branch.id }
            });
            console.log(`Deleted ${deletedMovements.count} rows from inventory_movements`);
            console.log('Baggao inventory purged successfully');
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
