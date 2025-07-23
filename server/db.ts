import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Hardcoded database URL
const DATABASE_URL = 'postgresql://qrt_user:1@localhost:5432/qrt_closure';

console.log(`DEBUG: Connecting to default PostgreSQL database`);
console.log(`DEBUG: DATABASE_URL =`, DATABASE_URL.includes('postgres') ? 'PostgreSQL database connected' : 'Database connected');

export const pool = new Pool({ 
  connectionString: DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const db = drizzle({ client: pool, schema });
