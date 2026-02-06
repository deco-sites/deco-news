import { getDatabase } from "site/mcp/mod.ts";
import type { NewsItem, SourceCategory } from "site/types/news.ts";

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
  post_type?: string;
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
 * Usa o type real do banco de dados sem inventar categorias
 * 
 * Tipos das tabelas sources:
 * - blog_sources: Enterprise, MCP-First Startups, Trendsetter, Community
 * - reddit_sources: MCP-First Startups, Enterprise, Trendsetter, Community
 * - linkedin_sources: MCP-First Startups, Enterprise, Trendsetter, Community
 */
function normalizeSourceCategory(type?: string | null, isWeeklyReport = false): SourceCategory | undefined {
  // Weekly Reports têm categoria própria
  if (isWeeklyReport) return 'weekly-report';
  
  // Se não tem type, retorna undefined (não inventa categoria)
  if (!type) return undefined;
  
  const normalized = type.toLowerCase().trim();
  
  // Mapeia os valores do banco para os valores esperados
  switch (normalized) {
    // Trendsetters (singular e plural)
    case 'trendsetter':
    case 'trendsetters':
      return 'trendsetters';
    // Enterprise
    case 'enterprise':
      return 'enterprise';
    // MCP Startups (várias variações)
    case 'mcp-startups':
    case 'mcp startups':
    case 'mcpstartups':
    case 'mcp-first startups':
      return 'mcp-startups';
    // Community
    case 'community':
      return 'community';
    // Blog
    case 'blog':
      return 'blog';
    // Weekly Report
    case 'weekly-report':
      return 'weekly-report';
    default:
      // Se não reconhecer, loga para debug e retorna undefined
      console.log(`⚠️ [Loader] Tipo não mapeado: "${type}"`);
      return undefined;
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
    
    // Se limit for 0, busca TODOS os itens (sem limite)
    const hasLimit = limit > 0;
    
    // Busca blogs com JOIN na tabela blog_sources para pegar o type
    // O JOIN é feito verificando se o domínio do article_url contém o domínio do source
    const blogsResult = await db.query<UnifiedContent>(`
      SELECT 
        c.id,
        c.article_title as title,
        c.article_url as url,
        c.summary as content,
        COALESCE(bs.name, 'Blog') as source,
        c.updated_at,
        COALESCE(c.published_at, c.created_at) as created_at,
        COALESCE(c.publication_week, c.published_at, c.created_at) as week_date,
        COALESCE(bs.type, 'blog') as type,
        COALESCE(c.post_score, bs.authority) as post_score,
        c.published_at
      FROM contents c
      LEFT JOIN blog_sources bs ON 
        INSTR(c.article_url, REPLACE(REPLACE(bs.url, 'https://', ''), 'http://', '')) > 0
      ORDER BY COALESCE(c.post_score, bs.authority, 0) DESC, COALESCE(c.publication_week, c.published_at, c.created_at) DESC
    `);

    // Busca Reddit com JOIN na tabela reddit_sources para pegar o type
    const redditResult = await db.query<UnifiedContent>(`
      SELECT 
        r.id,
        r.title,
        r.url,
        r.selftext as content,
        COALESCE(rs.name, 'r/' || r.subreddit, 'Reddit') as source,
        COALESCE(r.updated_at, r.scraped_at) as updated_at,
        datetime(r.created_at, 'unixepoch') as created_at,
        COALESCE(r.week_date, datetime(r.created_at, 'unixepoch')) as week_date,
        COALESCE(rs.type, r.type) as type,
        COALESCE(r.post_score, rs.authority) as post_score
      FROM reddit_content_scrape r
      LEFT JOIN reddit_sources rs ON r.subreddit = rs.subreddit
      ORDER BY COALESCE(r.post_score, rs.authority, 0) DESC, COALESCE(r.week_date, r.created_at) DESC
    `);

    // Busca LinkedIn com JOIN na tabela linkedin_sources para pegar o type
    const linkedinResult = await db.query<UnifiedContent>(`
      SELECT 
        l.id,
        COALESCE(SUBSTR(l.content, 1, 100) || '...', l.author_name || ' on LinkedIn') as title,
        l.url,
        l.content,
        COALESCE(ls.name, 'LinkedIn') as source,
        COALESCE(l.updated_at, l.scraped_at) as updated_at,
        COALESCE(l.published_at, l.created_at) as created_at,
        COALESCE(l.week_date, l.published_at) as week_date,
        COALESCE(ls.type, l.type) as type,
        COALESCE(l.post_score, ls.authority) as post_score,
        l.author_name,
        l.author_headline,
        l.author_profile_url,
        l.author_profile_image,
        l.num_likes,
        l.num_comments,
        l.num_reposts,
        l.media_url,
        l.post_type,
        1 as is_linkedin
      FROM linkedin_content_scrape l
      LEFT JOIN linkedin_sources ls ON l.author_profile_url = ls.profile_url
      ORDER BY COALESCE(l.post_score, ls.authority, 0) DESC, COALESCE(l.week_date, l.published_at) DESC
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
      sourceCategory: normalizeSourceCategory(item.type, !!item.is_weekly_report),
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
      mediaType: item.post_type,
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

