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
  created_at?: string;
  scraped_at?: string;
  updated_at?: string;
}

// Tipo para conteúdo do LinkedIn
export interface LinkedInContentDB {
  id: number;
  post_id: string;
  url?: string;
  author_name?: string;
  author_headline?: string;
  author_profile_url?: string;
  author_profile_image?: string;
  content?: string;
  num_likes?: number;
  num_comments?: number;
  num_reposts?: number;
  post_type?: string;
  media_url?: string;
  published_at?: string;
  scraped_at?: string;
  post_score?: number;
  type?: string;
  created_at?: string;
  updated_at?: string;
}

// Tipo unificado para todas as fontes
export interface UnifiedContent {
  id: number;
  title: string;
  url: string;
  content?: string;
  source?: string;
  created_at?: string;
  updated_at?: string;
  week_date?: string;
  type?: string;
  post_score?: number;
  // Campos extras para LinkedIn
  author_name?: string;
  author_headline?: string;
  author_profile_url?: string;
  author_profile_image?: string;
  num_likes?: number;
  num_comments?: number;
  num_reposts?: number;
  media_url?: string;
  is_linkedin?: boolean;
  // Campos extras para Weekly Report
  is_weekly_report?: boolean;
  slug?: string;
  summary?: string;
  key_points?: string;
  tags?: string;
  reading_time?: number;
  image_url?: string;
  published_at?: string;
}

/**
 * Converte o type do banco para sourceCategory normalizado
 */
function normalizeSourceCategory(type?: string, isLinkedIn = false, isWeeklyReport = false): 'trendsetters' | 'enterprise' | 'mcp-startups' | 'community' | 'weekly-report' {
  // Weekly Reports têm categoria própria
  if (isWeeklyReport) return 'weekly-report';
  
  // Posts do LinkedIn são categorizados como 'community'
  if (isLinkedIn) return 'community';
  
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
    case 'mcp-first startups':
      return 'mcp-startups';
    case 'community':
    case 'linkedin':
      return 'community';
    default:
      // Se não reconhecer, tenta inferir ou usa default
      console.log(`⚠️ [Loader] Tipo desconhecido: "${type}", usando trendsetters como default`);
      return 'trendsetters';
  }
}

/**
 * Parseia JSON de forma segura, retornando um valor padrão em caso de erro
 */
function safeJsonParse<T>(value: string | undefined | null, defaultValue: T): T {
  if (!value) return defaultValue;
  try {
    return JSON.parse(value) as T;
  } catch {
    // Se não for JSON válido, tenta dividir por vírgula (caso seja lista simples)
    if (typeof defaultValue === "object" && Array.isArray(defaultValue)) {
      return value.split(",").map((s) => s.trim()).filter(Boolean) as T;
    }
    return defaultValue;
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
    // Se limit > 0, divide entre as fontes (blogs, reddit, linkedin)
    const hasLimit = limit > 0;
    const limitPerSource = hasLimit ? Math.ceil(limit / 3) : 999999;
    
    // Busca blogs - usa week_date para agrupar por semana, fallback para created_at
    const blogsResult = await db.query<UnifiedContent>(`
      SELECT 
        id,
        article_title as title,
        article_url as url,
        summary as content,
        source_title as source,
        updated_at,
        created_at,
        COALESCE(week_date, created_at) as week_date,
        type,
        post_score
      FROM contents
      ORDER BY COALESCE(post_score, 0) DESC, COALESCE(week_date, created_at) DESC
      ${hasLimit ? `LIMIT ${limitPerSource}` : ''}
    `);

    // Busca Reddit - usa week_date para agrupar por semana, fallback para created_at
    const redditResult = await db.query<UnifiedContent>(`
      SELECT 
        id,
        title,
        url,
        selftext as content,
        COALESCE('r/' || subreddit, 'Reddit') as source,
        COALESCE(updated_at, scraped_at) as updated_at,
        datetime(created_at, 'unixepoch') as created_at,
        COALESCE(week_date, datetime(created_at, 'unixepoch')) as week_date,
        type,
        post_score
      FROM reddit_content_scrape
      ORDER BY COALESCE(post_score, 0) DESC, COALESCE(week_date, created_at) DESC
      ${hasLimit ? `LIMIT ${limitPerSource}` : ''}
    `);

    // Busca LinkedIn - usa week_date para agrupar por semana, fallback para published_at
    const linkedinResult = await db.query<UnifiedContent>(`
      SELECT 
        id,
        COALESCE(SUBSTR(content, 1, 100) || '...', author_name || ' on LinkedIn') as title,
        url,
        content,
        'LinkedIn' as source,
        COALESCE(updated_at, scraped_at) as updated_at,
        COALESCE(published_at, created_at) as created_at,
        COALESCE(week_date, published_at) as week_date,
        type,
        post_score,
        author_name,
        author_headline,
        author_profile_url,
        author_profile_image,
        num_likes,
        num_comments,
        num_reposts,
        media_url,
        1 as is_linkedin
      FROM linkedin_content_scrape
      ORDER BY COALESCE(post_score, 0) DESC, COALESCE(week_date, published_at) DESC
      ${hasLimit ? `LIMIT ${limitPerSource}` : ''}
    `);

    // Busca Weekly Reports - usa published_at MENOS 7 dias como week_date
    // Isso porque o Weekly é publicado na semana atual mas refere-se aos acontecimentos da semana passada
    const weeklyResult = await db.query<UnifiedContent>(`
      SELECT 
        id,
        title,
        COALESCE(url, '/weekly/' || slug) as url,
        content,
        'Deco Weekly' as source,
        created_at as updated_at,
        COALESCE(published_at, created_at) as created_at,
        date(COALESCE(published_at, created_at), '-7 days') as week_date,
        'weekly-report' as type,
        1000 as post_score,
        author as author_name,
        slug,
        summary,
        key_points,
        tags,
        reading_time,
        image_url as media_url,
        published_at,
        1 as is_weekly_report
      FROM deco_weekly_report
      ORDER BY COALESCE(published_at, created_at) DESC
    `);

    if (!blogsResult.success) {
      console.error("❌ [Loader] Erro ao buscar blogs:", blogsResult.error?.message);
    }
    
    if (!redditResult.success) {
      console.error("❌ [Loader] Erro ao buscar Reddit:", redditResult.error?.message);
    }

    if (!linkedinResult.success) {
      console.error("❌ [Loader] Erro ao buscar LinkedIn:", linkedinResult.error?.message);
    }

    if (!weeklyResult.success) {
      console.error("❌ [Loader] Erro ao buscar Weekly Reports:", weeklyResult.error?.message);
    }

    // Combina os resultados
    const allItems = [
      ...(blogsResult.data ?? []),
      ...(redditResult.data ?? []),
      ...(linkedinResult.data ?? []),
      ...(weeklyResult.data ?? []),
    ];

    // Ordena todos por post_score (maior primeiro), depois por week_date como desempate
    allItems.sort((a, b) => {
      const scoreA = a.post_score ?? 0;
      const scoreB = b.post_score ?? 0;
      
      // Primeiro compara por score (maior = mais relevante)
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      
      // Se scores iguais, desempata por week_date (mais recente primeiro)
      const dateA = a.week_date ? new Date(a.week_date).getTime() : 0;
      const dateB = b.week_date ? new Date(b.week_date).getTime() : 0;
      return dateB - dateA;
    });

    // Aplica o limite final (se houver)
    const limitedItems = hasLimit ? allItems.slice(0, limit) : allItems;
    
    console.log(`📊 [Loader] Blogs: ${blogsResult.data?.length || 0}, Reddit: ${redditResult.data?.length || 0}, LinkedIn: ${linkedinResult.data?.length || 0}, Weekly: ${weeklyResult.data?.length || 0}`);
    console.log(`📦 [Loader] Total após mesclar e limitar: ${limitedItems.length}`);

    // Converte UnifiedContent para NewsItem
    // publishedAt usa week_date para agrupamento semanal correto
    const items = limitedItems.map((item): NewsItem => ({
      title: item.title,
      url: item.url,
      content: item.content,
      source: item.source,
      publishedAt: item.week_date || item.updated_at,
      createdAt: item.created_at,
      sourceCategory: normalizeSourceCategory(item.type, !!item.is_linkedin, !!item.is_weekly_report),
      postScore: item.post_score,
      // Campos extras para LinkedIn
      author: item.author_name,
      authorHeadline: item.author_headline,
      authorProfileUrl: item.author_profile_url,
      authorProfileImage: item.author_profile_image,
      numLikes: item.num_likes,
      numComments: item.num_comments,
      numReposts: item.num_reposts,
      image: item.media_url,
      // Campos extras para Weekly Report
      isWeeklyReport: !!item.is_weekly_report,
      slug: item.slug,
      summary: item.summary,
      keyPoints: safeJsonParse<string[]>(item.key_points, []),
      tags: safeJsonParse<string[]>(item.tags, []),
      readingTime: item.reading_time,
    }));

    console.log(`✅ [Loader] ${items.length} itens carregados (blogs + Reddit + LinkedIn)`);
    return items;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("❌ [Loader] Erro:", message);
    return [];
  }
}

export default loader;

