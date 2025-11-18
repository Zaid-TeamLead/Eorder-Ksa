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
