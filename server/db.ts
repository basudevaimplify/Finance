import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Force load .env file
import dotenv from 'dotenv';
dotenv.config();

// Use Supabase database as requested by user
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:aimplify@1@db.gjikvgpngijuygehakzb.supabase.co:5432/postgres";

// Override with user's specific Supabase database
if (!process.env.DATABASE_URL?.includes('supabase')) {
  // User specifically requested Supabase database
  const supabaseUrl = "postgresql://postgres:aimplify@1@db.gjikvgpngijuygehakzb.supabase.co:5432/postgres";
  process.env.DATABASE_URL = supabaseUrl;
}

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
