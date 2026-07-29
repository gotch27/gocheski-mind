import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { config } from "@/nextsignal/config";
import * as schema from "@/db/schema";

let database: NeonHttpDatabase<typeof schema> | undefined;

export async function getDatabase() {
  if (database) return database;

  await config.load();
  const url = config.require<string>("database.url");
  database = drizzle(neon(url), { schema });
  return database;
}
