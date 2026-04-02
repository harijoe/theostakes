import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "@/env";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let _db: Db | null = null;

function getDb(): Db {
  if (!_db) {
    const sql = neon(env.POSTGRES_URL!);
    _db = drizzle(sql, { schema });
  }
  return _db;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db: Db = new Proxy({} as Db, {
  get(_target, prop) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (getDb() as any)[prop];
  },
});
