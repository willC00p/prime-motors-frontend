-- AlterTable
ALTER TABLE "sales" ADD COLUMN "payment_status" VARCHAR(20) DEFAULT 'ongoing';

-- CreateTable
CREATE TABLE "loan_payments" (
    "id" SERIAL NOT NULL,
    "sale_id" INTEGER NOT NULL,
    "payment_no" INTEGER NOT NULL,
    "due_date" DATE NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "paid_date" DATE,
    "paid_amount" DECIMAL(14,2) DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "remarks" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_loan_payments_sale" ON "loan_payments"("sale_id");
CREATE INDEX "idx_loan_payments_due_date" ON "loan_payments"("due_date");

-- AddForeignKey
ALTER TABLE "loan_payments" ADD CONSTRAINT "loan_payments_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
