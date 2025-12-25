-- =====================================================
-- Add Trade-in Appraisal Reference to Sales Enquiry
-- =====================================================
-- This script adds the TRADEIN_APPRAISAL_SLNO column
-- to the DMS_SALESENQUIRY table
-- Execute this in SAP HANA Studio or HANA SQL Console
-- =====================================================

ALTER TABLE "BI_NEGT_KSA"."DMS_SALESENQUIRY"
ADD ("TRADEIN_APPRAISAL_SLNO" INTEGER);

-- Create index for faster lookups
CREATE INDEX "IDX_ENQUIRY_TRADEIN" ON "BI_NEGT_KSA"."DMS_SALESENQUIRY"("TRADEIN_APPRAISAL_SLNO");

SELECT 'Column TRADEIN_APPRAISAL_SLNO added successfully!' AS STATUS FROM DUMMY;
