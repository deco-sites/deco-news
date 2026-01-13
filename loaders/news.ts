import { getDatabase } from "site/mcp/mod.ts";
import type { NewsItem } from "site/types/news.ts";

export interface Props {
  /**
   * @title Limite de itens
   * @description Número máximo de notícias para retornar
   * @default 100
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

// Tipo para conteúdo do Reddit
export interface RedditContentDB {
  id: number;
  title: string;
  url: string;
  selftext?: string;
  subreddit?: string;
  author?: string;
  score?: number;
  num_comments?: number;
  created_utc?: string;
  scraped_at?: string;
  updated_at?: string;
}

// Tipo unificado para ambas as fontes
export interface UnifiedContent {
  id: number;
  title: string;
  url: string;
  content?: string;
  source?: string;
  updated_at?: string;
  source_type: 'blog' | 'reddit';
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
  const { limit = 100 } = props;

  try {
    const db = getDatabase();
    
    // Divide o limite entre as duas fontes para garantir diversidade
    const limitPerSource = Math.ceil(limit / 2);
    
    // Busca blogs
    const blogsResult = await db.query<UnifiedContent>(`
      SELECT 
        id,
        article_title as title,
        article_url as url,
        summary as content,
        source_title as source,
        updated_at,
        'blog' as source_type
      FROM contents
      ORDER BY updated_at DESC
      LIMIT ${limitPerSource}
    `);

    // Busca Reddit
    const redditResult = await db.query<UnifiedContent>(`
      SELECT 
        id,
        title,
        url,
        selftext as content,
        COALESCE('r/' || subreddit, 'Reddit') as source,
        COALESCE(updated_at, scraped_at) as updated_at,
        'reddit' as source_type
      FROM reddit_content_scrape
      ORDER BY COALESCE(updated_at, scraped_at) DESC
      LIMIT ${limitPerSource}
    `);

    if (!blogsResult.success) {
      console.error("❌ [Loader] Erro ao buscar blogs:", blogsResult.error?.message);
    }
    
    if (!redditResult.success) {
      console.error("❌ [Loader] Erro ao buscar Reddit:", redditResult.error?.message);
    }

    // Combina os resultados
    const allItems = [
      ...(blogsResult.data ?? []),
      ...(redditResult.data ?? []),
    ];

    // Ordena todos por data
    allItems.sort((a, b) => {
      const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return dateB - dateA;
    });

    // Aplica o limite final
    const limitedItems = allItems.slice(0, limit);
    
    console.log(`📊 [Loader] Blogs: ${blogsResult.data?.length || 0}, Reddit: ${redditResult.data?.length || 0}`);
    console.log(`📦 [Loader] Total após mesclar e limitar: ${limitedItems.length}`);

    // Converte UnifiedContent para NewsItem
    const items = limitedItems.map((item): NewsItem => ({
      title: item.title,
      url: item.url,
      content: item.content,
      source: item.source,
      publishedAt: item.updated_at,
      sourceType: item.source_type,
    }));

    console.log(`✅ [Loader] ${items.length} itens carregados (blogs + Reddit)`);
    return items;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("❌ [Loader] Erro:", message);
    return [];
  }
}

export default loader;

