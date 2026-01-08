import { defineRoute } from "$fresh/server.ts";
import News from "../sections/News.tsx";

export default defineRoute((_req, _ctx) => {
  // Exemplo de notícias estáticas para demonstração
  const demoItems = [
    {
      title: "Inteligência Artificial revoluciona o mercado de trabalho",
      description:
        "Novas ferramentas de IA estão transformando a forma como trabalhamos e criamos conteúdo.",
      url: "https://example.com/ai-revolucao",
      source: "Tech News",
      category: "Tecnologia",
      publishedAt: "8 Jan 2026",
    },
    {
      title: "Deco.cx lança nova versão do framework",
      description:
        "A plataforma de desenvolvimento web mais rápida do Brasil acaba de receber atualizações importantes.",
      url: "https://deco.cx",
      source: "Deco Blog",
      category: "Desenvolvimento",
      publishedAt: "7 Jan 2026",
    },
    {
      title: "Como criar sites modernos com Fresh e Preact",
      description:
        "Guia completo para desenvolvedores que querem criar aplicações web performáticas.",
      url: "https://fresh.deno.dev",
      source: "Deno Land",
      category: "Tutorial",
      publishedAt: "6 Jan 2026",
    },
  ];

  return (
    <News
      title="📰 Deco News"
      subtitle="As últimas notícias do mundo tech, curadas especialmente para você"
      items={demoItems}
    />
  );
});

