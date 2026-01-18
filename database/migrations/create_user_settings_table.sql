-- =====================================================
-- Create DMS_USER_SETTINGS Table
-- =====================================================
-- Description: Creates user settings table with discount limits
-- Author: Claude Code
-- Date: 2025-12-26
-- =====================================================

-- Create the user settings table
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
-- Insert Sample Users with Discount Limits
-- =====================================================
-- These are example entries - adjust based on your actual users

-- Example: Salesperson with 5,000 SAR limit
-- INSERT INTO "BI_NEGT_KSA"."DMS_USER_SETTINGS"
-- ("USER_ID", "USER_NAME", "USER_EMAIL", "USER_ROLE", "SLPCODE",
--  "DISCOUNT_LIMIT_AMOUNT", "DISCOUNT_LIMIT_PERCENTAGE", "CREATED_BY")
-- VALUES
-- ('salesperson1', 'John Doe', 'john@example.com', 'Salesperson', 'SLP001',
--  5000, 5, 'SYSTEM');

-- Example: Sales Manager with 25,000 SAR limit
-- INSERT INTO "BI_NEGT_KSA"."DMS_USER_SETTINGS"
-- ("USER_ID", "USER_NAME", "USER_EMAIL", "USER_ROLE", "SLPCODE",
--  "DISCOUNT_LIMIT_AMOUNT", "DISCOUNT_LIMIT_PERCENTAGE", "CREATED_BY")
-- VALUES
-- ('manager1', 'Jane Smith', 'jane@example.com', 'Sales Manager', 'SLP002',
--  25000, 15, 'SYSTEM');

-- =====================================================
-- Suggested Discount Limits by Role
-- =====================================================
-- Salesperson: 5,000 SAR (5%)
-- Senior Salesperson: 10,000 SAR (10%)
-- Sales Manager: 25,000 SAR (15%)
-- Sales Director: 50,000 SAR (20%)
-- General Manager: 999,999,999 SAR (unlimited)

-- =====================================================
-- To add your user, run:
-- =====================================================
-- INSERT INTO "BI_NEGT_KSA"."DMS_USER_SETTINGS"
-- ("USER_ID", "USER_NAME", "USER_EMAIL", "USER_ROLE", "SLPCODE",
--  "DISCOUNT_LIMIT_AMOUNT", "DISCOUNT_LIMIT_PERCENTAGE", "CREATED_BY")
-- VALUES
-- ('YOUR_USER_ID', 'Your Name', 'your@email.com', 'Salesperson', 'YOUR_SLPCODE',
--  10000, 10, 'SYSTEM');
