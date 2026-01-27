import { defineRoute } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import Header from "../../components/Header.tsx";
import weeklyArticleLoader from "../../loaders/weeklyArticle.ts";
import type { NewsItem } from "../../types/news.ts";

/**
 * Converte markdown para HTML básico
 * Remove o primeiro H1 (título duplicado do header)
 */
function markdownToHtml(content: string): string {
  // Remove o primeiro H1 do conteúdo (já exibido no header)
  const contentWithoutFirstH1 = content.replace(/^#\s+[^\n]+\n+/, '');
  
  return contentWithoutFirstH1
    // Headers
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-neutral-900 mt-6 mb-3">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-neutral-900 mt-8 mb-4">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-neutral-900 mt-10 mb-5">$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-neutral-900">$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-lime-600 hover:text-lime-700 underline underline-offset-2 transition-colors">$1</a>')
    // Line breaks
    .replace(/\n\n/g, '</p><p class="text-neutral-700 leading-relaxed mb-4">')
    // Lists - unordered
    .replace(/^\s*[-*]\s+(.*)$/gim, '<li class="text-neutral-700 leading-relaxed ml-6 mb-1.5">$1</li>')
    // Lists - ordered
    .replace(/^\s*\d+\.\s+(.*)$/gim, '<li class="text-neutral-700 leading-relaxed ml-6 mb-1.5 list-decimal">$1</li>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-neutral-100 text-neutral-800 rounded text-sm font-mono">$1</code>')
    // Horizontal rule
    .replace(/^---$/gim, '<hr class="my-8 border-neutral-200">')
    // Wrap in paragraph
    .replace(/^(?!<[hpuol]|<li|<hr)(.+)$/gim, '<p class="text-neutral-700 leading-relaxed mb-4">$1</p>');
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
          <div class="container mx-auto max-w-4xl text-center">
            <div class="w-24 h-24 mx-auto mb-8 rounded-2xl bg-neutral-100 flex items-center justify-center">
              <svg class="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 class="text-3xl font-bold text-neutral-900 mb-4">Article not found</h1>
            <p class="text-neutral-500 mb-8">The weekly report you're looking for doesn't exist or has been removed.</p>
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

  return (
    <div class="min-h-screen bg-[#F5F5F0]">
      {/* SEO Meta Tags */}
      <Head>
        <title>{seoTitle} | Deco Weekly</title>
        <meta name="description" content={seoDescription} />
        {seoKeywords && <meta name="keywords" content={seoKeywords} />}
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        {article.image && <meta property="og:image" content={article.image} />}
        {article.publishedAt && <meta property="article:published_time" content={article.publishedAt} />}
        {article.author && <meta property="article:author" content={article.author} />}
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        {article.image && <meta name="twitter:image" content={article.image} />}
      </Head>

      <Header activePage="news" />
      
      {/* Hero Section */}
      <article class="relative">
        {/* Background gradient */}
        <div class="absolute inset-0 bg-gradient-to-b from-lime-50/50 via-[#F5F5F0] to-[#F5F5F0] h-[300px]" />
        
        {/* Header content */}
        <header class="relative pt-6 pb-4 px-6">
          <div class="container mx-auto max-w-4xl">
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
            <h1 class="text-3xl md:text-4xl font-bold text-neutral-900 leading-tight mb-3">
              {article.title}
            </h1>

            {/* Summary - menor */}
            {article.summary && (
              <p class="text-base text-neutral-500 leading-relaxed mb-4 max-w-3xl line-clamp-2">
                {article.summary}
              </p>
            )}
          </div>
        </header>

        {/* Banner Image */}
        {article.image && (
          <section class="relative py-4 px-6">
            <div class="container mx-auto max-w-4xl">
              <figure class="relative overflow-hidden rounded-2xl bg-neutral-100">
                <img 
                  src={article.image} 
                  alt={article.imageAltText || article.title}
                  class="w-full h-auto max-h-[500px] object-cover"
                  loading="eager"
                />
                {article.imageAltText && (
                  <figcaption class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-6 py-4">
                    <p class="text-white/90 text-sm">{article.imageAltText}</p>
                  </figcaption>
                )}
              </figure>
            </div>
          </section>
        )}

        {/* Key Points - Dropdown */}
        {article.keyPoints && article.keyPoints.length > 0 && (
          <section class="relative py-4 px-6">
            <div class="container mx-auto max-w-4xl">
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

        {/* Content */}
        <section class="relative py-4 px-6">
          <div class="container mx-auto max-w-4xl">
            <div 
              class="prose prose-neutral max-w-none
                     prose-headings:font-bold prose-headings:text-neutral-900
                     prose-p:text-neutral-700 prose-p:leading-relaxed
                     prose-a:text-lime-600 prose-a:no-underline hover:prose-a:underline
                     prose-strong:text-neutral-900 prose-strong:font-semibold
                     prose-code:bg-neutral-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                     prose-li:text-neutral-700"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(article.content || "") }}
            />
          </div>
        </section>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <section class="relative py-4 px-6">
            <div class="container mx-auto max-w-4xl">
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
          <div class="container mx-auto max-w-4xl">
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

