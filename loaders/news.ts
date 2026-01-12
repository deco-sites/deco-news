import { getDatabase } from "site/mcp/mod.ts";
import type { NewsItem } from "site/types/news.ts";

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
  id: number;
  article_title: string;
  article_url: string;
  summary?: string;
  key_points?: string;
  source_url?: string;
  source_title?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Converte registro do banco para NewsItem
 */
export function toNewsItem(article: ArticleDB): NewsItem {
  return {
    title: article.article_title,
    url: article.article_url,
    content: article.summary,
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
): Promise<NewsItem[]> {
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
      return [];
    }

    const items = (result.data ?? []).map(toNewsItem);

    return items;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("❌ [Loader] Erro:", message);
    return [];
  }
}

export default loader;

