## SAP Integration Contract - Full DMS App (19 Processes)

### Scope
This document defines what SAP side must provide to fully integrate the DMS app across all 19 sales processes.

Processes in scope:
1. Create Sales enquiry
2. Open active sales enquiry
3. Select Vehicle
4. Book a Test Drive now
5. Book a Test Drive at a later Date
6. Add a trade-in and send for appraisal
7. Add Bank Funding
8. Print a quotation
9. Provide discount on the offer
10. Request discount from sales manager
11. Cancel or make changes to the quotation
12. Pass enquiry to cashier for deposit
13. Allocate a deposit to the enquiry
14. Reserve a vehicle
15. Print the Sales order
16. Cancel or make changes to the sales order
17. Pass the sales order to vehicle admin
18. Create a handover booking
19. Record as lost sale

---

## 1) What SAP Programmer Must Provide

1. SP/API list for all 19 processes (final names and signatures).
2. Input/output fields for each process (type + required/optional).
3. BI <-> SAP mapping and status mapping.
4. Business validations and error codes/messages.
5. UAT package: scripts, access, test data, expected results.

---

## 2) Process-by-Process Interface Matrix (to be filled by SAP)

| Slno | Process Name | SAP Interface Type (SP/API) | SP Name / API Endpoint | Required Input Fields | Response Fields | SAP Object/Table Mapping | BI Status -> SAP Status | Error Codes |
|---|---|---|---|---|---|---|---|---|
| 1 | Create Sales enquiry |  |  |  |  |  |  |  |
| 2 | Open active sales enquiry |  |  |  |  |  |  |  |
| 3 | Select Vehicle |  |  |  |  |  |  |  |
| 4 | Book a Test Drive now |  |  |  |  |  |  |  |
| 5 | Book a Test Drive at a later Date |  |  |  |  |  |  |  |
| 6 | Add a trade-in and send for appraisal |  |  |  |  |  |  |  |
| 7 | Add Bank Funding |  |  |  |  |  |  |  |
| 8 | Print a quotation |  |  |  |  |  |  |  |
| 9 | Provide discount on the offer |  |  |  |  |  |  |  |
| 10 | Request discount from sales manager |  |  |  |  |  |  |  |
| 11 | Cancel or make changes to the quotation |  |  |  |  |  |  |  |
| 12 | Pass enquiry to cashier for deposit |  |  |  |  |  |  |  |
| 13 | Allocate a deposit to the enquiry |  |  |  |  |  |  |  |
| 14 | Reserve a vehicle |  |  |  |  |  |  |  |
| 15 | Print the Sales order |  |  |  |  |  |  |  |
| 16 | Cancel or make changes to the sales order |  |  |  |  |  |  |  |
| 17 | Pass the sales order to vehicle admin |  |  |  |  |  |  |  |
| 18 | Create a handover booking |  |  |  |  |  |  |  |
| 19 | Record as lost sale |  |  |  |  |  |  |  |

---

## 3) Current BI Technical Baseline (already in app)

Known SAP-linked procedures currently called from backend:
1. `DMS_KSA_100001`
2. `DMS_KSA_100002`
3. `DMS_KSA_100003`
4. `DMS_KSA_100004`
5. `DMS_KSA_100005`
6. `DMS_KSA_100007`
7. `DMS_KSA_100014`
8. `DMS_KSA_100016`

Known direct SAP table fallback in backend:
1. `OCRD` (customer search fallback)

BI tables currently used by app:
1. `DMS_SALESENQUIRY`
2. `DMS_QUOTATION`
3. `DMS_QUOTATION_LINE_ITEMS`
4. `DMS_DISCOUNT_APPROVAL`
5. `DMS_QUOTATION_ACTIVITY`
6. `DMS_SALES_ORDER`
7. `DMS_ENQUIRY_FINANCING`
8. `DMS_LENDERS`
9. `DMS_TRADEIN_APPRAISAL`
10. `DMS_BOOKTESTDRIVE`
11. `DMS_TESTVEHICLE`
12. `DMS_USER_SETTINGS`

---

## 4) Non-Functional Integration Requirements

1. Idempotency: repeated request must not create duplicate SAP documents.
2. Audit trail: request payload, response payload, user, timestamp, correlation ID.
3. Timeout/retry policy: agreed limits and retry-safe operations only.
4. Security: dedicated integration user, minimum required permissions.
5. Environment parity: DEV/UAT/PROD procedure versions must match.

---

## 5) UAT Sign-off Criteria

1. All 19 processes pass happy-path scenarios.
2. All validation failures return correct SAP error codes/messages.
3. Data consistency is verified between BI and SAP for each process.
4. Print outputs (quotation, sales order, POD) match approved templates.
5. Negative tests pass: stock conflict, approval rejection, cancellation, lost sale.

---

## 6) Delivery Checklist for SAP Programmer

Mark each as Done/Pending:
1. Process interface matrix completed for all 19 rows.
2. Procedure/API technical specs delivered.
3. SQL deployment scripts delivered.
4. Error catalog delivered.
5. UAT credentials and test data delivered.
6. End-to-end test evidence shared.
