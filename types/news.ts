/**
 * Tipos para o sistema de notícias
 */

export interface NewsItem {
  title: string;
  description?: string;
  content?: string;
  url: string;
  image?: string;
  author?: string;
  publishedAt?: string;
  source?: string;
  category?: string;
  sourceType?: 'blog' | 'reddit';
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

