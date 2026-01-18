-- =====================================================
-- Enquiry Financing Table Creation Script
-- =====================================================
-- This script creates the DMS_ENQUIRY_FINANCING table
-- for storing bank funding/financing schemes
-- Execute this in SAP HANA Studio or HANA SQL Console
-- =====================================================

CREATE TABLE "BI_NEGT_KSA"."DMS_ENQUIRY_FINANCING" (
  -- Primary Key
  "SLNO" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- Foreign Key to Sales Enquiry
  "ENQUIRY_SLNO" INTEGER NOT NULL,

  -- Lender Information
  "LENDER_CODE" NVARCHAR(50),
  "LENDER_NAME" NVARCHAR(200),
  "SCHEME_NAME" NVARCHAR(200),

  -- Financial Parameters
  "VEHICLE_PRICE" DECIMAL(18,2),      -- Total vehicle price
  "DOWNPAYMENT" DECIMAL(18,2),        -- Cash downpayment
  "DOWNPAYMENT_PERCENT" DECIMAL(5,2), -- Downpayment percentage
  "TRADE_IN_VALUE" DECIMAL(18,2),     -- Trade-in deduction
  "FINANCE_AMOUNT" DECIMAL(18,2),     -- Amount to be financed

  "TERM_MONTHS" INTEGER,              -- Loan term in months
  "INTEREST_RATE" DECIMAL(5,2),       -- Annual interest rate
  "MONTHLY_PAYMENT" DECIMAL(18,2),    -- Calculated monthly payment
  "TOTAL_INTEREST" DECIMAL(18,2),     -- Total interest over term

  -- Additional Parameters
  "FDA" DECIMAL(18,2),                -- Finance Deposit Amount
  "GPV_BALLOON" DECIMAL(18,2),        -- Guaranteed Purchase Value / Balloon payment
  "SALE_CODE" NVARCHAR(50),

  -- Status
  "STATUS" NVARCHAR(20) DEFAULT 'Draft',  -- Draft, Active, Approved, Rejected
  "IS_SELECTED" NVARCHAR(1) DEFAULT 'N',  -- Which scheme customer selected (Y/N)

  -- Audit Fields
  "CREATED_BY" NVARCHAR(100),
  "CREATED_DATE" NVARCHAR(30),
  "UPDATED_BY" NVARCHAR(100),
  "UPDATED_DATE" NVARCHAR(30),
  "IS_DELETED" NVARCHAR(1) DEFAULT 'N'
);

-- Add foreign key constraint (optional, comment out if not needed)
-- ALTER TABLE "BI_NEGT_KSA"."DMS_ENQUIRY_FINANCING"
-- ADD CONSTRAINT "FK_FINANCING_ENQUIRY"
-- FOREIGN KEY ("ENQUIRY_SLNO") REFERENCES "BI_NEGT_KSA"."DMS_SALESENQUIRY"("SLNO");

-- Create index on ENQUIRY_SLNO for faster lookups
CREATE INDEX "IDX_FINANCING_ENQUIRY" ON "BI_NEGT_KSA"."DMS_ENQUIRY_FINANCING"("ENQUIRY_SLNO");

-- Create index on LENDER_CODE for filtering
CREATE INDEX "IDX_FINANCING_LENDER" ON "BI_NEGT_KSA"."DMS_ENQUIRY_FINANCING"("LENDER_CODE");

-- Create index on STATUS for filtering
CREATE INDEX "IDX_FINANCING_STATUS" ON "BI_NEGT_KSA"."DMS_ENQUIRY_FINANCING"("STATUS");

-- Create index on IS_DELETED for soft delete queries
CREATE INDEX "IDX_FINANCING_DELETED" ON "BI_NEGT_KSA"."DMS_ENQUIRY_FINANCING"("IS_DELETED");

-- Create index on IS_SELECTED for preferred scheme lookup
CREATE INDEX "IDX_FINANCING_SELECTED" ON "BI_NEGT_KSA"."DMS_ENQUIRY_FINANCING"("IS_SELECTED");

SELECT 'Table DMS_ENQUIRY_FINANCING created successfully!' AS STATUS FROM DUMMY;
