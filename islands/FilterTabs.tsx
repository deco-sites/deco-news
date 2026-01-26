import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import type { SourceCategory } from "site/types/news.ts";

type FilterType = "all" | SourceCategory;
type SortOrder = "none" | "desc" | "asc";

interface Props {
  counts: {
    all: number;
    "weekly-report": number;
    trendsetters: number;
    enterprise: number;
    "mcp-startups": number;
    community: number;
  };
}

const CATEGORY_CONFIG: Record<
  FilterType,
  { label: string; bgActive: string; iconSvg: string }
> = {
  all: {
    label: "Todos",
    bgActive: "bg-neutral-900",
    iconSvg: "",
  },
  "weekly-report": {
    label: "Weekly",
    bgActive: "bg-lime-500",
    iconSvg: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>`,
  },
  trendsetters: {
    label: "Trendsetters",
    bgActive: "bg-purple-500",
    iconSvg: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>`,
  },
  enterprise: {
    label: "Enterprise",
    bgActive: "bg-blue-500",
    iconSvg: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd"/></svg>`,
  },
  "mcp-startups": {
    label: "MCP Startups",
    bgActive: "bg-emerald-500",
    iconSvg: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/></svg>`,
  },
  community: {
    label: "Community",
    bgActive: "bg-orange-500",
    iconSvg: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/></svg>`,
  },
};

export default function FilterTabs({ counts }: Props) {
  const currentFilter = useSignal<FilterType>("all");
  const sortOrder = useSignal<SortOrder>("none");

  // Aplica o filtro nos cards usando data-attributes
  useEffect(() => {
    const filter = currentFilter.value;
    const container = document.getElementById("news-grid-container");
    if (!container) return;

    // Remove todas as classes de filtro anteriores
    container.classList.remove(
      "filter-all",
      "filter-weekly-report",
      "filter-trendsetters",
      "filter-enterprise",
      "filter-mcp-startups",
      "filter-community"
    );

    // Adiciona a classe do filtro atual
    container.classList.add(`filter-${filter}`);
  }, [currentFilter.value]);

  // Reordena os cards por post_score
  useEffect(() => {
    const order = sortOrder.value;
    const container = document.getElementById("news-grid-container");
    if (!container) return;

    // Encontra todos os grids de cards (dentro de cada semana)
    const weekSections = container.querySelectorAll(".week-section");
    
    weekSections.forEach((section) => {
      const grid = section.querySelector(".grid");
      if (!grid) return;

      const cards = Array.from(grid.querySelectorAll(".news-card-wrapper"));
      
      if (order === "none") {
        // Restaura ordem original usando o índice armazenado
        cards.sort((a, b) => {
          const indexA = parseInt(a.getAttribute("data-original-index") || "0");
          const indexB = parseInt(b.getAttribute("data-original-index") || "0");
          return indexA - indexB;
        });
      } else {
        // Armazena índice original se ainda não tiver
        cards.forEach((card, i) => {
          if (!card.hasAttribute("data-original-index")) {
            card.setAttribute("data-original-index", String(i));
          }
        });

        // Ordena por score
        cards.sort((a, b) => {
          const scoreA = parseFloat(a.getAttribute("data-score") || "0");
          const scoreB = parseFloat(b.getAttribute("data-score") || "0");
          return order === "desc" ? scoreB - scoreA : scoreA - scoreB;
        });
      }

      // Reinsere os cards na nova ordem
      cards.forEach((card) => grid.appendChild(card));
    });
  }, [sortOrder.value]);

  // Todos os filtros (sempre exibe todos, mesmo com count 0)
  const allFilters: FilterType[] = ["all", "weekly-report", "trendsetters", "enterprise", "mcp-startups", "community"];

  const cycleSortOrder = () => {
    const current = sortOrder.value;
    if (current === "none") {
      sortOrder.value = "desc";
    } else if (current === "desc") {
      sortOrder.value = "asc";
    } else {
      sortOrder.value = "none";
    }
  };

  const getSortIcon = () => {
    switch (sortOrder.value) {
      case "desc":
        return `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>`;
      case "asc":
        return `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/></svg>`;
      default:
        return `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/></svg>`;
    }
  };

  const getSortLabel = () => {
    switch (sortOrder.value) {
      case "desc":
        return "Mais relevante";
      case "asc":
        return "Menos relevante";
      default:
        return "Relevância";
    }
  };

  return (
    <div class="flex flex-wrap items-center gap-4">
      {/* Filtros de categoria */}
      <div class="flex flex-wrap items-center gap-2 p-1.5 bg-white rounded-2xl border border-neutral-200/60 shadow-sm">
        {allFilters.map((filter) => {
          const config = CATEGORY_CONFIG[filter];
          const isActive = currentFilter.value === filter;
          const count = counts[filter];
          const hasItems = count > 0;
          
          return (
            <button
              key={filter}
              type="button"
              onClick={() => (currentFilter.value = filter)}
              disabled={filter !== "all" && !hasItems}
              class={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                isActive
                  ? `${config.bgActive} text-white shadow-md`
                  : hasItems
                    ? "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                    : "text-neutral-300 cursor-not-allowed"
              }`}
            >
              {config.iconSvg && (
                <span 
                  dangerouslySetInnerHTML={{ __html: config.iconSvg }} 
                  class={!hasItems && !isActive ? "opacity-40" : ""}
                />
              )}
              {config.label}
              <span
                class={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                  isActive
                    ? "bg-white/20 text-white"
                    : hasItems
                      ? "bg-neutral-100 text-neutral-500"
                      : "bg-neutral-50 text-neutral-300"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filtro de ordenação por relevância */}
      <button
        type="button"
        onClick={cycleSortOrder}
        class={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all border ${
          sortOrder.value !== "none"
            ? "bg-amber-500 text-white border-amber-500 shadow-md"
            : "bg-white text-neutral-600 border-neutral-200/60 hover:text-neutral-900 hover:bg-neutral-50"
        }`}
        title="Clique para alternar: Sem filtro → Mais relevante → Menos relevante"
      >
        <span dangerouslySetInnerHTML={{ __html: getSortIcon() }} />
        {getSortLabel()}
      </button>
    </div>
  );
}

