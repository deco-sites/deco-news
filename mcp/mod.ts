/**
 * Módulo MCP Client para Deco Gateway - scrape_content
 *
 * Uso:
 * ```ts
 * import { MCPClient, scrapeContent } from "site/mcp/mod.ts";
 *
 * // Uso simples (requer MCP_BEARER_TOKEN nas env vars)
 * const result = await scrapeContent("https://example.com");
 *
 * // Uso avançado
 * const client = new MCPClient({ bearerToken: "seu-token" });
 * await client.initialize();
 * const tools = await client.listTools();
 * const result = await client.scrapeContent("https://example.com");
 *
 * // Tool genérica
 * const result = await client.callTool("scrape_content", { url: "https://example.com" });
 * ```
 */

export {
  MCPClient,
  MCP_GATEWAY_URL,
  scrapeContent,
} from "./client.ts";

export type { MCPClientOptions } from "./client.ts";

