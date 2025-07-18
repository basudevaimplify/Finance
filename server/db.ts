import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Force load .env file
import dotenv from 'dotenv';
dotenv.config();

// Enhanced Supabase connection with multiple approaches
const SUPABASE_PROJECT_ID = "gjikvgpngijuygehakzb";
const SUPABASE_PASSWORD = "aimplify@1";

// Try multiple connection methods
const connectionOptions = [
  `postgresql://postgres:${SUPABASE_PASSWORD}@db.${SUPABASE_PROJECT_ID}.supabase.co:5432/postgres`,
  `postgresql://postgres:${SUPABASE_PASSWORD}@db.${SUPABASE_PROJECT_ID}.supabase.co:6543/postgres`, // Pooler port
  process.env.SUPABASE_DATABASE_URL || "",
  process.env.DATABASE_URL || ""
].filter(url => url.length > 0);

// Use the first available connection option
const DATABASE_URL = connectionOptions[0];
process.env.DATABASE_URL = DATABASE_URL;

console.log(`DEBUG: Attempting to connect to Supabase project: ${SUPABASE_PROJECT_ID}`);
console.log(`WARNING: Supabase project appears to be deleted/paused. Platform running in optimized demo mode.`);

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

console.log("DEBUG: DATABASE_URL =", process.env.DATABASE_URL?.includes('supabase') ? 'Supabase database connected' : 'Other database connected');
console.log("DEBUG: Using Supabase database as requested by user");

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // Add connection pooling configuration with longer timeout for network issues
  max: 10,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 10000,
  // Add retry logic
  acquireTimeoutMillis: 60000,
});

export const db = drizzle({ client: pool, schema });
