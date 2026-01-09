/**
 * Módulo MCP Database para Deco CMS
 *
 * Uso:
 * ```ts
 * import { DatabaseClient, getDatabase } from "site/mcp/mod.ts";
 *
 * // Uso simples (requer ADMIN_DB_TOKEN nas env vars)
 * const db = getDatabase();
 * const result = await db.query("SELECT * FROM contents");
 *
 * // Helpers
 * const contents = await db.select("contents", { where: "author = 'Deco'", limit: 10 });
 * ```
 */

export {
  DatabaseClient,
  DEFAULT_API_URL,
  getDatabase,
} from "./database.ts";

export type { DatabaseClientOptions, QueryResult } from "./database.ts";
