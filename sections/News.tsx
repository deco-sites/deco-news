import type { NewsItem } from "site/types/news.ts";

/**
 * Retorna o início da semana (segunda-feira) para uma data
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajusta para segunda-feira
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

  const startStr = weekStart.toLocaleDateString("pt-BR", options);
  const endStr = weekEnd.toLocaleDateString("pt-BR", {
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

  // Ordena por data (mais recente primeiro)
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
        
        // Verifica se é esta semana, semana passada, ou outra
        const now = new Date();
        const thisWeekStart = getWeekStart(now);
        const lastWeekStart = new Date(thisWeekStart);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);

        if (weekStart.getTime() === thisWeekStart.getTime()) {
          weekLabel = "Esta semana";
        } else if (weekStart.getTime() === lastWeekStart.getTime()) {
          weekLabel = "Semana passada";
        } else {
          weekLabel = formatWeekRange(weekStart);
        }
      } else {
        weekKey = "sem-data";
        weekLabel = "Sem data";
      }
    } else {
      weekKey = "sem-data";
      weekLabel = "Sem data";
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
   * @default Últimas Notícias
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
    <article class="group relative col-span-full bg-gradient-to-br from-emerald-950/80 via-slate-900 to-cyan-950/80 rounded-3xl overflow-hidden border-2 border-emerald-500/30 hover:border-emerald-400/60 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/20">
      {/* Decorative glow */}
      <div class="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-emerald-500/10 rounded-3xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
      
      <div class="relative p-8 md:p-10">
        {/* Badge */}
        <div class="flex items-center gap-3 mb-6">
          <div class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-full border border-emerald-500/30">
            <div class="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
              <span class="text-white font-bold text-xs">D</span>
            </div>
            <span class="text-emerald-300 text-sm font-semibold">Deco</span>
          </div>
          {item.category && (
            <span class="px-3 py-1 text-xs font-semibold bg-cyan-500/20 text-cyan-400 rounded-full uppercase tracking-wider">
              {item.category}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 class="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-white to-cyan-300 leading-tight mb-4">
          {item.title}
        </h3>

        {/* Description */}
        {item.description && (
          <p class="text-lg text-slate-300 mb-6 leading-relaxed">{item.description}</p>
        )}

        {/* Content preview */}
        {item.content && (
          <div class="prose prose-invert prose-emerald max-w-none mb-6">
            <p class="text-slate-400 line-clamp-4">{item.content.slice(0, 400)}...</p>
          </div>
        )}

        {/* Footer */}
        <div class="flex items-center justify-between pt-6 border-t border-emerald-500/20">
          <div class="flex items-center gap-3">
            <span class="text-sm text-emerald-400 font-medium">Por {item.author}</span>
            {item.publishedAt && (
              <>
                <span class="text-emerald-600">•</span>
                <time class="text-sm text-slate-400">
                  {new Date(item.publishedAt).toLocaleDateString("pt-BR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
              </>
            )}
          </div>
          <span class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-all">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Ler resumo completo
          </span>
        </div>
      </div>
    </article>
  );
}

/**
 * Card padrão para notícias normais
 */
function NewsCard({ item }: { item: NewsItem }) {
  // Se for artigo da Deco, usa o card especial
  if (item.author === "Deco") {
    return <DecoArticleCard item={item} />;
  }

  return (
    <article class="group relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl overflow-hidden border border-slate-700/50 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10">
      {item.image && (
        <div class="aspect-video overflow-hidden">
          <img
            src={item.image}
            alt={item.title}
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>
      )}
      <div class="p-6 space-y-4">
        {item.category && (
          <span class="inline-block px-3 py-1 text-xs font-semibold bg-emerald-500/20 text-emerald-400 rounded-full uppercase tracking-wider">
            {item.category}
          </span>
        )}
        <h3 class="text-xl font-bold text-white leading-tight group-hover:text-emerald-400 transition-colors line-clamp-2">
          {item.title}
        </h3>
        {item.description && (
          <p class="text-slate-400 text-sm line-clamp-3">{item.description}</p>
        )}
        {item.content && !item.description && (
          <p class="text-slate-400 text-sm line-clamp-3">{item.content}</p>
        )}
        <div class="flex items-center justify-between pt-4 border-t border-slate-700/50">
          <div class="flex items-center gap-2">
            {item.source && (
              <span class="text-xs text-slate-500">{item.source}</span>
            )}
            {item.publishedAt && (
              <>
                <span class="text-slate-600">•</span>
                <time class="text-xs text-slate-500">{item.publishedAt}</time>
              </>
            )}
          </div>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 text-emerald-400 text-sm font-medium hover:text-emerald-300 transition-colors"
          >
            Ler mais
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
          </a>
        </div>
      </div>
    </article>
  );
}

function EmptyState() {
  return (
    <div class="flex flex-col items-center justify-center py-20 text-center">
      <div class="w-24 h-24 mb-6 rounded-full bg-slate-800 flex items-center justify-center">
        <svg
          class="w-12 h-12 text-slate-600"
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
      <h3 class="text-xl font-semibold text-slate-300 mb-2">
        Nenhuma notícia encontrada
      </h3>
      <p class="text-slate-500 max-w-md">
        Configure URLs no loader ou adicione notícias manualmente para começar.
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
          class="bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-700/30 animate-pulse"
        >
          <div class="aspect-video bg-slate-700/50" />
          <div class="p-6 space-y-4">
            <div class="h-3 bg-slate-700/50 rounded w-20" />
            <div class="h-6 bg-slate-700/50 rounded w-full" />
            <div class="h-4 bg-slate-700/50 rounded w-3/4" />
            <div class="h-4 bg-slate-700/50 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function News({
  title = "Últimas Notícias",
  subtitle,
  items = [],
  loading = false,
  error,
}: Props) {
  return (
    <section
      id="news-section"
      class="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-16 px-4"
    >
      <div class="container mx-auto max-w-7xl">
        {/* Header */}
        <header class="text-center mb-12">
          <h1 class="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 mb-4">
            {title}
          </h1>
          {subtitle && (
            <p class="text-lg text-slate-400 max-w-2xl mx-auto">{subtitle}</p>
          )}

          {/* Refresh button */}
          <a
            href="/news"
            class="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/20 transition-all"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Atualizar
          </a>
        </header>

        {/* Error State */}
        {error && (
          <div class="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-center">
            <p>Erro ao carregar notícias: {error}</p>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <div class="space-y-12">
            {Array.from(groupByWeek(items)).map(([weekKey, { label, items: weekItems }]) => (
              <div key={weekKey} class="space-y-6">
                {/* Week Header */}
                <div class="flex items-center gap-4">
                  <div class="flex items-center gap-3">
                    <div class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <h2 class="text-2xl font-bold text-white">{label}</h2>
                  </div>
                  <div class="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent" />
                  <span class="text-sm text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full">
                    {weekItems.length} {weekItems.length === 1 ? "notícia" : "notícias"}
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
  );
}

