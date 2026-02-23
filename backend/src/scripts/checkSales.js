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
function checkSales() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const sales = yield prisma.sales.findMany({
                orderBy: {
                    date_sold: 'desc'
                },
                include: {
                    loan_payments: true
                }
            });
            console.log('\nSales Records:');
            console.log('=============');
            for (const sale of sales) {
                console.log(`\nID: ${sale.id}`);
                console.log(`Date Sold: ${sale.date_sold}`);
                console.log(`Payment Method: ${sale.payment_method}`);
                console.log(`Total Amount: ${sale.total_amount}`);
                console.log(`Loan Amount: ${sale.loan_amount}`);
                console.log(`Date Granted: ${sale.date_granted}`);
                console.log(`Terms: ${sale.terms}`);
                console.log(`Monthly Amortization: ${sale.monthly_amortization}`);
                console.log(`Customer: ${sale.first_name} ${sale.last_name}`);
                console.log(`Loan Payments Count: ${sale.loan_payments.length}`);
                console.log('------------------------');
            }
        }
        catch (error) {
            console.error('Error:', error);
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
checkSales();
