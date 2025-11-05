#!/usr/bin/env bun

import { randomBytes } from "crypto";
import { writeFileSync, existsSync, readFileSync } from "fs";
import { join } from "path";

/**
 * Generate a secure random secret string
 * @param length - Length of the secret in bytes (default: 32 bytes = 64 hex characters)
 * @returns A hexadecimal string
 */
function generateSecret(length: number = 32): string {
  return randomBytes(length).toString("hex");
}

/**
 * Update or create .env file with JWT secrets
 */
function updateEnvFile(
  envPath: string,
  jwtSecret: string,
  jwtRefreshSecret: string
): void {
  let envContent = "";

  if (existsSync(envPath)) {
    envContent = readFileSync(envPath, "utf-8");
  }

  // Update or add JWT_SECRET
  if (envContent.includes("JWT_SECRET=")) {
    envContent = envContent.replace(
      /JWT_SECRET=.*/g,
      `JWT_SECRET=${jwtSecret}`
    );
  } else {
    envContent += `\nJWT_SECRET=${jwtSecret}`;
  }

  // Update or add JWT_REFRESH_SECRET
  if (envContent.includes("JWT_REFRESH_SECRET=")) {
    envContent = envContent.replace(
      /JWT_REFRESH_SECRET=.*/g,
      `JWT_REFRESH_SECRET=${jwtRefreshSecret}`
    );
  } else {
    envContent += `\nJWT_REFRESH_SECRET=${jwtRefreshSecret}`;
  }

  writeFileSync(envPath, envContent.trim() + "\n", "utf-8");
}

/**
 * Generate JWT secrets and output them in .env format
 */
function main() {
  const jwtSecret = generateSecret(32); // 64 characters
  const jwtRefreshSecret = generateSecret(32); // 64 characters

  const envPath = join(process.cwd(), ".env");
  updateEnvFile(envPath, jwtSecret, jwtRefreshSecret);
}

main();
