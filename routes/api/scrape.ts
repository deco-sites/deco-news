import { Handlers } from "$fresh/server.ts";
import { MCPClient } from "site/mcp/mod.ts";

const BEARER_TOKEN = Deno.env.get("MCP_BEARER_TOKEN") || "bKnXLRrjwFivSpqhzznaySIwbhfwSAbi";

export const handler: Handlers = {
  async GET(req) {
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get("url") || "https://example.com";

    try {
      const client = new MCPClient({ bearerToken: BEARER_TOKEN });
      await client.initialize();
      const result = await client.scrapeContent(targetUrl);
      const data = JSON.parse(result.content[0].text || "{}");

      return new Response(JSON.stringify(data), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      return new Response(
        JSON.stringify({ success: false, error: message }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  },
};

