import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

const DB_PATH =
  process.env.DATABASE_URL?.replace(/^file:/, "") ||
  path.join(process.cwd(), "data", "wholecuts.db");

type DB = BetterSQLite3Database<typeof schema>;

declare global {
  var __sqlite: Database.Database | undefined;
  var __db: DB | undefined;
}

function getSqlite() {
  if (!globalThis.__sqlite) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    const s = new Database(DB_PATH);
    s.pragma("journal_mode = WAL");
    s.pragma("foreign_keys = ON");
    globalThis.__sqlite = s;
  }
  return globalThis.__sqlite;
}

function getDb() {
  return (globalThis.__db ??= drizzle(getSqlite(), { schema }));
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

export const sqlite = lazy(getSqlite);
export const db = lazy(getDb);
export { schema };