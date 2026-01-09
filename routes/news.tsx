import { defineRoute } from "$fresh/server.ts";
import News from "../sections/News.tsx";
import { getDatabase } from "../mcp/database.ts";
import { toNewsItem } from "../loaders/news.ts";
import type { ArticleDB } from "../loaders/news.ts";
import type { NewsItem } from "../types/news.ts";

/**
 * Busca artigos do banco de dados (populado pelo workflow semanal)
 */
async function fetchContentsFromDB(limit: number = 50): Promise<NewsItem[]> {
  console.log("🔍 [Route] Buscando artigos do banco...");
  
  try {
    const db = getDatabase();
    
    const result = await db.query<ArticleDB>(`
      SELECT * FROM contents
      ORDER BY updated_at DESC
      LIMIT ${limit}
    `);
    
    // Verifica se a query foi bem sucedida e se data é um array
    if (result.success && Array.isArray(result.data)) {
      console.log(`📰 [Route] ${result.data.length} artigos carregados do banco`);
      return result.data.map(toNewsItem);
    } else {
      console.warn("⚠️ [Route] Query retornou sem dados:", result.error?.message);
    }
  } catch (e) {
    console.error("❌ [Route] Erro ao buscar artigos:", e);
  }
  return [];
}

export default defineRoute(async (_req, _ctx) => {
  let items: NewsItem[] = [];
  let error: string | undefined;

  try {
    // Busca artigos do banco de dados (populado pelo workflow)
    items = await fetchContentsFromDB(50);
  } catch (e) {
    error = e instanceof Error ? e.message : "Erro ao carregar notícias";
    console.error("❌ [Route] Erro:", e);
  }

  return (
    <News
      title="📰 Deco News"
      subtitle="As últimas notícias do mundo tech, curadas especialmente para você"
      items={items}
      error={error}
    />
  );
});
