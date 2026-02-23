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
const prisma_1 = __importDefault(require("../lib/prisma"));
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const poNumber = process.argv[2];
        if (!poNumber) {
            console.error('Usage: ts-node showPO.ts <PO_NUMBER>');
            process.exit(1);
        }
        const po = yield prisma_1.default.purchase_orders.findFirst({
            where: { po_number: poNumber },
            include: {
                purchase_order_items: {
                    include: { items: true }
                },
                branches: true,
                suppliers: true
            }
        });
        if (!po) {
            console.error('PO not found:', poNumber);
            process.exit(1);
        }
        console.dir(po, { depth: null, colors: true });
        process.exit(0);
    });
}
main().catch(e => {
    console.error(e);
    process.exit(1);
});
