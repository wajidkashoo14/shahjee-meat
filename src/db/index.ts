import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "node:path";
import * as schema from "./schema";

const DB_PATH = process.env.DATABASE_URL?.replace(/^file:/, "") || path.join(process.cwd(), "data", "wholecuts.db");

declare global {
  var __sqlite: Database.Database | undefined;
}

const sqlite = globalThis.__sqlite ?? new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
if (process.env.NODE_ENV !== "production") globalThis.__sqlite = sqlite;

export const db = drizzle(sqlite, { schema });
export { schema };
export { sqlite };
