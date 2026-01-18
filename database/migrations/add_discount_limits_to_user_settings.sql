-- =====================================================
-- Add Discount Limits to DMS_USER_SETTINGS
-- =====================================================
-- Description: Adds discount limit fields to user settings table
-- Author: Claude Code
-- Date: 2025-12-26
-- =====================================================

-- Add DISCOUNT_LIMIT_AMOUNT column (in SAR)
ALTER TABLE "BI_NEGT_KSA"."DMS_USER_SETTINGS"
ADD ("DISCOUNT_LIMIT_AMOUNT" DECIMAL(18,2) DEFAULT 0);

-- Add DISCOUNT_LIMIT_PERCENTAGE column
ALTER TABLE "BI_NEGT_KSA"."DMS_USER_SETTINGS"
ADD ("DISCOUNT_LIMIT_PERCENTAGE" DECIMAL(5,2) DEFAULT 0);

-- =====================================================
-- Set Default Discount Limits by Role (Optional)
-- =====================================================
-- You can set default limits based on user roles
-- Uncomment and adjust values as needed:

-- Example: Set limits for all users with 'Salesperson' role
-- UPDATE "BI_NEGT_KSA"."DMS_USER_SETTINGS"
-- SET "DISCOUNT_LIMIT_AMOUNT" = 5000,
--     "DISCOUNT_LIMIT_PERCENTAGE" = 5
-- WHERE "USER_ROLE" = 'Salesperson';

-- Example: Set limits for all users with 'Sales Manager' role
-- UPDATE "BI_NEGT_KSA"."DMS_USER_SETTINGS"
-- SET "DISCOUNT_LIMIT_AMOUNT" = 25000,
--     "DISCOUNT_LIMIT_PERCENTAGE" = 15
-- WHERE "USER_ROLE" = 'Sales Manager';

-- =====================================================
-- Verify the changes
-- =====================================================
-- SELECT "USER_ID", "USER_NAME", "USER_ROLE",
--        "DISCOUNT_LIMIT_AMOUNT", "DISCOUNT_LIMIT_PERCENTAGE"
-- FROM "BI_NEGT_KSA"."DMS_USER_SETTINGS";
