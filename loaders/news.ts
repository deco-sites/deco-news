import { getDatabase } from "site/mcp/mod.ts";
import type { NewsItem, NewsLoaderResult } from "site/types/news.ts";

export interface Props {
  /**
   * @title Limite de itens
   * @description Número máximo de notícias para retornar
   * @default 50
   */
  limit?: number;
}

// Tipo do artigo no banco de dados (tabela contents)
export interface ArticleDB {
  title: string;
  url: string;
  content?: string;
  source_url?: string;
  source_title?: string;
  updated_at?: string;
}

/**
 * Converte registro do banco para NewsItem
 */
export function toNewsItem(article: ArticleDB): NewsItem {
  return {
    title: article.title,
    url: article.url,
    content: article.content,
    source: article.source_title,
    publishedAt: article.updated_at,
  };
}

/**
 * @title Loader de Notícias
 * @description Carrega notícias do banco de dados (populado pelo workflow semanal)
 */
async function loader(
  props: Props,
  _req: Request,
): Promise<NewsLoaderResult> {
  const { limit = 50 } = props;

  try {
    const db = getDatabase();
    
    // Busca artigos do banco
    const result = await db.query<ArticleDB>(`
      SELECT * FROM contents 
      ORDER BY updated_at DESC
      LIMIT ${limit}
    `);

    if (!result.success) {
      console.error("❌ [Loader] Erro ao buscar artigos:", result.error?.message);
      return { items: [], error: result.error?.message };
    }

    const items = (result.data ?? []).map(toNewsItem);
    console.log(`📰 [Loader] ${items.length} artigos carregados do banco`);

    return { items };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("❌ [Loader] Erro:", message);
    return { items: [], error: message };
  }
}

export default loader;

