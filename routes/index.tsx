import { defineRoute } from "$fresh/server.ts";
import News from "../sections/News.tsx";
import newsLoader from "../loaders/news.ts";
import type { NewsItem } from "../types/news.ts";

export default defineRoute(async (req, _ctx) => {
  let items: NewsItem[] = [];
  let error: string | undefined;

  try {
    // Usa o loader para buscar artigos do banco de dados
    items = await newsLoader({ limit: 50 }, req);
  } catch (e) {
    error = e instanceof Error ? e.message : "Error loading news";
    console.error("❌ [Route] Erro:", e);
  }

  return (
    <News
      title="📰 Deco News"
      subtitle="The latest tech news, curated especially for you"
      items={items}
      error={error}
    />
  );
});
