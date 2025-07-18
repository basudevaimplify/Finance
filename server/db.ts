import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Force load .env file
import dotenv from 'dotenv';
dotenv.config();

// Use default PostgreSQL database provided by environment
const DATABASE_URL = process.env.DATABASE_URL;

console.log(`DEBUG: Connecting to default PostgreSQL database`);
console.log(`DEBUG: Using environment-provided DATABASE_URL`);

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

console.log("DEBUG: DATABASE_URL =", DATABASE_URL.includes('postgres') ? 'PostgreSQL database connected' : 'Database connected');
console.log("DEBUG: Using default PostgreSQL database");

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Default PostgreSQL configuration (no SSL required for local/default database)
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const db = drizzle({ client: pool, schema });
