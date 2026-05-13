-- Find SAP Sales Orders that already use the same web references as DMS quotations/SOs.
-- These collisions cause SAP error 20240919:
-- "Job Order Web Reference Number already exists in SAP".

SELECT
  Q."SLNO" AS "DMS_SLNO",
  Q."QUOTATION_NUMBER" AS "DMS_DOCUMENT_NUMBER",
  Q."DOC_TYPE" AS "DMS_DOC_TYPE",
  Q."CUSTOMER_CODE" AS "DMS_CUSTOMER_CODE",
  Q."CUSTOMER_NAME" AS "DMS_CUSTOMER_NAME",
  O."DocEntry" AS "SAP_DOCENTRY",
  O."DocNum" AS "SAP_DOCNUM",
  O."CardCode" AS "SAP_CARDCODE",
  O."CardName" AS "SAP_CARDNAME",
  O."U_ECOMREFNUM" AS "SAP_WEB_REFERENCE",
  O."NumAtCard",
  O."DocDate",
  O."DocDueDate",
  O."CANCELED"
FROM "BI_NEGT_KSAISUZU"."DMS_QUOTATION" Q
INNER JOIN "NEKSAISUZU"."ORDR" O
  ON TO_NVARCHAR(O."U_ECOMREFNUM") = TO_NVARCHAR(Q."SLNO")
WHERE COALESCE(O."CANCELED", 'N') = 'N'
  AND COALESCE(Q."IS_DELETED", 'N') = 'N'
  AND COALESCE(O."CardCode", '') <> COALESCE(Q."CUSTOMER_CODE", '')
ORDER BY Q."SLNO", O."DocEntry" DESC;

