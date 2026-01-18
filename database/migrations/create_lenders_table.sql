-- =====================================================
-- Lenders Master Table Creation Script
-- =====================================================
-- This script creates the DMS_LENDERS table
-- for storing bank/lender information
-- Execute this in SAP HANA Studio or HANA SQL Console
-- =====================================================

CREATE TABLE "BI_NEGT_KSA"."DMS_LENDERS" (
  -- Primary Key
  "LENDER_CODE" NVARCHAR(50) PRIMARY KEY,
  "LENDER_NAME" NVARCHAR(200) NOT NULL,
  "DESCRIPTION" NVARCHAR(500),
  "IS_ACTIVE" NVARCHAR(1) DEFAULT 'Y',
  "CREATED_DATE" NVARCHAR(30)
);

-- Insert initial lender data (individual INSERT statements for SAP HANA compatibility)
INSERT INTO "BI_NEGT_KSA"."DMS_LENDERS" ("LENDER_CODE", "LENDER_NAME", "DESCRIPTION", "IS_ACTIVE", "CREATED_DATE")
VALUES ('ENBD', 'Emirates NBD', 'Emirates NBD Bank', 'Y', '2025-12-25 00:00:00');

INSERT INTO "BI_NEGT_KSA"."DMS_LENDERS" ("LENDER_CODE", "LENDER_NAME", "DESCRIPTION", "IS_ACTIVE", "CREATED_DATE")
VALUES ('FAB', 'First Abu Dhabi Bank', 'FAB - First Abu Dhabi Bank', 'Y', '2025-12-25 00:00:00');

INSERT INTO "BI_NEGT_KSA"."DMS_LENDERS" ("LENDER_CODE", "LENDER_NAME", "DESCRIPTION", "IS_ACTIVE", "CREATED_DATE")
VALUES ('ADCB', 'Abu Dhabi Commercial Bank', 'ADCB', 'Y', '2025-12-25 00:00:00');

INSERT INTO "BI_NEGT_KSA"."DMS_LENDERS" ("LENDER_CODE", "LENDER_NAME", "DESCRIPTION", "IS_ACTIVE", "CREATED_DATE")
VALUES ('DIB', 'Dubai Islamic Bank', 'DIB - Islamic Banking', 'Y', '2025-12-25 00:00:00');

INSERT INTO "BI_NEGT_KSA"."DMS_LENDERS" ("LENDER_CODE", "LENDER_NAME", "DESCRIPTION", "IS_ACTIVE", "CREATED_DATE")
VALUES ('ADIB', 'Abu Dhabi Islamic Bank', 'ADIB - Islamic Banking', 'Y', '2025-12-25 00:00:00');

INSERT INTO "BI_NEGT_KSA"."DMS_LENDERS" ("LENDER_CODE", "LENDER_NAME", "DESCRIPTION", "IS_ACTIVE", "CREATED_DATE")
VALUES ('RAKBANK', 'RAKBANK', 'The National Bank of Ras Al Khaimah', 'Y', '2025-12-25 00:00:00');

INSERT INTO "BI_NEGT_KSA"."DMS_LENDERS" ("LENDER_CODE", "LENDER_NAME", "DESCRIPTION", "IS_ACTIVE", "CREATED_DATE")
VALUES ('MASHREQ', 'Mashreq Bank', 'Mashreq Bank', 'Y', '2025-12-25 00:00:00');

INSERT INTO "BI_NEGT_KSA"."DMS_LENDERS" ("LENDER_CODE", "LENDER_NAME", "DESCRIPTION", "IS_ACTIVE", "CREATED_DATE")
VALUES ('CBD', 'Commercial Bank of Dubai', 'CBD', 'Y', '2025-12-25 00:00:00');

-- Create index on IS_ACTIVE for filtering active lenders
CREATE INDEX "IDX_LENDERS_ACTIVE" ON "BI_NEGT_KSA"."DMS_LENDERS"("IS_ACTIVE");

SELECT 'Table DMS_LENDERS created successfully with ' || COUNT(*) || ' lenders!' AS STATUS
FROM "BI_NEGT_KSA"."DMS_LENDERS";
