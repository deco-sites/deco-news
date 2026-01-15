import type { AIModel } from "site/types/aiModels.ts";

export interface Props {
  /**
   * @title Título da seção
   * @default Top AI Models
   */
  title?: string;
  /**
   * @title Subtítulo
   * @description Descrição curta abaixo do título
   */
  subtitle?: string;
  /**
   * @title Modelos
   * @description Lista de modelos de AI para exibir
   */
  models?: AIModel[];
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
 * Retorna cor baseada no ranking
 */
function getRankBadge(rank: number) {
  if (rank === 1) {
    return (
      <div class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold text-sm shadow-md">
        {rank}
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 text-white font-bold text-sm shadow-md">
        {rank}
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white font-bold text-sm shadow-md">
        {rank}
      </div>
    );
  }
  return (
    <div class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100 text-neutral-600 font-semibold text-sm border border-neutral-200">
      {rank}
    </div>
  );
}

/**
 * Componente de tag para pontos fortes/fracos
 */
function PointTag({ text, type }: { text: string; type: "strength" | "weakness" }) {
  const isStrength = type === "strength";
  return (
    <span class={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
      isStrength 
        ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
        : "bg-rose-50 text-rose-700 border border-rose-200"
    }`}>
      {isStrength ? (
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
        </svg>
      ) : (
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
        </svg>
      )}
      <span class="truncate max-w-[150px]">{text}</span>
    </span>
  );
}

/**
 * Lista de modelos com cards expansíveis
 */
function ModelsTable({ models }: { models: AIModel[] }) {
  return (
    <div class="space-y-3">
      {models.map((model) => (
        <ModelTableRowWrapper key={model.id} model={model} />
      ))}
    </div>
  );
}

/**
 * Wrapper para gerenciar estado de expansão de cada linha
 * Usando data attributes para manter o estado sem JavaScript
 */
function ModelTableRowWrapper({ model }: { model: AIModel }) {
  return (
    <details class="group bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <summary class="cursor-pointer list-none">
        <div class="flex items-center gap-4 px-5 py-4 hover:bg-neutral-50 transition-colors">
          {/* Rank */}
          <div class="shrink-0">
            {getRankBadge(model.rank)}
          </div>
          
          {/* Model Name */}
          <div class="flex-1 min-w-0">
            <div class="flex flex-col">
              <span class="font-semibold text-neutral-900 truncate">{model.model_name}</span>
              <span class="text-sm text-neutral-500">{model.company}</span>
            </div>
          </div>
          
          {/* License */}
          <div class="hidden md:block shrink-0">
            {model.license_type && (
              <span class="inline-flex px-2.5 py-1 text-xs font-medium bg-lime-100 text-lime-700 rounded-full">
                {model.license_type}
              </span>
            )}
          </div>
          
          {/* Context Window */}
          <div class="hidden lg:block shrink-0 w-28">
            <span class="text-sm text-neutral-600">{model.context_window || "-"}</span>
          </div>
          
          {/* Strengths Preview */}
          <div class="hidden xl:flex flex-wrap gap-1 w-56">
            {model.strengths?.slice(0, 2).map((s, i) => (
              <PointTag key={i} text={s} type="strength" />
            ))}
            {(model.strengths?.length || 0) > 2 && (
              <span class="text-xs text-neutral-400">+{(model.strengths?.length || 0) - 2}</span>
            )}
          </div>
          
          {/* Weaknesses Preview */}
          <div class="hidden xl:flex flex-wrap gap-1 w-56">
            {model.weaknesses?.slice(0, 2).map((w, i) => (
              <PointTag key={i} text={w} type="weakness" />
            ))}
            {(model.weaknesses?.length || 0) > 2 && (
              <span class="text-xs text-neutral-400">+{(model.weaknesses?.length || 0) - 2}</span>
            )}
          </div>
          
          {/* Expand Button */}
          <div class="shrink-0">
            <div class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-100 group-hover:bg-neutral-200 transition-colors">
              <svg 
                class="w-4 h-4 text-neutral-600 transition-transform group-open:rotate-180" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </summary>
      
      {/* Expanded Details */}
      <div class="bg-neutral-50 border-t border-neutral-100 px-6 py-6">
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Overview */}
          {model.short_overview && (
            <div class="lg:col-span-4">
              <h4 class="text-sm font-semibold text-neutral-700 mb-2">Overview</h4>
              <p class="text-sm text-neutral-600 leading-relaxed">{model.short_overview}</p>
            </div>
          )}
          
          {/* Strengths */}
          {model.strengths && model.strengths.length > 0 && (
            <div>
              <h4 class="text-sm font-semibold text-emerald-700 mb-3 flex items-center gap-2">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                Strengths
              </h4>
              <ul class="space-y-2">
                {model.strengths.map((s, i) => (
                  <li key={i} class="flex items-start gap-2 text-sm text-neutral-600">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Weaknesses */}
          {model.weaknesses && model.weaknesses.length > 0 && (
            <div>
              <h4 class="text-sm font-semibold text-rose-700 mb-3 flex items-center gap-2">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                Weaknesses
              </h4>
              <ul class="space-y-2">
                {model.weaknesses.map((w, i) => (
                  <li key={i} class="flex items-start gap-2 text-sm text-neutral-600">
                    <span class="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Pricing */}
          {model.pricing && Object.keys(model.pricing).length > 0 && (
            <div>
              <h4 class="text-sm font-semibold text-violet-700 mb-3 flex items-center gap-2">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"/>
                </svg>
                Pricing {model.currency && `(${model.currency})`}
              </h4>
              <div class="space-y-1">
                {Object.entries(model.pricing).map(([key, value]) => (
                  <div key={key} class="text-sm">
                    <span class="text-neutral-500 capitalize">{key}: </span>
                    <span class="text-neutral-700 font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Benchmarks */}
          {model.key_benchmarks && Object.keys(model.key_benchmarks).length > 0 && (
            <div>
              <h4 class="text-sm font-semibold text-sky-700 mb-3 flex items-center gap-2">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                </svg>
                Benchmarks
              </h4>
              <div class="space-y-1">
                {Object.entries(model.key_benchmarks).map(([key, value]) => (
                  <div key={key} class="text-sm">
                    <span class="text-neutral-500">{key}: </span>
                    <span class="text-neutral-700 font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Meta info */}
        {(model.source || model.notes || model.updated_at) && (
          <div class="mt-6 pt-4 border-t border-neutral-200 flex flex-wrap gap-4 text-xs text-neutral-400">
            {model.source && <span>Source: {model.source}</span>}
            {model.ranking_scope && <span>Scope: {model.ranking_scope}</span>}
            {model.notes && <span>Notes: {model.notes}</span>}
            {model.updated_at && (
              <span>Updated: {new Date(model.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            )}
          </div>
        )}
      </div>
    </details>
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
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>
      <h3 class="text-2xl font-bold text-neutral-900 mb-3">
        No AI models found
      </h3>
      <p class="text-neutral-500 max-w-md">
        AI models will appear here once they are added to the database.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div class="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} class="bg-white rounded-2xl border border-neutral-200 overflow-hidden animate-pulse">
          <div class="flex items-center gap-4 px-5 py-4">
            <div class="w-8 h-8 bg-neutral-200 rounded-full shrink-0" />
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-neutral-200 rounded w-1/3" />
              <div class="h-3 bg-neutral-100 rounded w-1/4" />
            </div>
            <div class="h-6 w-16 bg-neutral-100 rounded-full hidden md:block" />
            <div class="h-4 w-20 bg-neutral-100 rounded hidden lg:block" />
            <div class="w-8 h-8 bg-neutral-100 rounded-lg shrink-0" />
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

export default function AIModels({
  title = "Top AI Models",
  subtitle,
  models = [],
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
            <nav class="hidden sm:flex items-center gap-6">
              <a href="/" class="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
                News
              </a>
              <a href="/ai-models" class="text-sm font-medium text-lime-600">
                AI Models
              </a>
            </nav>

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
              <span class="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></span>
              <span class="text-neutral-600">AI Model Rankings</span>
            </div>

            {/* Title */}
            <h1 class="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95] mb-8">
              <span class="text-violet-500">Top</span>
              <span class="text-neutral-900"> AI </span>
              <span class="text-lime-500">Models</span>
              <span class="text-neutral-900"> — ranked and analyzed.</span>
            </h1>

            {/* Subtitle */}
            {subtitle ? (
              <p class="text-xl md:text-2xl text-neutral-500 max-w-3xl leading-relaxed">
                {subtitle}
              </p>
            ) : (
              <p class="text-xl md:text-2xl text-neutral-500 max-w-3xl leading-relaxed">
                Compare the most powerful AI models by performance, pricing, and capabilities.
              </p>
            )}

            {/* Stats */}
            <div class="flex flex-wrap gap-3 mt-10">
              <span class="pill-lime">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                {models.length} Models Ranked
              </span>
              <span class="pill-lime">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                Strengths & Weaknesses
              </span>
              <span class="pill-lime">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                Pricing & Benchmarks
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
                <p class="font-medium">Error loading AI models: {error}</p>
              </div>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <LoadingState />
          ) : models.length === 0 ? (
            <EmptyState />
          ) : (
            <ModelsTable models={models} />
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
