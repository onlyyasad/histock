CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "permission" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "role_permissions_business_id_idx" ON "role_permissions"("business_id");

ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_business_id_role_permission_key" UNIQUE ("business_id", "role", "permission");
