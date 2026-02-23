#!/usr/bin/env ts-node
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
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const client = new pg_1.Client({ connectionString: process.env.DATABASE_URL });
        try {
            yield client.connect();
            console.log('\n=== SOLANA INVENTORY STATUS ===\n');
            // Count transferred history rows for Solana
            const { rows: [{ th_count }] } = yield client.query(`
      SELECT COUNT(*) as th_count 
      FROM transferred_history th
      JOIN branches b ON b.id = th.branch_id
      WHERE b.name ILIKE '%Solana%'
    `);
            // Count active inventory movements for Solana
            const { rows: [{ inv_count }] } = yield client.query(`
      SELECT COUNT(*) as inv_count 
      FROM inventory_movements im
      JOIN branches b ON b.id = im.branch_id
      WHERE b.name ILIKE '%Solana%'
    `);
            // Count active vehicle units for Solana
            const { rows: [{ vu_count }] } = yield client.query(`
      SELECT COUNT(*) as vu_count
      FROM vehicle_units v
      JOIN inventory_movements im ON im.id = v.inventory_id
      JOIN branches b ON b.id = im.branch_id
      WHERE b.name ILIKE '%Solana%'
    `);
            console.log('Counts:');
            console.log('  transferred_history (Solana):', th_count);
            console.log('  inventory_movements (Solana):', inv_count);
            console.log('  vehicle_units (Solana):', vu_count);
            // Show sample transferred rows
            console.log('\n--- Sample transferred_history rows (Solana) ---');
            const { rows: thSamples } = yield client.query(`
      SELECT engine_no, chassis_no, remarks
      FROM transferred_history th
      JOIN branches b ON b.id = th.branch_id
      WHERE b.name ILIKE '%Solana%'
      LIMIT 5
    `);
            thSamples.forEach(r => console.log(`  ${r.engine_no} | ${r.chassis_no} | ${r.remarks}`));
            // Show sample active units
            console.log('\n--- Sample active vehicle_units (Solana) ---');
            const { rows: vuSamples } = yield client.query(`
      SELECT v.engine_no, v.chassis_no, im.remarks
      FROM vehicle_units v
      JOIN inventory_movements im ON im.id = v.inventory_id
      JOIN branches b ON b.id = im.branch_id
      WHERE b.name ILIKE '%Solana%'
      LIMIT 5
    `);
            vuSamples.forEach(r => console.log(`  ${r.engine_no} | ${r.chassis_no} | ${r.remarks || '(none)'}`));
            console.log('\n');
        }
        catch (e) {
            console.error('Error:', (e === null || e === void 0 ? void 0 : e.message) || e);
            process.exit(1);
        }
        finally {
            yield client.end();
        }
    });
}
main();
