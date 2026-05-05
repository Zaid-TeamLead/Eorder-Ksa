import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z
    .string()
    .regex(/^\d+$/)
    .default("3000")
    .transform((val) => Number(val)),
  CORS_ORIGIN: z
    .string()
    .url()
    .default("http://localhost:3001")
    .transform((val) => val.replace(/\/$/, "")), // Remove trailing slash
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  EXTERNAL_API_URL: z.string().url().default("http://localhost:3000"),
  SO_SQ_API_URL: z.string().url().default("https://sq.neweast.cloud/postdms/"),
  DMS_SALES_QUOTATION_API_URL: z
    .string()
    .url()
    .default("https://sq.neweast.cloud/api/Values/CreateDMSSalesQuotation"),
  DMS_SALES_ORDER_API_URL: z
    .string()
    .url()
    .default("https://sq.neweast.cloud/api/Values/CreateDMSSalesORder"),
  // Legacy sales-order-only ASP endpoint kept optional during transition.
  SO_SQ_REPORT_URL: z.string().url().default("https://bi.neweast.cloud/reportsisuzu.aspx"),
  SO_SQ_FROM_DATE: z.string().default("2024-01-01"),
  SO_SQ_LOTP: z.string().default("QD"),
  SO_SQ_COMPANY: z.string().optional(),
  DMS_QUEUE_USER_ID: z.string().optional(),
  SO_SQ_COMPANY_BI: z.string().default("LLC"),
  SO_SQ_ORDER_SOURCE: z.string().default("DMS-EORDER"),
  SO_SQ_DEFAULT_TAX_CODE: z.string().default(""),
  SO_SQ_DEFAULT_UOM: z.string().default("PCS"),
  CONVERT_SALES_DOC_API_URL: z.string().url().default("http://20.74.153.184:9669"),
  CONVERT_SALES_DOC_COMPANY_DB: z.string().default("NEKSAISUZU"),
  CONVERT_SALES_DOC_OPTION: z.enum(["P", "F"]).default("P"),
  CONVERT_SALES_DOC_BASE_REF: z.enum(["DocEntry", "DocNum"]).default("DocNum"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .regex(/^\d+$/)
    .default("900000")
    .transform((val) => Number(val)),
  RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .regex(/^\d+$/)
    .default("100")
    .transform((val) => Number(val)),
  // SAP HANA Database Configuration
  SERVERNODE: z.string().min(1, "SERVERNODE is required"),
  USERID: z.string().min(1, "USERID is required"),
  PASSWORD: z.string().min(1, "PASSWORD is required"),
  CURRENTSCHEMA: z.string().optional(),
  POOLING: z
    .string()
    .regex(/^(true|false)$/i)
    .default("true")
    .transform((val) => val.toLowerCase() === "true"),
  CONNECTIONLIFETIME: z
    .string()
    .regex(/^\d+$/)
    .default("30000")
    .transform((val) => Number(val)),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error("❌ Invalid environment variables:");
    error.issues.forEach((issue) => {
      const path = issue.path.join(".");
      console.error(`  ${path}: ${issue.message}`);
    });
    process.exit(1);
  }
  throw error;
}

export { env };
