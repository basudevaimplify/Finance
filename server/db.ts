import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const DATABASE_URL = "postgresql://postgres:aimplify@1@db.gjikvgpngijuygehakzb.supabase.co:5432/postgres";

console.log("DEBUG: DATABASE_URL =", DATABASE_URL);

export const pool = new Pool({ 
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
export const db = drizzle({ client: pool, schema });
