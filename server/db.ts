import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

console.log("DEBUG: DATABASE_URL =", DATABASE_URL?.split('@')[0] + '@***'); // Hide password in logs

export const pool = new Pool({ 
  connectionString: DATABASE_URL,
  // Add connection pooling configuration
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle({ client: pool, schema });
