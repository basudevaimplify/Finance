import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const DATABASE_URL = process.env.DATABASE_URL;

console.log("DEBUG: DATABASE_URL =", DATABASE_URL);

export const pool = new Pool({ 
  connectionString: DATABASE_URL
});
export const db = drizzle({ client: pool, schema });
