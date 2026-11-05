import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

type DB = NodePgDatabase<typeof schema>;

declare global {
  var __pool: Pool | undefined;
  var __db: DB | undefined;
}

function getPool() {
  if (!globalThis.__pool) {
    const url = process.env.DATABASE_URL;
    if (!url || !/^postgres(ql)?:\/\//.test(url)) {
      throw new Error(
        "DATABASE_URL must be a Postgres connection string (e.g. your Neon URL).",
      );
    }
    globalThis.__pool = new Pool({
      connectionString: url,
      // Keep the pool small: each serverless instance gets its own.
      max: process.env.VERCEL ? 3 : 10,
    });
  }
  return globalThis.__pool;
}

function getDb() {
  return (globalThis.__db ??= drizzle(getPool(), { schema }));
}

function lazy<T extends object>(get: () => T): T {
  return new Proxy({} as T, {
    get(_, prop) {
      const target = get();
      const v = Reflect.get(target, prop);
      return typeof v === "function" ? v.bind(target) : v;
    },
  });
}

/** Raw pg pool (used for closing connections in scripts). */
export const pool = lazy(getPool);
export const db = lazy(getDb);
export { schema };
