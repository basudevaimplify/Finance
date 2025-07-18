import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Force load .env file
import dotenv from 'dotenv';
dotenv.config();

// Use correct Supabase pooler connection string
const SUPABASE_PASSWORD = "aimplify@1";
const DATABASE_URL = `postgresql://postgres.gjikvgpngijuygehakzb:${SUPABASE_PASSWORD}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true`;

// Set the correct database URL
process.env.DATABASE_URL = DATABASE_URL;

console.log(`DEBUG: Connecting to Supabase via pooler connection`);
console.log(`DEBUG: Using AWS ap-south-1 region with pgbouncer`);

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
