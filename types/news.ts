/**
 * Tipos para o sistema de notícias
 */

/**
 * Categorias de fontes de notícias
 * - trendsetters: Grandes empresas que definem tendências (Google, Anthropic, AWS, etc)
 * - enterprise: Fontes focadas em empresas e análises de mercado (Gartner, Forrester, IDC)
 * - mcp-startups: Startups focadas em MCP (obot, glama, lunar.dev, etc)
 * - community: Canais de comunidade e discussão (Reddit, Twitter, LinkedIn)
 * - weekly-report: Relatório semanal da Deco
 * - blog: Artigos de blogs
 */
export type SourceCategory = 'trendsetters' | 'enterprise' | 'mcp-startups' | 'community' | 'weekly-report' | 'blog';

export interface NewsItem {
  title: string;
  description?: string;
  content?: string;
  url: string;
  image?: string;
  imageAltText?: string;
  author?: string;
  authorHeadline?: string;
  authorProfileUrl?: string;
  authorProfileImage?: string;
  publishedAt?: string;
  source?: string;
  sourceTitle?: string;
  createdAt?: string;
  category?: string;
  sourceCategory?: SourceCategory;
  /**
   * Score de relevância do post (maior = mais relevante)
   */
  postScore?: number;
  /**
   * Métricas de engajamento (para posts de redes sociais)
   */
  numLikes?: number;
  numComments?: number;
  numReposts?: number;
  /**
   * Campos específicos para Weekly Reports
   */
  slug?: string;
  summary?: string;
  keyPoints?: string[];
  tags?: string[];
  keywords?: string[];
  readingTime?: number;
  isWeeklyReport?: boolean;
  /**
   * Campos de SEO
   */
  metaTitle?: string;
  metaDescription?: string;
  /**
   * Tipo de mídia do post (image, video, etc)
   */
  mediaType?: string;
}

export interface ScrapedContent {
  success: boolean;
  url: string;
  title?: string;
  content?: string;
  error?: string;
}

export interface NewsLoaderResult {
  items: NewsItem[];
  loading?: boolean;
  error?: string;
}

