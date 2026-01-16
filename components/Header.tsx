interface Props {
  /** Página ativa atual - "news" ou "ai-models" */
  activePage?: "news" | "ai-models";
}

export default function Header({ activePage = "news" }: Props) {
  return (
    <header class="sticky top-0 z-50 bg-[#F5F5F0]/80 backdrop-blur-xl border-b border-neutral-200/50">
      <div class="container mx-auto max-w-7xl px-6">
        <div class="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" class="flex items-center gap-2">
            <img 
              src="https://assets.decocache.com/decocms/c6af6b61-bb6d-4601-8003-708d62d5fb7a/logo-tiny.svg" 
              alt="deco news logo" 
              class="h-8 w-auto object-contain"
            />
            <span class="font-bold text-neutral-900 text-lg">deco news</span>
          </a>

          {/* Nav */}
          <nav class="hidden sm:flex items-center gap-6">
            <a 
              href="/" 
              class={`text-sm font-medium transition-colors ${
                activePage === "news" 
                  ? "text-lime-600" 
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              News
            </a>
            <a 
              href="/ai-models" 
              class={`text-sm font-medium transition-colors ${
                activePage === "ai-models" 
                  ? "text-lime-600" 
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Trending AI Models
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
  );
}

