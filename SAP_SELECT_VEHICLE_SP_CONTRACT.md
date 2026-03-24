## SAP Select Vehicle Integration Contract (BI + SAP)

### Purpose
This document defines what SAP side must provide so the **Select Vehicle** flow works correctly in BI without manual DB updates.

### Current BI Integration Points
Backend currently calls these procedures:
1. `DMS_KSA_100007(?)` - vehicle search
2. `DMS_KSA_100014(?, ?, ?)` - VIN list by product/customer
3. `DMS_KSA_100016()` - inventory fallback

If SAP changes procedure names or signatures, BI backend must be updated accordingly.

---

## 1) Procedure Contract Required from SAP

### A. Vehicle Search Procedure
- Purpose: return vehicle models/items for selection.
- Input:
  - `searchTerm` (NVARCHAR, nullable)
- Output fields required by BI:
  - `ItemCode`
  - `ItemName`
  - `FrgnName`
  - `ItmsGrpNam`
  - `SuppCatNum`
  - `U_Veh_Color`
  - `Model Description`
  - `Model Year`
  - `Model Code`
  - `Total Stock`
  - `In Sales Orders`
  - `Allocated`
  - `Available`

### B. VIN Fetch Procedure
- Purpose: return VIN-level rows for selected vehicle.
- Input (current BI expectation):
  - `mode` (currently `0`)
  - `customerId` (NVARCHAR)
  - `ProductCode` (NVARCHAR / ItemCode)
- Output fields required by BI:
  - VIN identity (at least one):
    - `VIN` or `VINNUMBER` or `U_Veh_StockID`
  - `ItemCode`
  - `Location`
  - `WhsName`
  - `U_Veh_Color`
  - `U_Veh_ModelDescr`
  - `U_Veh_MY`
  - `U_Vehicle_MC`
  - `Price`
  - `Discprice`
  - `Currency`

### C. Inventory Fallback Procedure
- Purpose: fallback source for inventory list.
- Input:
  - none (or as agreed)
- Output:
  - must include VIN-level details compatible with VIN selection in BI.

---

## 2) SAP Business Rules to Enforce
1. Return only valid VINs: not sold, not reserved, not blocked/cancelled.
2. Enforce branch/warehouse visibility and user restrictions.
3. Prevent duplicate VIN in response.
4. Deterministic sorting (e.g., by availability then in-date).
5. If no data, return empty set (not broken schema).

---

## 3) Error Contract Required
For SP/API failures, provide consistent error payload/logging fields:
1. `errorCode`
2. `errorMessage`
3. `context` (optional: productCode, branch, user)

Error cases to cover:
1. Invalid product code
2. No available stock
3. Unauthorized branch/warehouse
4. SAP timeout/internal error

---

## 4) UAT Handover Package Required from SAP Programmer
1. Final procedure names and signatures.
2. Sample calls with parameters.
3. Sample successful responses (vehicle search + VIN list).
4. Sample error responses.
5. Test dataset:
   - valid item codes
   - available VINs
   - reserved/sold VINs for negative testing
6. Required DB grants/permissions for BI technical user.
7. Deployment scripts (if UDF/UDT/SP changes are needed).

---

## 5) BI Acceptance Criteria
1. Vehicle list loads from SAP procedure.
2. VIN list loads from SAP procedure for selected item/customer.
3. Selected VIN is saved and flows to:
   - Sales Enquiry -> Quotation -> Sales Order.
4. Reserve Vehicle action can be enabled based on valid VIN.
5. Invalid/reserved VIN is blocked with clear error.

---

## 6) Confirmation Checklist (SAP Programmer)
Please confirm each item with **Done / Pending**:
1. Vehicle search SP finalized
2. VIN fetch SP finalized
3. Inventory fallback finalized
4. Output field names finalized
5. Business rules implemented
6. Error codes documented
7. UAT test data shared
8. Access and permissions shared

