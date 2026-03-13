-- =====================================================
-- Sales Order Reservation Columns Migration
-- =====================================================
-- Description: Adds vehicle reservation fields for sales order workflow
-- Date: 2026-03-11
-- =====================================================

ALTER TABLE "BI_NEGT_KSA"."DMS_SALES_ORDER"
  ADD ("VEHICLE_RESERVED" NVARCHAR(1) DEFAULT 'N');

ALTER TABLE "BI_NEGT_KSA"."DMS_SALES_ORDER"
  ADD ("VEHICLE_RESERVED_DATE" NVARCHAR(30));

ALTER TABLE "BI_NEGT_KSA"."DMS_SALES_ORDER"
  ADD ("VEHICLE_RESERVED_BY" NVARCHAR(100));

ALTER TABLE "BI_NEGT_KSA"."DMS_SALES_ORDER"
  ADD ("VEHICLE_RESERVATION_NOTES" NCLOB);
