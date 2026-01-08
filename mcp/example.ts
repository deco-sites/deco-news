/**
 * Exemplo de uso do cliente MCP - scrape_content
 *
 * Execute com:
 * MCP_BEARER_TOKEN=seu-token deno run -A mcp/example.ts
 */

import { MCPClient } from "./client.ts";

async function main() {
  const token = Deno.env.get("MCP_BEARER_TOKEN");

  if (!token) {
    console.log("⚠️  MCP_BEARER_TOKEN não configurado.");
    console.log("   Exemplo: MCP_BEARER_TOKEN=seu-token deno run -A mcp/example.ts\n");
    return;
  }

  const client = new MCPClient({ bearerToken: token });

  console.log("🚀 Iniciando cliente MCP...\n");

  try {
    // 1. Inicializar conexão
    await client.initialize();
    console.log("✅ Conectado ao gateway!\n");

    // 2. Listar tools
    console.log("📋 Tools disponíveis:");
    const tools = await client.listTools();
    for (const tool of tools) {
      console.log(`   • ${tool.name}: ${tool.description || ""}`);
    }
    console.log("");

    // 3. Chamar scrape_content
    console.log("🔍 Chamando scrape_content...\n");
    const result = await client.scrapeContent("https://example.com");

    // Parse e exibe o resultado
    const data = JSON.parse(result.content[0].text || "{}");

    if (data.success && data.data?.sources) {
      console.log(`✅ Sucesso! ${data.data.sources.length} fonte(s) encontrada(s):\n`);
      for (const source of data.data.sources.slice(0, 5)) {
        console.log(`📰 ${source.title}`);
        console.log(`   URL: ${source.url}`);
        console.log(`   Conteúdo: ${source.content?.slice(0, 150)}...\n`);
      }
    } else {
      console.log("Resultado:", JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("❌ Erro:", error);
  }
}

main();

