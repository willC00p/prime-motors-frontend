"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const EXCLUDED_ENGINE = 'JN1P57QMJ24045995';
        // 1) Identify source items (RM15ST or model contains 'ARROW 150')
        const sourceItems = yield prisma.items.findMany({
            where: {
                OR: [
                    { item_no: { equals: 'RM15ST', mode: 'insensitive' } },
                    { model: { contains: 'ARROW 150', mode: 'insensitive' } },
                    { model: { contains: 'M1 ARROW 150', mode: 'insensitive' } },
                ],
            },
            select: { id: true, item_no: true, model: true },
        });
        if (sourceItems.length === 0) {
            console.log('No source items found (RM15ST/ARROW 150). Nothing to update.');
            return;
        }
        const sourceItemIds = sourceItems.map(i => i.id);
        console.log(`Found ${sourceItems.length} source items:`, sourceItems.map(i => `${i.id}:${i.item_no}:${i.model}`).join(', '));
        // 2) Identify target item (TM175 / MONARCH 175)
        const targetCandidates = yield prisma.items.findMany({
            where: {
                OR: [
                    { item_no: { equals: 'TM175', mode: 'insensitive' } },
                    { model: { contains: 'MONARCH 175', mode: 'insensitive' } },
                ],
            },
            orderBy: { id: 'asc' },
        });
        if (targetCandidates.length === 0) {
            console.error('No target item found for TM175 / MONARCH 175. Aborting.');
            return;
        }
        const target = targetCandidates.find(i => { var _a; return ((_a = i.item_no) === null || _a === void 0 ? void 0 : _a.toUpperCase()) === 'TM175'; }) || targetCandidates[0];
        console.log(`Using target item id=${target.id} item_no=${target.item_no} model=${target.model}`);
        // 3) Count affected sales_items (excluding the specific engine via related vehicle_unit)
        const affectedCount = yield prisma.sales_items.count({
            where: {
                item_id: { in: sourceItemIds },
                NOT: { vehicle_unit: { engine_no: EXCLUDED_ENGINE } },
            },
        });
        console.log(`Sales items to update: ${affectedCount}`);
        if (affectedCount === 0) {
            console.log('No sales_items match the criteria. Nothing to do.');
            return;
        }
        // 4) Perform the update
        const updateResult = yield prisma.sales_items.updateMany({
            where: {
                item_id: { in: sourceItemIds },
                NOT: { vehicle_unit: { engine_no: EXCLUDED_ENGINE } },
            },
            data: {
                item_id: target.id,
            },
        });
        console.log(`Updated sales_items rows: ${updateResult.count}`);
        // 5) Verification snapshot: show a few sample rows after update (limit 5)
        const sample = yield prisma.sales_items.findMany({
            where: {
                item_id: target.id,
            },
            take: 5,
            orderBy: { id: 'desc' },
            include: {
                sales: { select: { id: true, branch_id: true, date_sold: true, dr_no: true, si_no: true } },
                items: { select: { item_no: true, model: true } },
                vehicle_unit: { select: { engine_no: true, chassis_no: true } },
            },
        });
        console.log('Sample updated sales_items:', sample);
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
