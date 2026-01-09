import type { NewsItem } from "site/types/news.ts";

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
            <span class="text-sm text-lime-600 font-semibold">Por {item.author}</span>
            {item.publishedAt && (
              <>
                <span class="text-neutral-300">•</span>
                <time class="text-sm text-neutral-500">
                  {new Date(item.publishedAt).toLocaleDateString("pt-BR", {
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
            Ler resumo completo
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

  return (
    <a
    href={item.url}
    target="_blank"
    rel="noopener noreferrer" class="group news-card flex flex-col h-full cursor-pointer">
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
        {item.category && (
          <span class="inline-block self-start px-3 py-1 text-xs font-bold bg-lime-400/20 text-forest-700 rounded-full uppercase tracking-wider mb-4">
            {item.category}
          </span>
        )}
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
                <time>{new Date(item.publishedAt).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}</time>
              </>
            )}
          </div>
          <div
            class="inline-flex items-center gap-1 text-lime-600 text-sm font-semibold hover:text-lime-700 transition-colors"
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
          </div>
        </div>
      </div>
    </a>
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
        Nenhuma notícia encontrada
      </h3>
      <p class="text-neutral-500 max-w-md">
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

export default function News({
  title: _title = "Deco News",
  subtitle,
  items = [],
  loading = false,
  error,
}: Props) {
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
              <span class="text-neutral-600">Atualizado automaticamente</span>
            </div>

            {/* Title - estilo Deco com palavras coloridas */}
            <h1 class="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95] mb-8">
              <span class="text-neutral-900">Notícias </span>
              <span class="text-lime-500">tech</span>
              <span class="text-neutral-900">, </span>
              <span class="text-lime-500">curadas</span>
              <span class="text-neutral-900">, e </span>
              <span class="text-lime-500">resumidas</span>
              <span class="text-neutral-900"> — direto no seu feed.</span>
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
                Curadoria de IA
              </span>
              <span class="pill-lime">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                Resumos semanais
              </span>
              <span class="pill-lime">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                Fontes confiáveis
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section class="pb-24 px-6">
        <div class="container mx-auto max-w-7xl">
          {/* Error State */}
          {error && (
            <div class="mb-8 p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700">
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
                <p class="font-medium">Erro ao carregar notícias: {error}</p>
              </div>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <LoadingState />
          ) : items.length === 0 ? (
            <EmptyState />
          ) : (
            <div class="space-y-16">
              {Array.from(groupByWeek(items)).map(([weekKey, { label, items: weekItems }]) => (
                <div key={weekKey} class="space-y-8">
                  {/* Week Header */}
                  <div class="flex items-center gap-6">
                    <div class="flex items-center gap-4">
                      <div class="w-3 h-3 bg-lime-500 rounded-full" />
                      <h2 class="text-3xl font-bold text-neutral-900">{label}</h2>
                    </div>
                    <div class="flex-1 h-px bg-gradient-to-r from-neutral-200 to-transparent" />
                    <span class="text-sm text-neutral-400 bg-white px-4 py-2 rounded-full border border-neutral-200/50">
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

      {/* Footer */}
      <footer class="border-t border-neutral-200/50 bg-white/50 backdrop-blur-sm">
        <div class="container mx-auto max-w-7xl px-6 py-8">
          <div class="flex flex-col md:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-2">
              <span class="text-sm text-neutral-500">Feito com</span>
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
