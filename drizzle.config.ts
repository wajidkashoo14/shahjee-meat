import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema/index.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: (process.env.DATABASE_URL || "file:./data/wholecuts.db").replace(/^file:/, ""),
  },
});
