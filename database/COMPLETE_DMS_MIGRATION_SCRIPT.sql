-- =====================================================
-- COMPLETE DMS SYSTEM DATABASE MIGRATION SCRIPT
-- =====================================================
-- Description: Complete database schema for DMS (Dealer Management System)
-- Author: Generated for SAP Administrator
-- Date: 2025-12-31
-- Database: SAP HANA
-- Schema: <TO_BE_DETERMINED_BY_SAP_ADMIN> (currently: BI_NEGT_KSA)
-- Tables: 11 DMS tables
-- Version: 1.0
-- =====================================================

-- =====================================================
-- INSTRUCTIONS FOR SAP ADMINISTRATOR
-- =====================================================
-- 1. IMPORTANT: Update schema name throughout this file
--    - Current schema: "BI_NEGT_KSA"
--    - Recommended: Use Find & Replace to update all instances
--    - Example: Replace "BI_NEGT_KSA" with "YOUR_SCHEMA_NAME"
--
-- 2. Review and execute each section in order
--    - DO NOT skip sections or reorder execution
--    - Verify each section completes successfully before proceeding
--
-- 3. Total tables to be created: 11
--    - Base tables: 5 (Lenders, User Settings, Test Vehicle, Sales Enquiry, Book Test Drive)
--    - Dependent tables: 6 (Trade-in, Financing, Quotation + 3 related)
--
-- 4. Execution time: Approximately 5-10 minutes
--
-- 5. Prerequisites:
--    - SAP HANA database access
--    - CREATE TABLE privileges
--    - CREATE INDEX privileges
--    - INSERT privileges
-- =====================================================

-- =====================================================
-- ROLLBACK/CLEANUP SECTION (COMMENTED OUT)
-- =====================================================
-- Uncomment and run these statements to remove all tables
-- WARNING: This will DELETE ALL DATA in these tables
-- Execute in reverse dependency order

/*
DROP TABLE IF EXISTS "BI_NEGT_KSA"."DMS_QUOTATION_ACTIVITY" CASCADE;
DROP TABLE IF EXISTS "BI_NEGT_KSA"."DMS_DISCOUNT_APPROVAL" CASCADE;
DROP TABLE IF EXISTS "BI_NEGT_KSA"."DMS_QUOTATION_LINE_ITEMS" CASCADE;
DROP TABLE IF EXISTS "BI_NEGT_KSA"."DMS_QUOTATION" CASCADE;
DROP TABLE IF EXISTS "BI_NEGT_KSA"."DMS_ENQUIRY_FINANCING" CASCADE;
DROP TABLE IF EXISTS "BI_NEGT_KSA"."DMS_TRADEIN_APPRAISAL" CASCADE;
DROP TABLE IF EXISTS "BI_NEGT_KSA"."DMS_BOOKTESTDRIVE" CASCADE;
DROP TABLE IF EXISTS "BI_NEGT_KSA"."DMS_SALESENQUIRY" CASCADE;
DROP TABLE IF EXISTS "BI_NEGT_KSA"."DMS_TESTVEHICLE" CASCADE;
DROP TABLE IF EXISTS "BI_NEGT_KSA"."DMS_USER_SETTINGS" CASCADE;
DROP TABLE IF EXISTS "BI_NEGT_KSA"."DMS_LENDERS" CASCADE;
*/

-- =====================================================
-- SECTION 1: BASE TABLES (NO DEPENDENCIES)
-- =====================================================
-- These tables have no foreign key dependencies and must be created first
-- Execution order: 1.1 → 1.2 → 1.3 → 1.4 → 1.5

-- =====================================================
-- 1.1: DMS_LENDERS - Bank/Lender Master Data
-- =====================================================
-- Purpose: Stores information about banks and financial institutions
--          offering vehicle financing
-- =====================================================

CREATE TABLE "BI_NEGT_KSA"."DMS_LENDERS" (
  -- Primary Key
  "LENDER_CODE" NVARCHAR(50) PRIMARY KEY,
  "LENDER_NAME" NVARCHAR(200) NOT NULL,
  "DESCRIPTION" NVARCHAR(500),
  "IS_ACTIVE" NVARCHAR(1) DEFAULT 'Y',
  "CREATED_DATE" NVARCHAR(30)
);

-- Create index on IS_ACTIVE for filtering active lenders
CREATE INDEX "IDX_LENDERS_ACTIVE" ON "BI_NEGT_KSA"."DMS_LENDERS"("IS_ACTIVE");

-- =====================================================
-- 1.2: DMS_USER_SETTINGS - User Settings and Discount Limits
-- =====================================================
-- Purpose: Stores user preferences and discount approval limits
--          Controls authorization levels for discounts
-- =====================================================

CREATE TABLE "BI_NEGT_KSA"."DMS_USER_SETTINGS" (
  -- Primary Key
  "SLNO" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- User Identification
  "USER_ID" NVARCHAR(50) NOT NULL UNIQUE,
  "USER_NAME" NVARCHAR(100),
  "USER_EMAIL" NVARCHAR(100),
  "USER_ROLE" NVARCHAR(50),
  "SLPCODE" NVARCHAR(20),

  -- Discount Limits
  "DISCOUNT_LIMIT_AMOUNT" DECIMAL(18,2) DEFAULT 0,
  "DISCOUNT_LIMIT_PERCENTAGE" DECIMAL(5,2) DEFAULT 0,

  -- User Preferences (for future use)
  "PREFERRED_LANGUAGE" NVARCHAR(10) DEFAULT 'en',
  "TIMEZONE" NVARCHAR(50) DEFAULT 'Asia/Riyadh',
  "NOTIFICATIONS_ENABLED" CHAR(1) DEFAULT 'Y',

  -- Audit Fields
  "CREATED_BY" NVARCHAR(100),
  "CREATED_DATE" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "UPDATED_BY" NVARCHAR(100),
  "UPDATED_DATE" TIMESTAMP,
  "IS_DELETED" CHAR(1) DEFAULT 'N',

  -- Constraints
  CONSTRAINT "CHK_USER_SETTINGS_DELETED" CHECK ("IS_DELETED" IN ('Y', 'N')),
  CONSTRAINT "CHK_USER_SETTINGS_NOTIFICATIONS" CHECK ("NOTIFICATIONS_ENABLED" IN ('Y', 'N'))
);

-- Create indexes for performance
CREATE INDEX "IDX_USER_SETTINGS_USER_ID" ON "BI_NEGT_KSA"."DMS_USER_SETTINGS"("USER_ID");
CREATE INDEX "IDX_USER_SETTINGS_SLPCODE" ON "BI_NEGT_KSA"."DMS_USER_SETTINGS"("SLPCODE");
CREATE INDEX "IDX_USER_SETTINGS_ROLE" ON "BI_NEGT_KSA"."DMS_USER_SETTINGS"("USER_ROLE");
CREATE INDEX "IDX_USER_SETTINGS_DELETED" ON "BI_NEGT_KSA"."DMS_USER_SETTINGS"("IS_DELETED");

-- Add table comment
COMMENT ON TABLE "BI_NEGT_KSA"."DMS_USER_SETTINGS" IS 'User settings and preferences including discount approval limits';

-- =====================================================
-- 1.3: DMS_TESTVEHICLE - Test Vehicle Inventory
-- =====================================================
-- Purpose: Stores test drive vehicle inventory
-- =====================================================

-- Note: Based on service usage, this table structure should exist
-- If you have the complete CREATE TABLE statement for DMS_TESTVEHICLE,
-- please provide it to the SAP administrator
-- For now, we include a basic structure:

-- CREATE TABLE "BI_NEGT_KSA"."DMS_TESTVEHICLE" (
--   "SLNO" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
--   "REGISTRATION_NUMBER" NVARCHAR(100),
--   "MANUFACTURER" NVARCHAR(100),
--   "MODEL" NVARCHAR(100),
--   "VARIANT" NVARCHAR(100),
--   "DESCRIPTION" NVARCHAR(500),
--   "BODY_STYLE" NVARCHAR(100),
--   "STATUS" NVARCHAR(50),
--   "CREATED_BY" NVARCHAR(100),
--   "CREATED_DATE" NVARCHAR(30),
--   "UPDATED_BY" NVARCHAR(100),
--   "UPDATED_DATE" NVARCHAR(30),
--   "IS_DELETED" NVARCHAR(1) DEFAULT 'N'
-- );

-- CREATE INDEX "IDX_TESTVEHICLE_STATUS" ON "BI_NEGT_KSA"."DMS_TESTVEHICLE"("STATUS");
-- CREATE INDEX "IDX_TESTVEHICLE_DELETED" ON "BI_NEGT_KSA"."DMS_TESTVEHICLE"("IS_DELETED");

-- =====================================================
-- 1.4: DMS_SALESENQUIRY - Sales Enquiry Main Table
-- =====================================================
-- Purpose: Stores sales enquiries for vehicle sales
-- =====================================================

CREATE COLUMN TABLE "BI_NEGT_KSA"."DMS_SALESENQUIRY" (
    -- Primary Key
    "SLNO" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    -- Customer Information
    "CUSTOMERID" NVARCHAR(50),
    "CUSTOMERNAME" NVARCHAR(200),
    "ADDRESS" NVARCHAR(500),
    "POSTCODE" NVARCHAR(20),
    "HOMEPHONE" NVARCHAR(50),
    "WORKPHONE" NVARCHAR(50),
    "MOBILE" NVARCHAR(50) NOT NULL,
    "HOMEEMAIL" NVARCHAR(200),

    -- Vehicle Details
    "MAKE" NVARCHAR(100),
    "MAKENAME" NVARCHAR(200),
    "MODEL" NVARCHAR(100),
    "MODELNAME" NVARCHAR(200),
    "VARIANT" NVARCHAR(100),
    "VARIANTNAME" NVARCHAR(200),
    "YEAR" NVARCHAR(10),
    "COLOR" NVARCHAR(100),
    "SUPPCATNUM" NVARCHAR(100),
    "MODELCODE" NVARCHAR(100),
    "QUANTITY" INTEGER DEFAULT 1,
    "VINNUMBER" NVARCHAR(100),
    "VINDETAILS" NCLOB, -- JSON string of VIN details

    -- Enquiry Details
    "BRANCH" NVARCHAR(100),
    "BRANCHNAME" NVARCHAR(200),
    "BUDGET" NVARCHAR(100),
    "FINANCING" NVARCHAR(20), -- 'yes', 'no', 'maybe'
    "PREFERREDCONTACT" NVARCHAR(50), -- 'phone', 'email', 'whatsapp', 'sms'
    "PREFERREDTIME" NVARCHAR(50), -- 'morning', 'afternoon', 'evening', 'anytime'
    "PREFERREDDELIVERY" NVARCHAR(200),
    "SOURCE" NVARCHAR(100), -- Lead source
    "SALESTYPE" NVARCHAR(50), -- Sales type

    -- Trade-in Vehicle
    "TRADEINMAKE" NVARCHAR(100),
    "TRADEINMODEL" NVARCHAR(100),
    "TRADEINYEAR" NVARCHAR(10),
    "TRADEINKMS" NVARCHAR(50),
    "TRADEINEXPECTEDPRICE" NVARCHAR(100),

    -- Additional Information
    "SALESPERSON" NVARCHAR(200),
    "SLPCODE" NVARCHAR(50),
    "NOTES" NCLOB,

    -- Status & Tracking
    "STATUS" NVARCHAR(50) DEFAULT 'Active', -- 'Active', 'Contacted', 'Qualified', 'Converted', 'Lost', 'Closed'
    "PRIORITY" NVARCHAR(20) DEFAULT 'Medium', -- 'Low', 'Medium', 'High'
    "FOLLOWUPDATE" NVARCHAR(50),
    "FOLLOWUPNOTES" NCLOB,

    -- Audit Fields
    "CREATEDDATE" NVARCHAR(50) NOT NULL,
    "CREATEDBY" NVARCHAR(200) NOT NULL,
    "UPDATEDDATE" NVARCHAR(50),
    "UPDATEDBY" NVARCHAR(200)
);

-- Create indexes for better query performance
CREATE INDEX "IDX_SALESENQUIRY_CUSTOMER" ON "BI_NEGT_KSA"."DMS_SALESENQUIRY" ("CUSTOMERID");
CREATE INDEX "IDX_SALESENQUIRY_STATUS" ON "BI_NEGT_KSA"."DMS_SALESENQUIRY" ("STATUS");
CREATE INDEX "IDX_SALESENQUIRY_SALESPERSON" ON "BI_NEGT_KSA"."DMS_SALESENQUIRY" ("SLPCODE");
CREATE INDEX "IDX_SALESENQUIRY_CREATED" ON "BI_NEGT_KSA"."DMS_SALESENQUIRY" ("CREATEDDATE");

-- =====================================================
-- 1.5: DMS_BOOKTESTDRIVE - Test Drive Bookings
-- =====================================================
-- Purpose: Stores test drive booking information
-- =====================================================

CREATE COLUMN TABLE "BI_NEGT_KSA"."DMS_BOOKTESTDRIVE" (
    -- Primary Key
    "SLNO" INTEGER CS_INT GENERATED BY DEFAULT AS IDENTITY NOT NULL,

    -- Customer Information
    "CUSTOMERID" VARCHAR(50),
    "CUSTOMERNAME" NVARCHAR(200) NOT NULL,
    "COMPANYNAME" NVARCHAR(200),
    "POSTCODE" NVARCHAR(20),
    "ADDRESS" NVARCHAR(500) NOT NULL,
    "PHONENUMBER" NVARCHAR(50),
    "EMAIL" NVARCHAR(200),

    -- Vehicle Booking Details
    "REGISTRATIONNUM" VARCHAR(100),
    "MANUFACTURER" NVARCHAR(100),
    "MANUFACTURERNAME" NVARCHAR(200),
    "MODEL" NVARCHAR(100),
    "MODELNAME" NVARCHAR(200),
    "VARIANT" NVARCHAR(100),
    "VARIANTNAME" NVARCHAR(200),
    "DESCRIPTION" NVARCHAR(500),
    "BODYSTYLE" NVARCHAR(100),

    -- Booking Details
    "DATEOUT" SECONDDATE CS_SECONDDATE NOT NULL,
    "TIMEOUT" TIME CS_TIME,
    "DATEIN" SECONDDATE CS_SECONDDATE NOT NULL,
    "TIMEIN" TIME CS_TIME,
    "OUTBRANCH" VARCHAR(20),
    "OUTBRANCHNAME" NVARCHAR(200),
    "INBRANCH" VARCHAR(20),
    "INBRANCHNAME" NVARCHAR(200),
    "SALESEXECUTIVE" VARCHAR(50),
    "SALESEXECUTIVENAME" NVARCHAR(200),
    "APPROVEDBY" VARCHAR(50),
    "QUICKBOOKING" NVARCHAR(5),
    "NEWORUSED" NVARCHAR(1),
    "NEWORUSEDLABEL" NVARCHAR(50),

    -- Optional Notes
    "NOTES" NVARCHAR(1000),

    -- Audit Fields
    "CREATEDDATE" SECONDDATE CS_SECONDDATE,
    "CREATEDBY" VARCHAR(8),
    "UPDATEDDATE" SECONDDATE CS_SECONDDATE,
    "UPDATEDBY" VARCHAR(8),
    "STATUS" NVARCHAR(20),

    -- Primary Key Constraint
    PRIMARY KEY ("SLNO")
) UNLOAD PRIORITY 5 AUTO MERGE;

-- Create Indexes for better query performance
CREATE INDEX "IDX_DMS_BOOKTESTDRIVE_CUSTOMERID" ON "BI_NEGT_KSA"."DMS_BOOKTESTDRIVE" ("CUSTOMERID");
CREATE INDEX "IDX_DMS_BOOKTESTDRIVE_REGISTRATIONNUM" ON "BI_NEGT_KSA"."DMS_BOOKTESTDRIVE" ("REGISTRATIONNUM");
CREATE INDEX "IDX_DMS_BOOKTESTDRIVE_DATEOUT" ON "BI_NEGT_KSA"."DMS_BOOKTESTDRIVE" ("DATEOUT");
CREATE INDEX "IDX_DMS_BOOKTESTDRIVE_DATEIN" ON "BI_NEGT_KSA"."DMS_BOOKTESTDRIVE" ("DATEIN");
CREATE INDEX "IDX_DMS_BOOKTESTDRIVE_STATUS" ON "BI_NEGT_KSA"."DMS_BOOKTESTDRIVE" ("STATUS");

-- =====================================================
-- SECTION 2: DEPENDENT TABLES
-- =====================================================
-- These tables have foreign key dependencies on base tables
-- Execution order: 2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6

-- =====================================================
-- 2.1: DMS_TRADEIN_APPRAISAL - Trade-in Appraisal
-- =====================================================
-- Purpose: Trade-in vehicle appraisal and valuation
-- Dependencies: DMS_SALESENQUIRY
-- =====================================================

CREATE TABLE "BI_NEGT_KSA"."DMS_TRADEIN_APPRAISAL" (
  -- Primary Key
  "SLNO" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- Foreign Key to Sales Enquiry
  "ENQUIRY_SLNO" INTEGER NOT NULL,

  -- Vehicle Information
  "REGISTRATION_NUMBER" NVARCHAR(50),
  "VIN" NVARCHAR(50),
  "MANUFACTURER" NVARCHAR(100),
  "MODEL" NVARCHAR(100),
  "VARIANT" NVARCHAR(100),
  "DESCRIPTION" NVARCHAR(500),
  "COLOUR" NVARCHAR(50),
  "TRIM" NVARCHAR(50),
  "BODY_STYLE" NVARCHAR(50),
  "TRANSMISSION" NVARCHAR(50),
  "FUEL_TYPE" NVARCHAR(50),
  "ENGINE_SIZE" NVARCHAR(50),
  "REGISTRATION_DATE" NVARCHAR(30),
  "ODOMETER_READING" NVARCHAR(20),
  "NUMBER_OF_DOORS" NVARCHAR(10),

  -- Valuation
  "CUSTOMER_EXPECTED_PRICE" NVARCHAR(20),
  "MARKET_VALUE" NVARCHAR(20),
  "APPRAISAL_OFFER" NVARCHAR(20),

  -- Appraisal Workflow
  "APPRAISAL_STATUS" NVARCHAR(20), -- Pending, InProgress, Completed, Approved, Rejected
  "REQUESTED_BY" NVARCHAR(100),
  "REQUESTED_DATE" NVARCHAR(30),
  "ASSIGNED_TO" NVARCHAR(100), -- User who will perform appraisal
  "APPRAISED_BY" NVARCHAR(100),
  "APPRAISED_DATE" NVARCHAR(30),
  "REQUEST_NOTES" NCLOB,
  "APPRAISAL_NOTES" NCLOB,

  -- Audit Fields
  "CREATED_BY" NVARCHAR(100),
  "CREATED_DATE" NVARCHAR(30),
  "UPDATED_BY" NVARCHAR(100),
  "UPDATED_DATE" NVARCHAR(30),
  "IS_DELETED" NVARCHAR(1) DEFAULT 'N'
);

-- Create index on ENQUIRY_SLNO for faster lookups
CREATE INDEX "IDX_TRADEIN_ENQUIRY" ON "BI_NEGT_KSA"."DMS_TRADEIN_APPRAISAL"("ENQUIRY_SLNO");

-- Create index on APPRAISAL_STATUS for filtering
CREATE INDEX "IDX_TRADEIN_STATUS" ON "BI_NEGT_KSA"."DMS_TRADEIN_APPRAISAL"("APPRAISAL_STATUS");

-- Create index on IS_DELETED for soft delete queries
CREATE INDEX "IDX_TRADEIN_DELETED" ON "BI_NEGT_KSA"."DMS_TRADEIN_APPRAISAL"("IS_DELETED");

-- =====================================================
-- 2.2: DMS_ENQUIRY_FINANCING - Financing Schemes
-- =====================================================
-- Purpose: Stores financing/bank funding schemes for enquiries
-- Dependencies: DMS_SALESENQUIRY, DMS_LENDERS
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

-- =====================================================
-- 2.3: DMS_QUOTATION - Main Quotation Table
-- =====================================================
-- Purpose: Main quotation table storing vehicle sales quotations
-- Dependencies: DMS_SALESENQUIRY, DMS_TRADEIN_APPRAISAL
-- =====================================================

CREATE TABLE "BI_NEGT_KSA"."DMS_QUOTATION" (
  -- Primary Key
  "SLNO" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- Foreign Keys & References
  "ENQUIRY_SLNO" INTEGER NOT NULL,
  "QUOTATION_NUMBER" NVARCHAR(50) UNIQUE NOT NULL,

  -- Versioning
  "VERSION" INTEGER DEFAULT 1 NOT NULL,
  "PARENT_QUOTATION_SLNO" INTEGER,
  "IS_LATEST_VERSION" NVARCHAR(1) DEFAULT 'Y' NOT NULL,

  -- Customer Information (denormalized for historical record)
  "CUSTOMER_NAME" NVARCHAR(200),
  "CUSTOMER_MOBILE" NVARCHAR(50),
  "CUSTOMER_EMAIL" NVARCHAR(200),
  "CUSTOMER_ADDRESS" NVARCHAR(500),

  -- Vehicle Information (denormalized)
  "VEHICLE_MAKE" NVARCHAR(100),
  "VEHICLE_MODEL" NVARCHAR(100),
  "VEHICLE_VARIANT" NVARCHAR(100),
  "VEHICLE_YEAR" NVARCHAR(10),
  "VEHICLE_COLOR" NVARCHAR(100),
  "VIN_NUMBER" NVARCHAR(100),

  -- Vehicle Pricing
  "VEHICLE_BASE_PRICE" DECIMAL(18,2) DEFAULT 0 NOT NULL,
  "VEHICLE_DISCOUNT" DECIMAL(18,2) DEFAULT 0,
  "VEHICLE_NET_PRICE" DECIMAL(18,2) DEFAULT 0 NOT NULL,

  -- Accessories Pricing
  "ACCESSORIES_TOTAL" DECIMAL(18,2) DEFAULT 0,
  "ACCESSORIES_DISCOUNT" DECIMAL(18,2) DEFAULT 0,
  "ACCESSORIES_NET_TOTAL" DECIMAL(18,2) DEFAULT 0,

  -- Other Pricing Components
  "WARRANTY_TOTAL" DECIMAL(18,2) DEFAULT 0,
  "INSURANCE_TOTAL" DECIMAL(18,2) DEFAULT 0,

  -- Total Calculations
  "SUBTOTAL" DECIMAL(18,2) DEFAULT 0 NOT NULL,
  "TAX_RATE" DECIMAL(5,2) DEFAULT 15.00,
  "TAX_AMOUNT" DECIMAL(18,2) DEFAULT 0 NOT NULL,
  "GRAND_TOTAL" DECIMAL(18,2) DEFAULT 0 NOT NULL,

  -- Trade-in & Financing
  "TRADE_IN_VALUE" DECIMAL(18,2) DEFAULT 0,
  "TRADE_IN_APPRAISAL_SLNO" INTEGER,
  "FINANCING_SCHEME_SLNO" INTEGER,
  "DOWNPAYMENT" DECIMAL(18,2) DEFAULT 0,
  "NET_AMOUNT_DUE" DECIMAL(18,2) DEFAULT 0 NOT NULL,

  -- Discount Summary
  "TOTAL_DISCOUNT_AMOUNT" DECIMAL(18,2) DEFAULT 0,
  "DISCOUNT_PERCENTAGE" DECIMAL(5,2) DEFAULT 0,
  "REQUIRES_APPROVAL" NVARCHAR(1) DEFAULT 'N',
  "DISCOUNT_APPROVAL_STATUS" NVARCHAR(20),
  "DISCOUNT_APPROVED_BY" NVARCHAR(100),
  "DISCOUNT_APPROVED_DATE" NVARCHAR(30),
  "DISCOUNT_APPROVAL_NOTES" NCLOB,

  -- Status & Workflow
  "STATUS" NVARCHAR(20) DEFAULT 'Draft',
  "VALID_UNTIL" NVARCHAR(30),
  "SENT_DATE" NVARCHAR(30),
  "SENT_TO_EMAIL" NVARCHAR(200),

  -- Cashier Handoff
  "PASSED_TO_CASHIER" NVARCHAR(1) DEFAULT 'N',
  "PASSED_TO_CASHIER_DATE" NVARCHAR(30),
  "PASSED_TO_CASHIER_BY" NVARCHAR(100),
  "DEPOSIT_AMOUNT" DECIMAL(18,2) DEFAULT 0,
  "DEPOSIT_COLLECTED" NVARCHAR(1) DEFAULT 'N',

  -- Notes & Terms
  "NOTES" NCLOB,
  "TERMS_AND_CONDITIONS" NCLOB,
  "INTERNAL_NOTES" NCLOB,

  -- Salesperson & Branch
  "SALESPERSON" NVARCHAR(200),
  "SLPCODE" NVARCHAR(50) NOT NULL,
  "BRANCH" NVARCHAR(100),

  -- Audit Fields
  "CREATED_BY" NVARCHAR(100) NOT NULL,
  "CREATED_DATE" NVARCHAR(30) NOT NULL,
  "UPDATED_BY" NVARCHAR(100),
  "UPDATED_DATE" NVARCHAR(30),
  "IS_DELETED" NVARCHAR(1) DEFAULT 'N'
);

-- Indexes for DMS_QUOTATION
CREATE INDEX "IDX_QUOTATION_ENQUIRY" ON "BI_NEGT_KSA"."DMS_QUOTATION"("ENQUIRY_SLNO");
CREATE INDEX "IDX_QUOTATION_NUMBER" ON "BI_NEGT_KSA"."DMS_QUOTATION"("QUOTATION_NUMBER");
CREATE INDEX "IDX_QUOTATION_STATUS" ON "BI_NEGT_KSA"."DMS_QUOTATION"("STATUS");
CREATE INDEX "IDX_QUOTATION_SLPCODE" ON "BI_NEGT_KSA"."DMS_QUOTATION"("SLPCODE");
CREATE INDEX "IDX_QUOTATION_VERSION" ON "BI_NEGT_KSA"."DMS_QUOTATION"("PARENT_QUOTATION_SLNO", "IS_LATEST_VERSION");
CREATE INDEX "IDX_QUOTATION_DELETED" ON "BI_NEGT_KSA"."DMS_QUOTATION"("IS_DELETED");
CREATE INDEX "IDX_QUOTATION_APPROVAL" ON "BI_NEGT_KSA"."DMS_QUOTATION"("DISCOUNT_APPROVAL_STATUS");
CREATE INDEX "IDX_QUOTATION_CREATED_DATE" ON "BI_NEGT_KSA"."DMS_QUOTATION"("CREATED_DATE");

-- Add table comment
COMMENT ON TABLE "BI_NEGT_KSA"."DMS_QUOTATION" IS 'Main quotation table storing vehicle sales quotations with pricing, discounts, and approval workflow';

-- =====================================================
-- 2.4: DMS_QUOTATION_LINE_ITEMS - Quotation Line Items
-- =====================================================
-- Purpose: Line items for quotations (vehicle, accessories, warranties, services)
-- Dependencies: DMS_QUOTATION
-- =====================================================

CREATE TABLE "BI_NEGT_KSA"."DMS_QUOTATION_LINE_ITEMS" (
  -- Primary Key
  "SLNO" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- Foreign Key
  "QUOTATION_SLNO" INTEGER NOT NULL,

  -- Line Item Details
  "LINE_NUMBER" INTEGER NOT NULL,
  "ITEM_TYPE" NVARCHAR(20) NOT NULL,
  "ITEM_CODE" NVARCHAR(100),
  "ITEM_DESCRIPTION" NVARCHAR(500) NOT NULL,
  "ITEM_CATEGORY" NVARCHAR(100),

  -- Pricing
  "QUANTITY" INTEGER DEFAULT 1 NOT NULL,
  "UNIT_PRICE" DECIMAL(18,2) DEFAULT 0 NOT NULL,
  "DISCOUNT_AMOUNT" DECIMAL(18,2) DEFAULT 0,
  "DISCOUNT_PERCENTAGE" DECIMAL(5,2) DEFAULT 0,
  "NET_PRICE" DECIMAL(18,2) DEFAULT 0 NOT NULL,
  "TAX_INCLUDED" NVARCHAR(1) DEFAULT 'N',

  -- Optional Accessory Details
  "MANUFACTURER" NVARCHAR(100),
  "PART_NUMBER" NVARCHAR(100),
  "WARRANTY_PERIOD" NVARCHAR(50),

  -- Notes
  "NOTES" NCLOB,

  -- Audit Fields
  "CREATED_BY" NVARCHAR(100) NOT NULL,
  "CREATED_DATE" NVARCHAR(30) NOT NULL,
  "UPDATED_BY" NVARCHAR(100),
  "UPDATED_DATE" NVARCHAR(30),
  "IS_DELETED" NVARCHAR(1) DEFAULT 'N'
);

-- Indexes for DMS_QUOTATION_LINE_ITEMS
CREATE INDEX "IDX_LINE_ITEMS_QUOTATION" ON "BI_NEGT_KSA"."DMS_QUOTATION_LINE_ITEMS"("QUOTATION_SLNO");
CREATE INDEX "IDX_LINE_ITEMS_TYPE" ON "BI_NEGT_KSA"."DMS_QUOTATION_LINE_ITEMS"("ITEM_TYPE");
CREATE INDEX "IDX_LINE_ITEMS_DELETED" ON "BI_NEGT_KSA"."DMS_QUOTATION_LINE_ITEMS"("IS_DELETED");
CREATE INDEX "IDX_LINE_ITEMS_LINE_NUMBER" ON "BI_NEGT_KSA"."DMS_QUOTATION_LINE_ITEMS"("QUOTATION_SLNO", "LINE_NUMBER");

-- Add table comment
COMMENT ON TABLE "BI_NEGT_KSA"."DMS_QUOTATION_LINE_ITEMS" IS 'Line items for quotations including vehicle, accessories, warranties, and services';

-- =====================================================
-- 2.5: DMS_DISCOUNT_APPROVAL - Discount Approval Workflow
-- =====================================================
-- Purpose: Discount approval workflow tracking
-- Dependencies: DMS_QUOTATION
-- =====================================================

CREATE TABLE "BI_NEGT_KSA"."DMS_DISCOUNT_APPROVAL" (
  -- Primary Key
  "SLNO" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- Foreign Key
  "QUOTATION_SLNO" INTEGER NOT NULL,

  -- Request Details
  "REQUEST_TYPE" NVARCHAR(20) DEFAULT 'Discount',
  "DISCOUNT_AMOUNT" DECIMAL(18,2) NOT NULL,
  "DISCOUNT_PERCENTAGE" DECIMAL(5,2) NOT NULL,
  "JUSTIFICATION" NCLOB NOT NULL,

  -- User Limits
  "REQUESTED_BY" NVARCHAR(100) NOT NULL,
  "REQUESTED_BY_SLPCODE" NVARCHAR(50) NOT NULL,
  "USER_DISCOUNT_LIMIT" DECIMAL(18,2),
  "AMOUNT_OVER_LIMIT" DECIMAL(18,2),

  -- Approval Workflow
  "STATUS" NVARCHAR(20) DEFAULT 'Pending',
  "ASSIGNED_TO" NVARCHAR(100),
  "ASSIGNED_TO_ROLE" NVARCHAR(50),
  "APPROVED_BY" NVARCHAR(100),
  "APPROVED_BY_SLPCODE" NVARCHAR(50),
  "APPROVED_DATE" NVARCHAR(30),
  "REJECTION_REASON" NCLOB,
  "APPROVAL_NOTES" NCLOB,

  -- Request Timestamp
  "REQUESTED_DATE" NVARCHAR(30) NOT NULL,

  -- Audit Fields
  "CREATED_BY" NVARCHAR(100) NOT NULL,
  "CREATED_DATE" NVARCHAR(30) NOT NULL,
  "UPDATED_BY" NVARCHAR(100),
  "UPDATED_DATE" NVARCHAR(30),
  "IS_DELETED" NVARCHAR(1) DEFAULT 'N'
);

-- Indexes for DMS_DISCOUNT_APPROVAL
CREATE INDEX "IDX_DISCOUNT_APPROVAL_QUOTATION" ON "BI_NEGT_KSA"."DMS_DISCOUNT_APPROVAL"("QUOTATION_SLNO");
CREATE INDEX "IDX_DISCOUNT_APPROVAL_STATUS" ON "BI_NEGT_KSA"."DMS_DISCOUNT_APPROVAL"("STATUS");
CREATE INDEX "IDX_DISCOUNT_APPROVAL_ASSIGNED" ON "BI_NEGT_KSA"."DMS_DISCOUNT_APPROVAL"("ASSIGNED_TO");
CREATE INDEX "IDX_DISCOUNT_APPROVAL_REQUESTED" ON "BI_NEGT_KSA"."DMS_DISCOUNT_APPROVAL"("REQUESTED_BY_SLPCODE");
CREATE INDEX "IDX_DISCOUNT_APPROVAL_DELETED" ON "BI_NEGT_KSA"."DMS_DISCOUNT_APPROVAL"("IS_DELETED");
CREATE INDEX "IDX_DISCOUNT_APPROVAL_REQUESTED_DATE" ON "BI_NEGT_KSA"."DMS_DISCOUNT_APPROVAL"("REQUESTED_DATE");

-- Add table comment
COMMENT ON TABLE "BI_NEGT_KSA"."DMS_DISCOUNT_APPROVAL" IS 'Discount approval workflow tracking for quotations exceeding user limits';

-- =====================================================
-- 2.6: DMS_QUOTATION_ACTIVITY - Activity Log
-- =====================================================
-- Purpose: Activity log and follow-up tasks for quotations
-- Dependencies: DMS_QUOTATION
-- =====================================================

CREATE TABLE "BI_NEGT_KSA"."DMS_QUOTATION_ACTIVITY" (
  -- Primary Key
  "SLNO" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- Foreign Key
  "QUOTATION_SLNO" INTEGER NOT NULL,

  -- Activity Details
  "ACTIVITY_TYPE" NVARCHAR(50) NOT NULL,
  "ACTIVITY_DESCRIPTION" NVARCHAR(500),
  "ACTIVITY_NOTES" NCLOB,

  -- Follow-up Task
  "IS_FOLLOW_UP" NVARCHAR(1) DEFAULT 'N',
  "FOLLOW_UP_DATE" NVARCHAR(30),
  "FOLLOW_UP_ASSIGNED_TO" NVARCHAR(100),
  "FOLLOW_UP_STATUS" NVARCHAR(20) DEFAULT 'Pending',
  "FOLLOW_UP_COMPLETED_DATE" NVARCHAR(30),

  -- Audit
  "CREATED_BY" NVARCHAR(100) NOT NULL,
  "CREATED_DATE" NVARCHAR(30) NOT NULL,
  "IS_DELETED" NVARCHAR(1) DEFAULT 'N'
);

-- Indexes for DMS_QUOTATION_ACTIVITY
CREATE INDEX "IDX_ACTIVITY_QUOTATION" ON "BI_NEGT_KSA"."DMS_QUOTATION_ACTIVITY"("QUOTATION_SLNO");
CREATE INDEX "IDX_ACTIVITY_TYPE" ON "BI_NEGT_KSA"."DMS_QUOTATION_ACTIVITY"("ACTIVITY_TYPE");
CREATE INDEX "IDX_ACTIVITY_FOLLOW_UP" ON "BI_NEGT_KSA"."DMS_QUOTATION_ACTIVITY"("IS_FOLLOW_UP", "FOLLOW_UP_STATUS");
CREATE INDEX "IDX_ACTIVITY_DELETED" ON "BI_NEGT_KSA"."DMS_QUOTATION_ACTIVITY"("IS_DELETED");
CREATE INDEX "IDX_ACTIVITY_CREATED_DATE" ON "BI_NEGT_KSA"."DMS_QUOTATION_ACTIVITY"("CREATED_DATE");

-- Add table comment
COMMENT ON TABLE "BI_NEGT_KSA"."DMS_QUOTATION_ACTIVITY" IS 'Activity log and follow-up tasks for quotations';

-- =====================================================
-- SECTION 3: ALTER TABLES (ADDITIONAL COLUMNS)
-- =====================================================
-- Add columns to existing tables for cross-references

-- =====================================================
-- 3.1: Add Trade-in Appraisal Reference to Sales Enquiry
-- =====================================================

ALTER TABLE "BI_NEGT_KSA"."DMS_SALESENQUIRY"
ADD ("TRADEIN_APPRAISAL_SLNO" INTEGER);

-- Create index for faster lookups
CREATE INDEX "IDX_ENQUIRY_TRADEIN" ON "BI_NEGT_KSA"."DMS_SALESENQUIRY"("TRADEIN_APPRAISAL_SLNO");

-- =====================================================
-- SECTION 4: FOREIGN KEY CONSTRAINTS
-- =====================================================
-- Add foreign key constraints for referential integrity
-- Note: SAP HANA supports foreign keys but they are optional
-- Uncomment these if you want to enforce referential integrity

-- DMS_TRADEIN_APPRAISAL → DMS_SALESENQUIRY
ALTER TABLE "BI_NEGT_KSA"."DMS_TRADEIN_APPRAISAL"
ADD CONSTRAINT "FK_TRADEIN_ENQUIRY"
FOREIGN KEY ("ENQUIRY_SLNO")
REFERENCES "BI_NEGT_KSA"."DMS_SALESENQUIRY"("SLNO");

-- DMS_ENQUIRY_FINANCING → DMS_SALESENQUIRY
ALTER TABLE "BI_NEGT_KSA"."DMS_ENQUIRY_FINANCING"
ADD CONSTRAINT "FK_FINANCING_ENQUIRY"
FOREIGN KEY ("ENQUIRY_SLNO")
REFERENCES "BI_NEGT_KSA"."DMS_SALESENQUIRY"("SLNO");

-- DMS_ENQUIRY_FINANCING → DMS_LENDERS
ALTER TABLE "BI_NEGT_KSA"."DMS_ENQUIRY_FINANCING"
ADD CONSTRAINT "FK_FINANCING_LENDER"
FOREIGN KEY ("LENDER_CODE")
REFERENCES "BI_NEGT_KSA"."DMS_LENDERS"("LENDER_CODE");

-- DMS_QUOTATION → DMS_SALESENQUIRY
ALTER TABLE "BI_NEGT_KSA"."DMS_QUOTATION"
ADD CONSTRAINT "FK_QUOTATION_ENQUIRY"
FOREIGN KEY ("ENQUIRY_SLNO")
REFERENCES "BI_NEGT_KSA"."DMS_SALESENQUIRY"("SLNO");

-- DMS_QUOTATION → DMS_QUOTATION (parent quotation)
ALTER TABLE "BI_NEGT_KSA"."DMS_QUOTATION"
ADD CONSTRAINT "FK_QUOTATION_PARENT"
FOREIGN KEY ("PARENT_QUOTATION_SLNO")
REFERENCES "BI_NEGT_KSA"."DMS_QUOTATION"("SLNO");

-- DMS_QUOTATION → DMS_TRADEIN_APPRAISAL
ALTER TABLE "BI_NEGT_KSA"."DMS_QUOTATION"
ADD CONSTRAINT "FK_QUOTATION_TRADEIN"
FOREIGN KEY ("TRADE_IN_APPRAISAL_SLNO")
REFERENCES "BI_NEGT_KSA"."DMS_TRADEIN_APPRAISAL"("SLNO");

-- DMS_QUOTATION_LINE_ITEMS → DMS_QUOTATION
ALTER TABLE "BI_NEGT_KSA"."DMS_QUOTATION_LINE_ITEMS"
ADD CONSTRAINT "FK_LINE_ITEMS_QUOTATION"
FOREIGN KEY ("QUOTATION_SLNO")
REFERENCES "BI_NEGT_KSA"."DMS_QUOTATION"("SLNO");

-- DMS_DISCOUNT_APPROVAL → DMS_QUOTATION
ALTER TABLE "BI_NEGT_KSA"."DMS_DISCOUNT_APPROVAL"
ADD CONSTRAINT "FK_DISCOUNT_QUOTATION"
FOREIGN KEY ("QUOTATION_SLNO")
REFERENCES "BI_NEGT_KSA"."DMS_QUOTATION"("SLNO");

-- DMS_QUOTATION_ACTIVITY → DMS_QUOTATION
ALTER TABLE "BI_NEGT_KSA"."DMS_QUOTATION_ACTIVITY"
ADD CONSTRAINT "FK_ACTIVITY_QUOTATION"
FOREIGN KEY ("QUOTATION_SLNO")
REFERENCES "BI_NEGT_KSA"."DMS_QUOTATION"("SLNO");

-- =====================================================
-- SECTION 5: INITIAL DATA
-- =====================================================
-- Insert master data and initial records

-- =====================================================
-- 5.1: Insert Lender Data (8 Banks)
-- =====================================================

INSERT INTO "BI_NEGT_KSA"."DMS_LENDERS" ("LENDER_CODE", "LENDER_NAME", "DESCRIPTION", "IS_ACTIVE", "CREATED_DATE")
VALUES ('ENBD', 'Emirates NBD', 'Emirates NBD Bank', 'Y', '2025-12-31 00:00:00');

INSERT INTO "BI_NEGT_KSA"."DMS_LENDERS" ("LENDER_CODE", "LENDER_NAME", "DESCRIPTION", "IS_ACTIVE", "CREATED_DATE")
VALUES ('FAB', 'First Abu Dhabi Bank', 'FAB - First Abu Dhabi Bank', 'Y', '2025-12-31 00:00:00');

INSERT INTO "BI_NEGT_KSA"."DMS_LENDERS" ("LENDER_CODE", "LENDER_NAME", "DESCRIPTION", "IS_ACTIVE", "CREATED_DATE")
VALUES ('ADCB', 'Abu Dhabi Commercial Bank', 'ADCB', 'Y', '2025-12-31 00:00:00');

INSERT INTO "BI_NEGT_KSA"."DMS_LENDERS" ("LENDER_CODE", "LENDER_NAME", "DESCRIPTION", "IS_ACTIVE", "CREATED_DATE")
VALUES ('DIB', 'Dubai Islamic Bank', 'DIB - Islamic Banking', 'Y', '2025-12-31 00:00:00');

INSERT INTO "BI_NEGT_KSA"."DMS_LENDERS" ("LENDER_CODE", "LENDER_NAME", "DESCRIPTION", "IS_ACTIVE", "CREATED_DATE")
VALUES ('ADIB', 'Abu Dhabi Islamic Bank', 'ADIB - Islamic Banking', 'Y', '2025-12-31 00:00:00');

INSERT INTO "BI_NEGT_KSA"."DMS_LENDERS" ("LENDER_CODE", "LENDER_NAME", "DESCRIPTION", "IS_ACTIVE", "CREATED_DATE")
VALUES ('RAKBANK', 'RAKBANK', 'The National Bank of Ras Al Khaimah', 'Y', '2025-12-31 00:00:00');

INSERT INTO "BI_NEGT_KSA"."DMS_LENDERS" ("LENDER_CODE", "LENDER_NAME", "DESCRIPTION", "IS_ACTIVE", "CREATED_DATE")
VALUES ('MASHREQ', 'Mashreq Bank', 'Mashreq Bank', 'Y', '2025-12-31 00:00:00');

INSERT INTO "BI_NEGT_KSA"."DMS_LENDERS" ("LENDER_CODE", "LENDER_NAME", "DESCRIPTION", "IS_ACTIVE", "CREATED_DATE")
VALUES ('CBD', 'Commercial Bank of Dubai', 'CBD', 'Y', '2025-12-31 00:00:00');

-- =====================================================
-- SECTION 6: VERIFICATION
-- =====================================================
-- Run these queries to verify successful migration

-- =====================================================
-- 6.1: Verify All Tables Created
-- =====================================================

SELECT COUNT(*) AS TABLE_COUNT
FROM TABLES
WHERE SCHEMA_NAME = 'BI_NEGT_KSA'
  AND TABLE_NAME LIKE 'DMS_%';

-- Expected result: 11 tables (or 10 if DMS_TESTVEHICLE was commented out)

-- =====================================================
-- 6.2: List All DMS Tables
-- =====================================================

SELECT TABLE_NAME
FROM TABLES
WHERE SCHEMA_NAME = 'BI_NEGT_KSA'
  AND TABLE_NAME LIKE 'DMS_%'
ORDER BY TABLE_NAME;

-- =====================================================
-- 6.3: Verify Lenders Data
-- =====================================================

SELECT COUNT(*) AS LENDER_COUNT
FROM "BI_NEGT_KSA"."DMS_LENDERS";

-- Expected result: 8 lenders

-- =====================================================
-- 6.4: Display All Lenders
-- =====================================================

SELECT "LENDER_CODE", "LENDER_NAME", "IS_ACTIVE"
FROM "BI_NEGT_KSA"."DMS_LENDERS"
ORDER BY "LENDER_NAME";

-- =====================================================
-- 6.5: Verify All Indexes Created
-- =====================================================

SELECT INDEX_NAME, TABLE_NAME
FROM INDEXES
WHERE SCHEMA_NAME = 'BI_NEGT_KSA'
  AND TABLE_NAME LIKE 'DMS_%'
ORDER BY TABLE_NAME, INDEX_NAME;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- If all verification queries return expected results,
-- the migration has been completed successfully!
--
-- Next Steps:
-- 1. Update application connection strings to use new schema
-- 2. Grant appropriate permissions to application users
-- 3. Test application connectivity
-- 4. Create backup/disaster recovery plan
-- =====================================================
