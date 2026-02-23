-- CreateTable
CREATE TABLE "lto_registrations" (
    "id" SERIAL NOT NULL,
    "sale_id" INTEGER,
    "vehicle_unit_id" INTEGER,
    "plate_number" VARCHAR(20),
    "engine_number" VARCHAR(50) NOT NULL,
    "chassis_number" VARCHAR(50) NOT NULL,
    "mv_file_number" VARCHAR(50),
    "cr_number" VARCHAR(50),
    "or_number" VARCHAR(50),
    "registration_date" DATE,
    "expiration_date" DATE,
    "stencil_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "insurance_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "emission_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "insurance_provider" VARCHAR(100),
    "insurance_policy_number" VARCHAR(50),
    "insurance_expiry" DATE,
    "csr_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "dir_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "prf_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "registration_fee" DECIMAL(10,2),
    "insurance_fee" DECIMAL(10,2),
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,

    CONSTRAINT "lto_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lto_registrations_plate_number_key" ON "lto_registrations"("plate_number");

-- CreateIndex
CREATE UNIQUE INDEX "lto_registrations_mv_file_number_key" ON "lto_registrations"("mv_file_number");

-- CreateIndex
CREATE INDEX "idx_lto_reg_sale" ON "lto_registrations"("sale_id");

-- CreateIndex
CREATE INDEX "idx_lto_reg_status" ON "lto_registrations"("status");

-- AddForeignKey
ALTER TABLE "lto_registrations" ADD CONSTRAINT "lto_registrations_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lto_registrations" ADD CONSTRAINT "lto_registrations_vehicle_unit_id_fkey" FOREIGN KEY ("vehicle_unit_id") REFERENCES "vehicle_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
