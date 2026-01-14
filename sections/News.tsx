import type { NewsItem } from "site/types/news.ts";
import FilterTabs from "site/islands/FilterTabs.tsx";

/**
 * Retorna o início da semana (segunda-feira) para uma data
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Formata o intervalo da semana para exibição
 */
function formatWeekRange(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
  };

  const startStr = weekStart.toLocaleDateString("en-US", options);
  const endStr = weekEnd.toLocaleDateString("en-US", {
    ...options,
    year: "numeric",
  });

  return `${startStr} - ${endStr}`;
}

/**
 * Agrupa notícias por semana
 */
function groupByWeek(items: NewsItem[]): Map<string, { label: string; items: NewsItem[] }> {
  const groups = new Map<string, { label: string; items: NewsItem[] }>();

  const sortedItems = [...items].sort((a, b) => {
    const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return dateB - dateA;
  });

  for (const item of sortedItems) {
    let weekKey: string;
    let weekLabel: string;

    if (item.publishedAt) {
      const date = new Date(item.publishedAt);
      if (!isNaN(date.getTime())) {
        const weekStart = getWeekStart(date);
        weekKey = weekStart.toISOString().split("T")[0];

        const now = new Date();
        const thisWeekStart = getWeekStart(now);
        const lastWeekStart = new Date(thisWeekStart);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);

        if (weekStart.getTime() === thisWeekStart.getTime()) {
          weekLabel = "This week";
        } else if (weekStart.getTime() === lastWeekStart.getTime()) {
          weekLabel = "Last week";
        } else {
          weekLabel = formatWeekRange(weekStart);
        }
      } else {
        weekKey = "no-date";
        weekLabel = "No date";
      }
    } else {
      weekKey = "no-date";
      weekLabel = "No date";
    }

    if (!groups.has(weekKey)) {
      groups.set(weekKey, { label: weekLabel, items: [] });
    }
    groups.get(weekKey)!.items.push(item);
  }

  return groups;
}

export interface Props {
  /**
   * @title Título da seção
   * @default Deco News
   */
  title?: string;
  /**
   * @title Subtítulo
   * @description Descrição curta abaixo do título
   */
  subtitle?: string;
  /**
   * @title Notícias
   * @description Lista de notícias para exibir
   */
  items?: NewsItem[];
  /**
   * @title Carregando
   * @hide
   */
  loading?: boolean;
  /**
   * @title Mensagem de erro
   * @hide
   */
  error?: string;
}

/**
 * Card especial para artigos da Deco (resumos semanais)
 */
function DecoArticleCard({ item }: { item: NewsItem }) {
  return (
    <article class="group col-span-full bg-white rounded-3xl overflow-hidden border border-neutral-200/60 transition-all duration-500 hover:shadow-2xl hover:border-lime-400/50">
      <div class="p-8 md:p-12">
        {/* Badge */}
        <div class="flex items-center gap-3 mb-8">
          <div class="flex items-center gap-2 px-4 py-2 bg-lime-400/20 rounded-full">
            <div class="w-6 h-6 rounded-full bg-lime-500 flex items-center justify-center">
              <span class="text-white font-bold text-xs">D</span>
            </div>
            <span class="text-forest-700 text-sm font-bold">Deco</span>
          </div>
          {item.category && (
            <span class="px-3 py-1 text-xs font-bold bg-neutral-100 text-neutral-600 rounded-full uppercase tracking-wider">
              {item.category}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 class="text-3xl md:text-4xl font-bold text-neutral-900 leading-tight mb-6">
          {item.title}
        </h3>

        {/* Description */}
        {item.description && (
          <p class="text-lg text-neutral-600 mb-6 leading-relaxed max-w-3xl">{item.description}</p>
        )}

        {/* Content preview */}
        {item.content && (
          <div class="mb-8">
            <p class="text-neutral-500 line-clamp-4 leading-relaxed">{item.content.slice(0, 400)}...</p>
          </div>
        )}

        {/* Footer */}
        <div class="flex flex-wrap items-center justify-between gap-4 pt-8 border-t border-neutral-100">
          <div class="flex items-center gap-3">
            <span class="text-sm text-lime-600 font-semibold">By {item.author}</span>
            {item.publishedAt && (
              <>
                <span class="text-neutral-300">•</span>
                <time class="text-sm text-neutral-500">
                  {new Date(item.publishedAt).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
              </>
            )}
          </div>
          <button type="button" class="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white font-semibold rounded-xl hover:bg-neutral-800 transition-all group-hover:shadow-lg">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Read full summary
          </button>
        </div>
      </div>
    </article>
  );
}

/**
 * Limpa markdown e caracteres estranhos do conteúdo
 */
function cleanContent(content: string): string {
  return content
    // Remove imagens markdown
    .replace(/!\[.*?\]\(.*?\)/g, '')
    // Remove links markdown vazios []()
    .replace(/\[\]\([^)]*\)/g, '')
    // Remove links markdown, mantendo o texto
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove URLs soltas
    .replace(/https?:\/\/[^\s]+/g, '')
    // Remove asteriscos de bold/italic
    .replace(/\*+/g, '')
    // Remove underscores de bold/italic
    .replace(/_+/g, ' ')
    // Remove headers markdown (#)
    .replace(/^#+\s*/gm, '')
    // Remove pipes de tabelas
    .replace(/\|/g, '')
    // Remove backslashes
    .replace(/\\/g, '')
    // Remove múltiplos espaços
    .replace(/\s+/g, ' ')
    // Remove linhas em branco múltiplas
    .replace(/\n\s*\n/g, '\n')
    // Remove texto comum de navegação/CTA
    .replace(/Login|Sign Up|Book Demo|No items found\.|SHARE|Read more/gi, '')
    .trim();
}

/**
 * Card padrão para notícias normais
 */
function NewsCard({ item }: { item: NewsItem }) {
  if (item.author === "Deco") {
    return <DecoArticleCard item={item} />;
  }

  const cleanDescription = item.description ? cleanContent(item.description) : '';
  const cleanContentText = item.content ? cleanContent(item.content) : '';
  const displayText = cleanDescription || cleanContentText;
  const category = item.sourceCategory || 'trendsetters';

  return (
    <div class="news-card-wrapper" data-category={category}>
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        class="group news-card flex flex-col h-full cursor-pointer"
      >
      {item.image && (
        <div class="aspect-[16/10] overflow-hidden bg-neutral-100">
          <img
            src={item.image}
            alt={item.title}
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>
      )}
      <div class="flex flex-col flex-1 p-6">
        <div class="flex items-center gap-2 mb-4">
          {/* Badge da categoria */}
          {item.sourceCategory === 'trendsetters' && (
            <span class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-purple-500/10 text-purple-600 rounded-full border border-purple-200">
              <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              Trendsetters
            </span>
          )}
          {item.sourceCategory === 'enterprise' && (
            <span class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-blue-500/10 text-blue-600 rounded-full border border-blue-200">
              <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd"/>
              </svg>
              Enterprise
            </span>
          )}
          {item.sourceCategory === 'mcp-startups' && (
            <span class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-emerald-500/10 text-emerald-600 rounded-full border border-emerald-200">
              <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/>
              </svg>
              MCP Startups
            </span>
          )}
          {item.sourceCategory === 'community' && (
            <span class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-orange-500/10 text-orange-600 rounded-full border border-orange-200">
              <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
              </svg>
              Community
            </span>
          )}
          {item.category && (
            <span class="inline-block self-start px-3 py-1 text-xs font-bold bg-lime-400/20 text-forest-700 rounded-full uppercase tracking-wider">
              {item.category}
            </span>
          )}
        </div>
        <h3 class="text-xl font-bold text-neutral-900 leading-snug group-hover:text-lime-600 transition-colors line-clamp-2 mb-3">
          {item.title}
        </h3>
        {displayText && (
          <p class="text-neutral-500 text-sm line-clamp-3 mb-4 flex-1">{displayText}</p>
        )}
        <div class="flex items-center justify-between pt-4 border-t border-neutral-100 mt-auto">
          <div class="flex items-center gap-2 text-xs text-neutral-400">
            {item.source && <span class="font-medium">{item.source}</span>}
            {item.publishedAt && (
              <>
                {item.source && <span>•</span>}
                <time>{new Date(item.publishedAt).toLocaleDateString("en-US", { day: "numeric", month: "short" })}</time>
              </>
            )}
          </div>
          <div
            class="inline-flex items-center gap-1 text-lime-600 text-sm font-semibold hover:text-lime-700 transition-colors"
          >
            Read more
            <svg
              class="w-4 h-4 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </div>
        </div>
      </div>
    </a>
    </div>
  );
}

function EmptyState() {
  return (
    <div class="flex flex-col items-center justify-center py-24 text-center">
      <div class="w-24 h-24 mb-8 rounded-2xl bg-neutral-100 flex items-center justify-center">
        <svg
          class="w-12 h-12 text-neutral-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
          />
        </svg>
      </div>
      <h3 class="text-2xl font-bold text-neutral-900 mb-3">
        No news found
      </h3>
      <p class="text-neutral-500 max-w-md">
        Configure URLs in the loader or add news manually to get started.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          class="bg-white rounded-2xl overflow-hidden border border-neutral-200/60 animate-pulse"
        >
          <div class="aspect-[16/10] bg-neutral-100" />
          <div class="p-6 space-y-4">
            <div class="h-3 bg-neutral-100 rounded w-20" />
            <div class="h-6 bg-neutral-100 rounded w-full" />
            <div class="h-4 bg-neutral-100 rounded w-3/4" />
            <div class="h-4 bg-neutral-100 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Loading fallback para Async Rendering do deco.cx
 */
export function LoadingFallback() {
  return (
    <div class="min-h-screen bg-[#F5F5F0]">
      {/* Header Skeleton */}
      <header class="sticky top-0 z-50 bg-[#F5F5F0]/80 backdrop-blur-xl border-b border-neutral-200/50">
        <div class="container mx-auto max-w-7xl px-6">
          <div class="flex items-center justify-between h-16">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-lime-500 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-lg">D</span>
              </div>
              <span class="font-bold text-neutral-900 text-lg">News</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Skeleton */}
      <section class="pt-6 pb-12 md:pt-8 md:pb-16 px-6">
        <div class="container mx-auto max-w-7xl">
          <div class="max-w-5xl animate-pulse">
            <div class="h-8 w-48 bg-neutral-200 rounded-full mb-8" />
            <div class="h-16 md:h-24 w-full bg-neutral-200 rounded-2xl mb-4" />
            <div class="h-16 md:h-24 w-3/4 bg-neutral-200 rounded-2xl mb-8" />
            <div class="flex gap-3">
              <div class="h-10 w-32 bg-neutral-200 rounded-full" />
              <div class="h-10 w-40 bg-neutral-200 rounded-full" />
              <div class="h-10 w-36 bg-neutral-200 rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Content Skeleton */}
      <section class="pb-24 px-6">
        <div class="container mx-auto max-w-7xl">
          <LoadingState />
        </div>
      </section>
    </div>
  );
}

export default function News({
  title: _title = "Deco News",
  subtitle,
  items = [],
  loading = false,
  error,
}: Props) {

  // Contadores para passar para a island de filtro
  const counts = {
    all: items.length,
    trendsetters: items.filter(i => i.sourceCategory === 'trendsetters').length,
    enterprise: items.filter(i => i.sourceCategory === 'enterprise').length,
    "mcp-startups": items.filter(i => i.sourceCategory === 'mcp-startups').length,
    community: items.filter(i => i.sourceCategory === 'community').length,
  };

  return (
    <div class="min-h-screen bg-[#F5F5F0]">
      {/* Header */}
      <header class="sticky top-0 z-50 bg-[#F5F5F0]/80 backdrop-blur-xl border-b border-neutral-200/50">
        <div class="container mx-auto max-w-7xl px-6">
          <div class="flex items-center justify-between h-16">
            {/* Logo */}
            <a href="/" class="flex items-center gap-2">
              <div class="w-8 h-8 bg-lime-500 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-lg">D</span>
              </div>
              <span class="font-bold text-neutral-900 text-lg">News</span>
            </a>

            {/* Nav */}
            

            {/* Actions */}
            <div class="flex items-center gap-3">
              <a
                href="https://decocms.com"
                target="_blank"
                class="hidden sm:inline-flex items-center px-4 py-2 bg-neutral-900 text-white text-sm font-semibold rounded-xl hover:bg-neutral-800 transition-colors"
              >
                decocms
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section class="pt-6 pb-12 md:pt-8 md:pb-16 px-6">
        <div class="container mx-auto max-w-7xl">
          <div class="max-w-5xl">
            {/* Pill */}
            <div class="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm font-medium border border-neutral-200/50 shadow-sm mb-8">
              <span class="w-2 h-2 bg-lime-500 rounded-full animate-pulse"></span>
              <span class="text-neutral-600">Automatically updated</span>
            </div>

            {/* Title - estilo Deco com palavras coloridas */}
            <h1 class="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95] mb-8">
              <span class="text-lime-500">Tech</span>
              <span class="text-neutral-900"> news, </span>
              <span class="text-lime-500">curated</span>
              <span class="text-neutral-900"> and </span>
              <span class="text-lime-500">summarized</span>
              <span class="text-neutral-900"> — straight to your feed.</span>
            </h1>

            {/* Subtitle */}
            {subtitle && (
              <p class="text-xl md:text-2xl text-neutral-500 max-w-3xl leading-relaxed">
                {subtitle}
              </p>
            )}

            {/* Features */}
            <div class="flex flex-wrap gap-3 mt-10">
              <span class="pill-lime">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                AI Curation
              </span>
              <span class="pill-lime">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                Weekly Summaries
              </span>
              <span class="pill-lime">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                Trusted Sources
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section class="pb-24 px-6">
        <div class="container mx-auto max-w-7xl">
          {/* Filter Tabs - Island interativa */}
          {!loading && items.length > 0 && (
            <div class="mb-12">
              <FilterTabs counts={counts} />
            </div>
          )}

          {/* CSS para controlar visibilidade dos cards baseado no filtro */}
          <style dangerouslySetInnerHTML={{ __html: `
            /* Por padrão (filter-all), mostra todos */
            #news-grid-container .news-card-wrapper {
              display: block;
            }
            
            /* Quando filtro específico é aplicado, esconde todos e mostra só os que batem */
            #news-grid-container.filter-trendsetters .news-card-wrapper:not([data-category="trendsetters"]) {
              display: none;
            }
            #news-grid-container.filter-enterprise .news-card-wrapper:not([data-category="enterprise"]) {
              display: none;
            }
            #news-grid-container.filter-mcp-startups .news-card-wrapper:not([data-category="mcp-startups"]) {
              display: none;
            }
            #news-grid-container.filter-community .news-card-wrapper:not([data-category="community"]) {
              display: none;
            }
          `}} />

          {/* Error State */}
          {error && (
            <div class="mb-8 p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700">
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
                <p class="font-medium">Error loading news: {error}</p>
              </div>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <LoadingState />
          ) : items.length === 0 ? (
            <EmptyState />
          ) : (
            <div id="news-grid-container" class="space-y-16 filter-all">
              {Array.from(groupByWeek(items)).map(([weekKey, { label, items: weekItems }]) => (
                <div key={weekKey} class="space-y-8 week-section">
                  {/* Week Header */}
                  <div class="flex items-center gap-6">
                    <div class="flex items-center gap-4">
                      <div class="w-3 h-3 bg-lime-500 rounded-full" />
                      <h2 class="text-3xl font-bold text-neutral-900">{label}</h2>
                    </div>
                    <div class="flex-1 h-px bg-gradient-to-r from-neutral-200 to-transparent" />
                    <span class="text-sm text-neutral-400 bg-white px-4 py-2 rounded-full border border-neutral-200/50">
                      {weekItems.length} {weekItems.length === 1 ? "article" : "articles"}
                    </span>
                  </div>

                  {/* Week Items */}
                  <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {weekItems.map((item, index) => (
                      <NewsCard key={`${item.url}-${index}`} item={item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer class="border-t border-neutral-200/50 bg-white/50 backdrop-blur-sm">
        <div class="container mx-auto max-w-7xl px-6 py-8">
          <div class="flex flex-col md:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-2">
              <span class="text-sm text-neutral-500">Made with</span>
              <a href="https://decocms.com" target="_blank" class="flex items-center gap-1 text-sm font-semibold text-neutral-900 hover:text-lime-600 transition-colors">
                <div class="w-5 h-5 bg-lime-500 rounded flex items-center justify-center">
                  <span class="text-white font-bold text-xs">D</span>
                </div>
                decocms
              </a>
            </div>
            <div class="flex items-center gap-6 text-sm text-neutral-500">
              <a href="https://github.com/deco-cx" target="_blank" class="hover:text-neutral-900 transition-colors">GitHub</a>
              <a href="https://discord.gg/deco" target="_blank" class="hover:text-neutral-900 transition-colors">Discord</a>
              <a href="https://decocms.com/docs" target="_blank" class="hover:text-neutral-900 transition-colors">Docs</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
