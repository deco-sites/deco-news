import { defineRoute } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import Header from "../../components/Header.tsx";
import weeklyArticleLoader from "../../loaders/weeklyArticle.ts";
import type { NewsItem } from "../../types/news.ts";

/**
 * Converte markdown para HTML básico e gera TOC (índice) a partir dos headings.
 * Remove o primeiro H1 (título duplicado do header).
 */
type TocItem = {
  id: string;
  text: string;
  level: 2 | 3;
};

function slugifyHeading(text: string): string {
  // Normaliza acentos (NFKD) e remove diacríticos
  const normalized = text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  return normalized
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueSlug(base: string, used: Map<string, number>): string {
  const safeBase = base || "section";
  const next = (used.get(safeBase) ?? 0) + 1;
  used.set(safeBase, next);
  return next === 1 ? safeBase : `${safeBase}-${next}`;
}

function cleanHeadingText(raw: string): string {
  // Remove um subset de marcações inline comuns pra ficar bom no TOC
  return raw
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

function renderWeeklyMarkdown(content: string): { html: string; toc: TocItem[] } {
  // Remove o primeiro H1 do conteúdo (já exibido no header)
  let processedContent = content.replace(/^#\s+[^\n]+\n+/, '');
  
  const toc: TocItem[] = [];
  const usedSlugs = new Map<string, number>();

  // Primeiro: processar HTML existente (<h2>, <h3>) e adicionar IDs se não tiverem
  processedContent = processedContent.replace(
    /<h([23])(?:\s[^>]*)?>([^<]+)<\/h\1>/gi,
    (_match, level: string, rawTitle: string) => {
      const numLevel = parseInt(level);
      const text = cleanHeadingText(rawTitle);
      const id = uniqueSlug(slugifyHeading(text), usedSlugs);
      toc.push({ id, text, level: numLevel as 2 | 3 });

      if (numLevel === 2) {
        return `<div class="relative mt-14 mb-6 scroll-mt-24" id="${id}">
          <div class="absolute -left-4 md:-left-6 top-1 h-8 w-1 bg-gradient-to-b from-lime-400 to-lime-500 rounded-full"></div>
          <h2 class="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight leading-tight">${rawTitle}</h2>
        </div>`;
      }
      return `<h3 id="${id}" class="relative mt-8 mb-4 pl-4 border-l-2 border-lime-300/70 scroll-mt-24">
        <span class="block text-lg md:text-xl font-bold text-neutral-800 leading-snug">${rawTitle}</span>
      </h3>`;
    }
  );

  const html = processedContent
    // "Read more" / "Leia mais" em linha dedicada vira CTA em bloco
    .replace(
      /^(?:read more|read more:|leia mais|leia mais:)\s*\[([^\]]+)\]\(([^)]+)\)\s*$/gim,
      (_match, text: string, href: string) =>
        `<div class="my-6 not-prose">` +
        `<a href="${href}" target="_blank" rel="noopener noreferrer" ` +
        `class="group inline-flex w-full items-center justify-between gap-4 rounded-2xl border border-lime-200/70 bg-white/70 backdrop-blur-sm px-5 py-4 ` +
        `text-neutral-900 hover:border-lime-300 hover:bg-lime-50/60 transition-colors">` +
        `<span class="flex items-center gap-3 min-w-0">` +
        `<span class="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-500 text-neutral-900">` +
        `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">` +
        `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h6m0 0v6m0-6L10 16l-3-3-4 4" />` +
        `</svg>` +
        `</span>` +
        `<span class="min-w-0">` +
        `<span class="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-0.5">Read more</span>` +
        `<span class="block font-semibold text-neutral-900 truncate">${text}</span>` +
        `</span>` +
        `</span>` +
        `<span class="flex items-center gap-2 text-sm font-semibold text-lime-700 group-hover:text-lime-800">` +
        `<span class="hidden sm:inline">Open</span>` +
        `<svg class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">` +
        `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />` +
        `</svg>` +
        `</span>` +
        `</a>` +
        `</div>`,
    )
    // Variante: "Read more: https://..." (URL solta)
    .replace(
      /^(?:read more|read more:|leia mais|leia mais:)\s*(https?:\/\/\S+)\s*$/gim,
      (_match, href: string) =>
        `<div class="my-6 not-prose">` +
        `<a href="${href}" target="_blank" rel="noopener noreferrer" ` +
        `class="group inline-flex w-full items-center justify-between gap-4 rounded-2xl border border-lime-200/70 bg-white/70 backdrop-blur-sm px-5 py-4 ` +
        `text-neutral-900 hover:border-lime-300 hover:bg-lime-50/60 transition-colors">` +
        `<span class="flex items-center gap-3 min-w-0">` +
        `<span class="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-500 text-neutral-900">` +
        `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">` +
        `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h6m0 0v6m0-6L10 16l-3-3-4 4" />` +
        `</svg>` +
        `</span>` +
        `<span class="min-w-0">` +
        `<span class="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-0.5">Read more</span>` +
        `<span class="block font-semibold text-neutral-900 truncate">${href}</span>` +
        `</span>` +
        `</span>` +
        `<span class="flex items-center gap-2 text-sm font-semibold text-lime-700 group-hover:text-lime-800">` +
        `<span class="hidden sm:inline">Open</span>` +
        `<svg class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">` +
        `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />` +
        `</svg>` +
        `</span>` +
        `</a>` +
        `</div>`,
    )
    // Headers (gera ids + TOC preservando a ordem do documento)
    .replace(/^(#{1,3})\s+(.+)$/gim, (_match, hashes: string, rawTitle: string) => {
      const level = hashes.length;
      if (level === 1) {
        return `<h1 class="text-3xl md:text-4xl font-black text-neutral-900 mt-12 mb-6 scroll-mt-24 tracking-tight">${rawTitle}</h1>`;
      }

      const text = cleanHeadingText(rawTitle);
      const id = uniqueSlug(slugifyHeading(text), usedSlugs);
      toc.push({ id, text, level: level === 2 ? 2 : 3 });

      if (level === 2) {
        return `<div class="relative mt-14 mb-6 scroll-mt-24" id="${id}">
          <div class="absolute -left-4 md:-left-6 top-1 h-8 w-1 bg-gradient-to-b from-lime-400 to-lime-500 rounded-full"></div>
          <h2 class="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight leading-tight">${rawTitle}</h2>
        </div>`;
      }

      return `<h3 id="${id}" class="relative mt-8 mb-4 pl-4 border-l-2 border-lime-300/70 scroll-mt-24">
        <span class="block text-lg md:text-xl font-bold text-neutral-800 leading-snug">${rawTitle}</span>
      </h3>`;
    })
    // Bold - com mais destaque visual
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-neutral-900 bg-lime-100/50 px-1 -mx-1 rounded">$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em class="text-neutral-600 not-italic border-b border-dashed border-neutral-300">$1</em>')
    // Links markdown - estilo tradicional azul com sublinhado
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      `<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline underline-offset-2 decoration-blue-400/60 hover:decoration-blue-600 transition-colors">$1</a>`,
    )
    // Links HTML existentes (sem classe) - adiciona estilo azul com sublinhado
    .replace(
      /<a\s+href="([^"]+)"(?:\s+target="[^"]*")?(?:\s+rel="[^"]*")?\s*>([^<]+)<\/a>/gi,
      `<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline underline-offset-2 decoration-blue-400/60 hover:decoration-blue-600 transition-colors">$2</a>`,
    )
    // Line breaks - parágrafos com mais respiro
    .replace(/\n\n/g, '</p><p class="text-neutral-600 text-lg leading-[1.85] mb-6">')
    // Lists - unordered com bullets estilizados
    .replace(/^\s*[-*]\s+(.*)$/gim, `<li class="relative text-neutral-600 text-lg leading-relaxed pl-7 mb-3 before:content-[''] before:absolute before:left-0 before:top-[0.6em] before:w-2 before:h-2 before:bg-lime-400 before:rounded-full">$1</li>`)
    // Lists - ordered com números destacados
    .replace(/^\s*\d+\.\s+(.*)$/gim, '<li class="text-neutral-600 text-lg leading-relaxed ml-6 mb-3 list-decimal marker:text-lime-600 marker:font-bold">$1</li>')
    // Inline code - mais destacado
    .replace(/`([^`]+)`/g, '<code class="px-2 py-1 bg-neutral-900 text-lime-400 rounded-md text-sm font-mono">$1</code>')
    // Horizontal rule - mais visual
    .replace(/^---$/gim, `<div class="my-12 flex items-center gap-4">
      <div class="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent"></div>
      <div class="flex gap-1.5">
        <span class="w-2 h-2 bg-lime-400 rounded-full"></span>
        <span class="w-2 h-2 bg-lime-500 rounded-full"></span>
        <span class="w-2 h-2 bg-lime-600 rounded-full"></span>
      </div>
      <div class="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent"></div>
    </div>`)
    // Wrap in paragraph - fonte maior e mais respiração
    .replace(/^(?!<[hpuol]|<li|<hr|<div)(.+)$/gim, '<p class="text-neutral-600 text-lg leading-[1.85] mb-6">$1</p>');

  return { html, toc };
}

/**
 * Página de leitura de artigo Weekly Report
 */
export default defineRoute(async (req, ctx) => {
  const { slug } = ctx.params;
  
  let article: NewsItem | null = null;
  let error: string | undefined;

  try {
    article = await weeklyArticleLoader({ slug }, req);
  } catch (e) {
    error = e instanceof Error ? e.message : "Error loading article";
    console.error("❌ [WeeklyPage] Erro:", e);
  }

  // Se não encontrou o artigo, mostra página 404
  if (!article) {
    return (
      <div class="min-h-screen bg-[#F5F5F0]">
        <Header activePage="news" />
        <main class="py-24 px-6">
          <div class="container mx-auto max-w-3xl text-center">
            <div class="w-24 h-24 mx-auto mb-8 rounded-2xl bg-neutral-100 flex items-center justify-center">
              <svg class="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 class="text-3xl font-bold text-neutral-900 mb-4">Article not found</h1>
            <p class="text-neutral-500 mb-4">The weekly report you're looking for doesn't exist or has been removed.</p>
            {error && (
              <p class="text-sm text-red-600 mb-8">
                {error}
              </p>
            )}
            <a href="/" class="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white font-semibold rounded-xl hover:bg-neutral-800 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to news
            </a>
          </div>
        </main>
      </div>
    );
  }

  const formattedDate = article.publishedAt 
    ? new Date(article.publishedAt).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  // SEO: usar meta_title se disponível, senão usar título
  const seoTitle = article.metaTitle || article.title;
  const seoDescription = article.metaDescription || article.summary || "";
  const seoKeywords = article.keywords?.join(", ") || article.tags?.join(", ") || "";
  const canonicalUrl = `https://news.deco.cx/weekly/${article.slug}`;

  const requestOrigin = new URL(req.url).origin;
  const defaultOgImage = new URL("/android-chrome-512x512.png", requestOrigin).toString();
  const ogImage = (() => {
    if (!article.image) return defaultOgImage;
    try {
      return new URL(article.image, requestOrigin).toString();
    } catch {
      return defaultOgImage;
    }
  })();
  const ogImageAlt = article.imageAltText || seoTitle;

  const { html: articleHtml, toc } = renderWeeklyMarkdown(article.content || "");

  return (
    <div class="min-h-screen bg-[#F5F5F0]">
      {/* SEO Meta Tags */}
      <Head>
        <title>{seoTitle} | Deco Weekly</title>
        <meta name="description" content={seoDescription} />
        {seoKeywords && <meta name="keywords" content={seoKeywords} />}
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Smooth scroll */}
        <style>{`html { scroll-behavior: smooth; }`}</style>
        
        {/* Open Graph */}
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:alt" content={ogImageAlt} />
        {article.publishedAt && <meta property="article:published_time" content={article.publishedAt} />}
        {article.author && <meta property="article:author" content={article.author} />}
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={ogImage} />
      </Head>

      <Header activePage="news" />
      
      {/* Hero Section */}
      <article class="relative">
        {/* Background gradient */}
        <div class="absolute inset-0 bg-gradient-to-b from-lime-50/50 via-[#F5F5F0] to-[#F5F5F0] h-[300px]" />
        
        {/* Header content */}
        <header class="relative pt-6 pb-4 px-6">
          <div class="container mx-auto max-w-3xl">
            {/* Back link */}
            <a 
              href="/" 
              class="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors mb-4 group text-sm"
            >
              <svg class="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span class="font-medium">Back to news</span>
            </a>

            {/* Badge + Meta inline */}
            <div class="flex flex-wrap items-center gap-3 mb-4">
              <span class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-lime-500 text-white rounded-full">
                <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
                </svg>
                Deco Weekly
              </span>
              {article.category && (
                <span class="px-2.5 py-1 text-xs font-medium bg-neutral-100 text-neutral-600 rounded-full">
                  {article.category}
                </span>
              )}
              {article.readingTime && (
                <span class="text-xs text-neutral-500">
                  {article.readingTime} min read
                </span>
              )}
              {formattedDate && (
                <>
                  <span class="text-neutral-300">•</span>
                  <time class="text-xs text-neutral-500">{formattedDate}</time>
                </>
              )}
              {article.author && (
                <>
                  <span class="text-neutral-300">•</span>
                  <span class="text-xs text-neutral-500">By <span class="font-medium text-neutral-700">{article.author}</span></span>
                </>
              )}
            </div>

            {/* Title */}
            <h1 class="text-4xl md:text-5xl lg:text-6xl font-black text-neutral-900 leading-[1.1] tracking-tight mb-6">
              <span class="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 bg-clip-text">
                {article.title}
              </span>
            </h1>

            {/* Summary - destaque visual */}
            {article.summary && (
              <div class="relative pl-5 border-l-4 border-lime-400 mb-6">
                <p class="text-xl md:text-2xl text-neutral-500 leading-relaxed font-light italic max-w-3xl">
                  {article.summary}
                </p>
              </div>
            )}
          </div>
        </header>

        {/* Banner Image */}
        {article.image && (
          <section class="relative py-4 px-6">
            <div class="container mx-auto max-w-3xl">
              <figure class="relative overflow-hidden rounded-2xl bg-neutral-100">
                <img 
                  src={article.image} 
                  alt={article.imageAltText || article.title}
                  class="w-full h-auto max-h-[500px] object-cover"
                  loading="eager"
                />
              </figure>
              {article.imageAltText && (
                <figcaption class="mt-3 px-1 text-sm text-neutral-500 leading-relaxed">
                  {article.imageAltText}
                </figcaption>
              )}
            </div>
          </section>
        )}

        {/* Key Points - Dropdown */}
        {article.keyPoints && article.keyPoints.length > 0 && (
          <section class="relative py-4 px-6">
            <div class="container mx-auto max-w-3xl">
              <details class="bg-lime-50/50 rounded-xl border border-lime-200/60 overflow-hidden group">
                <summary class="flex items-center justify-between gap-2 px-5 py-3 cursor-pointer hover:bg-lime-50 transition-colors list-none">
                  <div class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-lime-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    <span class="font-semibold text-neutral-900 text-sm">Key Takeaways</span>
                    <span class="text-xs text-neutral-400">({article.keyPoints.length} points)</span>
                  </div>
                  <svg class="w-4 h-4 text-neutral-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <ul class="px-5 pb-4 pt-2 space-y-2 border-t border-lime-200/40">
                  {article.keyPoints.map((point, index) => (
                    <li key={index} class="flex items-start gap-2">
                      <span class="flex-shrink-0 w-5 h-5 rounded-full bg-lime-200/60 text-lime-700 flex items-center justify-center text-xs font-semibold mt-0.5">
                        {index + 1}
                      </span>
                      <span class="text-neutral-600 text-sm leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          </section>
        )}

        {/* Floating TOC (desktop - lateral esquerda) - estilo minimalista com riscos */}
        {toc.length > 0 && (
          <aside class="hidden xl:block fixed top-28 z-40 left-4 2xl:left-[max(1rem,calc((100vw-1000px)/2-260px))]">
            <nav id="floating-toc" class="group/toc toc-expanded max-h-[calc(100vh-140px)] overflow-y-auto scrollbar-thin">
              {/* Container que expande no hover ou quando toc-expanded está ativo */}
              <div class="toc-container w-12 transition-all duration-300 ease-out overflow-hidden">
                {/* Indicador de seção atual */}
                <div class="flex items-center gap-2 mb-4 h-4 overflow-hidden">
                  <div class="w-1 h-1 bg-lime-500 rounded-full flex-shrink-0" />
                  <span class="toc-label text-[10px] font-medium text-neutral-400 uppercase tracking-wider whitespace-nowrap opacity-0 transition-opacity duration-300 delay-100">
                    On this page
                  </span>
                </div>
                
                <ul class="space-y-2.5">
                  {toc.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        class={`flex items-center h-5 overflow-hidden ${
                          item.level === 3 ? "ml-2" : ""
                        }`}
                      >
                        {/* Risco/linha - visível por padrão, esconde no hover/expanded */}
                        <span 
                          class={`toc-line flex-shrink-0 h-[2px] rounded-full transition-all duration-300 
                            ${item.level === 3 
                              ? "w-5 bg-neutral-300" 
                              : "w-8 bg-neutral-400"
                            }`}
                          data-level={item.level}
                        />
                        
                        {/* Texto - aparece no hover ou quando toc-expanded */}
                        <span 
                          class={`toc-text whitespace-nowrap text-[13px] leading-none
                            opacity-0 transition-opacity duration-300 delay-75
                            hover:text-lime-600
                            ${item.level === 3 
                              ? "text-neutral-400 hover:text-neutral-600" 
                              : "text-neutral-600 font-medium"
                            }`}
                        >
                          {item.text}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
            
            {/* Script para controlar expansão/colapso baseado no scroll */}
            <script dangerouslySetInnerHTML={{ __html: `
              (function() {
                const toc = document.getElementById('floating-toc');
                if (!toc) return;
                
                const SCROLL_THRESHOLD = 150; // pixels para colapsar
                let isScrolled = false;
                
                function updateTocState() {
                  const shouldCollapse = window.scrollY > SCROLL_THRESHOLD;
                  
                  if (shouldCollapse !== isScrolled) {
                    isScrolled = shouldCollapse;
                    if (shouldCollapse) {
                      toc.classList.remove('toc-expanded');
                    } else {
                      toc.classList.add('toc-expanded');
                    }
                  }
                }
                
                // Throttle scroll events
                let ticking = false;
                window.addEventListener('scroll', function() {
                  if (!ticking) {
                    window.requestAnimationFrame(function() {
                      updateTocState();
                      ticking = false;
                    });
                    ticking = true;
                  }
                }, { passive: true });
                
                // Estado inicial
                updateTocState();
              })();
            `}} />
            
            {/* Estilos para controlar estados do TOC */}
            <style dangerouslySetInnerHTML={{ __html: `
              /* Estado expandido (inicial ou hover) */
              #floating-toc.toc-expanded .toc-container,
              #floating-toc:hover .toc-container {
                width: 14rem; /* w-56 */
              }
              
              #floating-toc.toc-expanded .toc-label,
              #floating-toc:hover .toc-label {
                opacity: 1;
              }
              
              #floating-toc.toc-expanded .toc-line,
              #floating-toc:hover .toc-line {
                width: 0.25rem; /* w-1 */
                margin-right: 0.5rem; /* mr-2 */
              }
              
              #floating-toc.toc-expanded .toc-line[data-level="2"],
              #floating-toc:hover .toc-line[data-level="2"] {
                background-color: rgb(132 204 22); /* bg-lime-500 */
              }
              
              #floating-toc.toc-expanded .toc-text,
              #floating-toc:hover .toc-text {
                opacity: 1;
              }
            `}} />
          </aside>
        )}

        {/* Content */}
        <section class="relative py-4 px-6">
          <div class="container mx-auto max-w-3xl">
            {/* TOC (mobile/tablet - dropdown) */}
            {toc.length > 0 && (
              <div class="xl:hidden mb-6">
                <details class="bg-white/70 backdrop-blur-sm rounded-xl border border-neutral-200/60 shadow-sm overflow-hidden group">
                  <summary class="flex items-center justify-between gap-2 px-4 py-3 cursor-pointer hover:bg-white/80 transition-colors list-none">
                    <div class="flex items-center gap-2">
                      <div class="w-1 h-4 bg-lime-500 rounded-full" />
                      <span class="font-medium text-neutral-700 text-sm">On this page</span>
                      <span class="text-xs text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded-md">{toc.length}</span>
                    </div>
                    <svg class="w-4 h-4 text-neutral-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div class="px-4 pb-4 pt-2 border-t border-neutral-100">
                    <ul class="space-y-1">
                      {toc.map((item) => (
                        <li key={item.id}>
                          <a
                            href={`#${item.id}`}
                            class={`flex items-center gap-2 py-1.5 text-sm transition-colors ${
                              item.level === 3 
                                ? "pl-4 text-neutral-400 hover:text-neutral-600" 
                                : "text-neutral-600 hover:text-lime-700"
                            }`}
                          >
                            <span class={`w-1 h-1 rounded-full ${
                              item.level === 3 ? "bg-neutral-300" : "bg-lime-400"
                            }`} />
                            {item.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </details>
              </div>
            )}

            <div 
              class="relative pl-4 md:pl-10 prose prose-neutral max-w-none
                     prose-headings:font-bold prose-headings:text-neutral-900
                     prose-p:text-neutral-600 prose-p:text-lg prose-p:leading-[1.85]
                     prose-a:text-blue-600 prose-a:underline prose-a:decoration-blue-400/60 hover:prose-a:text-blue-800 hover:prose-a:decoration-blue-600
                     prose-strong:text-neutral-900 prose-strong:font-bold
                     prose-code:bg-neutral-900 prose-code:text-lime-400 prose-code:px-2 prose-code:py-1 prose-code:rounded-md prose-code:text-sm
                     prose-li:text-neutral-600 prose-li:text-lg
                     [&>div:first-child]:mt-0"
              // deno-lint-ignore react-no-danger
              dangerouslySetInnerHTML={{ __html: articleHtml }}
            />
          </div>
        </section>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <section class="relative py-4 px-6">
            <div class="container mx-auto max-w-3xl">
              <div class="flex flex-wrap items-center gap-2 pt-4 border-t border-neutral-200/60">
                <span class="text-xs text-neutral-400 mr-1">Tags:</span>
                {article.tags.map((tag, index) => (
                  <span 
                    key={index}
                    class="px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-500 rounded-full hover:bg-neutral-200 transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Footer CTA */}
        <section class="relative py-10 px-6">
          <div class="container mx-auto max-w-3xl">
            <div class="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-3xl p-8 md:p-12 text-center">
              <h3 class="text-2xl md:text-3xl font-bold text-white mb-4">
                Stay updated with Deco Weekly
              </h3>
              <p class="text-neutral-300 mb-8 max-w-xl mx-auto">
                Get the latest tech news, AI developments, and web platform updates delivered to your feed every week.
              </p>
              <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a 
                  href="/"
                  class="inline-flex items-center gap-2 px-6 py-3 bg-lime-500 text-neutral-900 font-bold rounded-xl hover:bg-lime-400 transition-colors"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  Browse all news
                </a>
                <a 
                  href="https://decocms.com"
                  target="_blank"
                  class="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors border border-white/20"
                >
                  <span>Powered by</span>
                  <span class="font-bold">decocms</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </article>

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
});

