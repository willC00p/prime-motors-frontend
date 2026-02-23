#!/usr/bin/env ts-node
"use strict";
/**
 * Purge ALL sales and reset counters to start from 1.
 *
 * What this does:
 * - Detaches lto_registrations from sales (sets sale_id = NULL)
 * - Detaches sales_items from vehicle_units (sets vehicle_unit_id = NULL)
 * - Deletes all rows from sales (cascades to loan_payments, sales_items, sales_inventory)
 * - Resets identity sequences for sales, sales_items, loan_payments, sales_inventory
 * - Reports pre/post counts
 *
 * What it does NOT do:
 * - Touch models, suppliers, items, branches, users
 * - Delete lto_registrations (kept but unlinked)
 */
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
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
function resetSequenceFor(table_1) {
    return __awaiter(this, arguments, void 0, function* (table, idColumn = 'id') {
        var _a;
        // Use pg_get_serial_sequence to be robust across environments
        const seqRow = yield prisma.$queryRawUnsafe(`SELECT pg_get_serial_sequence('${table}', '${idColumn}') AS seq`);
        const seq = (_a = seqRow === null || seqRow === void 0 ? void 0 : seqRow[0]) === null || _a === void 0 ? void 0 : _a.seq;
        if (!seq) {
            console.warn(`[purge-sales] No sequence found for ${table}.${idColumn} — skipping reset`);
            return;
        }
        // Set to start at 1 (is_called=false)
        yield prisma.$executeRawUnsafe(`SELECT setval('${seq}'::regclass, 1, false)`);
        console.log(`[purge-sales] Sequence ${seq} reset to start at 1`);
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!process.argv.includes('--yes')) {
                console.error('Refusing to purge sales without --yes flag. Run with: ts-node scripts/purge-sales.ts --yes');
                process.exit(2);
            }
            console.log('[purge-sales] Starting purge of ALL sales...');
            // Pre-counts
            const [{ sales_before } = { sales_before: 0 }] = yield prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS sales_before FROM sales`);
            const [{ items_before } = { items_before: 0 }] = yield prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS items_before FROM sales_items`);
            const [{ inv_before } = { inv_before: 0 }] = yield prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS inv_before FROM sales_inventory`);
            const [{ lp_before } = { lp_before: 0 }] = yield prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS lp_before FROM loan_payments`);
            const [{ lto_linked_before } = { lto_linked_before: 0 }] = yield prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS lto_linked_before FROM lto_registrations WHERE sale_id IS NOT NULL`);
            console.log('[purge-sales] Pre-purge counts:', {
                sales: sales_before,
                sales_items: items_before,
                sales_inventory: inv_before,
                loan_payments: lp_before,
                lto_registrations_linked: lto_linked_before,
            });
            // Detach FKs that are NOT cascading on sales deletion
            console.log('[purge-sales] Nulling sale_id in lto_registrations...');
            yield prisma.$executeRawUnsafe(`UPDATE lto_registrations SET sale_id = NULL WHERE sale_id IS NOT NULL`);
            // Detach units from items to avoid any potential FK issues in custom constraints
            console.log('[purge-sales] Nulling vehicle_unit_id in sales_items...');
            yield prisma.$executeRawUnsafe(`UPDATE sales_items SET vehicle_unit_id = NULL WHERE vehicle_unit_id IS NOT NULL`);
            // Delete all sales (children with ON DELETE CASCADE will be removed automatically)
            console.log('[purge-sales] Deleting all rows from sales (cascades to loan_payments, sales_inventory, sales_items)...');
            yield prisma.$executeRawUnsafe(`DELETE FROM sales`);
            // Reset sequences to start at 1
            yield resetSequenceFor('sales', 'id');
            yield resetSequenceFor('sales_items', 'id');
            yield resetSequenceFor('loan_payments', 'id');
            yield resetSequenceFor('sales_inventory', 'id');
            // Post-counts
            const [{ sales_after } = { sales_after: 0 }] = yield prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS sales_after FROM sales`);
            const [{ items_after } = { items_after: 0 }] = yield prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS items_after FROM sales_items`);
            const [{ inv_after } = { inv_after: 0 }] = yield prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS inv_after FROM sales_inventory`);
            const [{ lp_after } = { lp_after: 0 }] = yield prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS lp_after FROM loan_payments`);
            const [{ lto_linked_after } = { lto_linked_after: 0 }] = yield prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS lto_linked_after FROM lto_registrations WHERE sale_id IS NOT NULL`);
            console.log('[purge-sales] Completed. Post-purge counts:', {
                sales: sales_after,
                sales_items: items_after,
                sales_inventory: inv_after,
                loan_payments: lp_after,
                lto_registrations_linked: lto_linked_after,
            });
        }
        catch (err) {
            console.error('[purge-sales] Failed:', (err === null || err === void 0 ? void 0 : err.message) || err);
            process.exit(1);
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
main();
