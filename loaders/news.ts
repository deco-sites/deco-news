import { getDatabase } from "site/mcp/mod.ts";
import type { NewsItem } from "site/types/news.ts";

export interface Props {
  /**
   * @title Limite de itens
   * @description Número máximo de notícias para retornar (0 = sem limite)
   * @default 0
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
  type?: string;
  post_score?: number;
}

/**
 * Converte o type do banco para sourceCategory normalizado
 */
function normalizeSourceCategory(type?: string): 'trendsetters' | 'enterprise' | 'mcp-startups' | 'community' {
  if (!type) return 'trendsetters';
  
  const normalized = type.toLowerCase().trim();
  
  // Mapeia os valores do banco para os valores esperados
  switch (normalized) {
    case 'trendsetters':
      return 'trendsetters';
    case 'enterprise':
      return 'enterprise';
    case 'mcp-startups':
    case 'mcp startups':
    case 'mcpstartups':
      return 'mcp-startups';
    case 'community':
      return 'community';
    default:
      // Se não reconhecer, tenta inferir ou usa default
      console.log(`⚠️ [Loader] Tipo desconhecido: "${type}", usando trendsetters como default`);
      return 'trendsetters';
  }
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
  const { limit = 0 } = props;

  try {
    const db = getDatabase();
    
    // Se limit for 0, busca TODOS os itens
    // Se limit > 0, divide entre as fontes
    const hasLimit = limit > 0;
    const limitPerSource = hasLimit ? Math.ceil(limit / 2) : 999999;
    
    // Busca blogs - usa source_category do banco ou default 'trendsetters'
    const blogsResult = await db.query<UnifiedContent>(`
      SELECT 
        id,
        article_title as title,
        article_url as url,
        summary as content,
        source_title as source,
        updated_at,
        type,
        post_score
      FROM contents
      ORDER BY COALESCE(post_score, 0) DESC, updated_at DESC
      ${hasLimit ? `LIMIT ${limitPerSource}` : ''}
    `);

    // Busca Reddit - usa source_category do banco ou default 'community'
    const redditResult = await db.query<UnifiedContent>(`
      SELECT 
        id,
        title,
        url,
        selftext as content,
        COALESCE('r/' || subreddit, 'Reddit') as source,
        COALESCE(updated_at, scraped_at) as updated_at,
        type,
        post_score
      FROM reddit_content_scrape
      ORDER BY COALESCE(post_score, 0) DESC, COALESCE(updated_at, scraped_at) DESC
      ${hasLimit ? `LIMIT ${limitPerSource}` : ''}
    `);

    if (!blogsResult.success) {
      console.error("❌ [Loader] Erro ao buscar blogs:", blogsResult.error?.message);
    }
    
    if (!redditResult.success) {
      console.error("❌ [Loader] Erro ao buscar Reddit:", redditResult.error?.message);
    } else {
      // Log detalhado dos dados do Reddit
      console.log("🔍 [Loader] === DADOS DO REDDIT ===");
      console.log(`🔢 [Loader] Total de posts: ${redditResult.data?.length || 0}`);
      redditResult.data?.forEach((item) => {
        console.log(`${JSON.stringify(item, null, 2)}`);
      });
      console.log("🔍 [Loader] === FIM DADOS REDDIT ===\n");
    }

    // Combina os resultados
    const allItems = [
      ...(blogsResult.data ?? []),
      ...(redditResult.data ?? []),
    ];

    // Ordena todos por post_score (maior primeiro), depois por data como desempate
    allItems.sort((a, b) => {
      const scoreA = a.post_score ?? 0;
      const scoreB = b.post_score ?? 0;
      
      // Primeiro compara por score (maior = mais relevante)
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      
      // Se scores iguais, desempata por data (mais recente primeiro)
      const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return dateB - dateA;
    });

    // Aplica o limite final (se houver)
    const limitedItems = hasLimit ? allItems.slice(0, limit) : allItems;
    
    console.log(`📊 [Loader] Blogs: ${blogsResult.data?.length || 0}, Reddit: ${redditResult.data?.length || 0}`);
    console.log(`📦 [Loader] Total após mesclar e limitar: ${limitedItems.length}`);

    // Converte UnifiedContent para NewsItem
    const items = limitedItems.map((item): NewsItem => ({
      title: item.title,
      url: item.url,
      content: item.content,
      source: item.source,
      publishedAt: item.updated_at,
      sourceCategory: normalizeSourceCategory(item.type),
      postScore: item.post_score,
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

