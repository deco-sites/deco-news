import { getDatabase } from "site/mcp/mod.ts";
import type { NewsItem } from "site/types/news.ts";

export interface Props {
  /**
   * @title Slug do artigo
   * @description Identificador único do artigo na URL
   */
  slug: string;
}

/**
 * Tipo do artigo Weekly Report no banco de dados
 */
export interface WeeklyReportDB {
  id: number;
  title: string;
  slug: string;
  content: string;
  summary?: string;
  key_points?: string;
  tags?: string;
  author?: string;
  reading_time?: number;
  featured_image?: string;
  published_at?: string;
  created_at?: string;
  url?: string;
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
 * @title Loader de Artigo Weekly
 * @description Carrega um artigo weekly específico pelo slug
 */
async function loader(
  props: Props,
  _req: Request,
): Promise<NewsItem | null> {
  const { slug } = props;

  if (!slug) {
    console.error("❌ [WeeklyLoader] Slug não fornecido");
    return null;
  }

  try {
    const db = getDatabase();
    
    // Escapa aspas simples para evitar SQL injection
    const safeSlug = slug.replace(/'/g, "''");
    
    const result = await db.query<WeeklyReportDB>(`
      SELECT 
        id,
        title,
        slug,
        content,
        summary,
        key_points,
        tags,
        author,
        reading_time,
        featured_image,
        published_at,
        created_at,
        url
      FROM deco_weekly_report
      WHERE slug = '${safeSlug}'
      LIMIT 1
    `);

    if (!result.success || !result.data || result.data.length === 0) {
      console.error("❌ [WeeklyLoader] Artigo não encontrado:", slug);
      if (result.error) {
        console.error("❌ [WeeklyLoader] Erro:", result.error.message);
      }
      return null;
    }

    const article = result.data[0];
    
    console.log(`✅ [WeeklyLoader] Artigo encontrado: ${article.title}`);

    return {
      title: article.title,
      url: article.url || `/weekly/${article.slug}`,
      content: article.content,
      summary: article.summary,
      keyPoints: safeJsonParse<string[]>(article.key_points, []),
      tags: safeJsonParse<string[]>(article.tags, []),
      author: article.author,
      readingTime: article.reading_time,
      image: article.featured_image,
      publishedAt: article.published_at,
      createdAt: article.created_at,
      slug: article.slug,
      isWeeklyReport: true,
      sourceCategory: 'weekly-report',
      source: 'Deco Weekly',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("❌ [WeeklyLoader] Erro:", message);
    return null;
  }
}

export default loader;

