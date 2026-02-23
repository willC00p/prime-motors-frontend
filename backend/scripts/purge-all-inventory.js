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
            console.log('Purging all inventory data...\n');
            // Delete all transferred_history
            const deletedTransferred = yield prisma.$executeRaw `
      DELETE FROM transferred_history
    `;
            console.log(`Deleted ${deletedTransferred} rows from transferred_history`);
            // Delete all vehicle_units
            const deletedVehicles = yield prisma.$executeRaw `
      DELETE FROM vehicle_units
    `;
            console.log(`Deleted ${deletedVehicles} rows from vehicle_units`);
            // Delete all inventory_movements
            const deletedMovements = yield prisma.inventory_movements.deleteMany({});
            console.log(`Deleted ${deletedMovements.count} rows from inventory_movements`);
            console.log('\nAll inventory data purged successfully');
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
