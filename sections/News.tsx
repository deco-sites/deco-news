import { useSection } from "@deco/deco/hooks";
import type { NewsItem } from "site/types/news.ts";

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
   * @title URL para buscar
   * @description URL para fazer scrape de notícia
   */
  scrapeUrl?: string;
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

function NewsCard({ item }: { item: NewsItem }) {
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
  scrapeUrl,
  loading = false,
  error,
}: Props) {
  const refreshLink = useSection({ props: { loading: true } });

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
          <button
            hx-target="#news-section"
            hx-swap="outerHTML"
            hx-get={refreshLink}
            class="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/20 transition-all"
          >
            <svg
              class="w-4 h-4 [.htmx-request_&]:animate-spin"
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
            <span class="inline [.htmx-request_&]:hidden">Atualizar</span>
            <span class="hidden [.htmx-request_&]:inline">Carregando...</span>
          </button>
        </header>

        {/* Error State */}
        {error && (
          <div class="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-center">
            <p>Erro ao carregar notícias: {error}</p>
          </div>
        )}

        {/* Scrape URL input */}
        {scrapeUrl && (
          <div class="mb-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <p class="text-sm text-slate-400">
              Buscando de: <span class="text-emerald-400">{scrapeUrl}</span>
            </p>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item, index) => (
              <NewsCard key={`${item.url}-${index}`} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

