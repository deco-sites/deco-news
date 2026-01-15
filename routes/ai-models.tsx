import { defineRoute } from "$fresh/server.ts";
import AIModels from "../sections/AIModels.tsx";
import aiModelsLoader from "../loaders/aiModels.ts";
import type { AIModel } from "../types/aiModels.ts";

export default defineRoute(async (req, _ctx) => {
  let models: AIModel[] = [];
  let error: string | undefined;

  try {
    // Usa o loader para buscar modelos do banco de dados
    models = await aiModelsLoader({}, req);
  } catch (e) {
    error = e instanceof Error ? e.message : "Error loading AI models";
    console.error("❌ [Route] Erro:", e);
  }

  return (
    <AIModels
      title="Top AI Models"
      subtitle="Compare the most powerful AI models by performance, pricing, and capabilities."
      models={models}
      error={error}
    />
  );
});


