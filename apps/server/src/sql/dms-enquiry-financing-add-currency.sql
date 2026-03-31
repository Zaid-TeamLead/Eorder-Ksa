-- Add currency column to financing schemes table
-- Schema: BI_NEGT_KSAISUZU

ALTER TABLE "BI_NEGT_KSAISUZU"."DMS_ENQUIRY_FINANCING"
ADD ("CURRENCY" NVARCHAR(10));
