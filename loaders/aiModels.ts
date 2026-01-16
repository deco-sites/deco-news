import { getDatabase } from "site/mcp/mod.ts";
import type { AIModel } from "site/types/aiModels.ts";

export interface Props {
  /**
   * @title Limite de modelos
   * @description Número máximo de modelos para retornar (0 = sem limite)
   * @default 0
   */
  limit?: number;
}

// Tipo do modelo no banco de dados
interface AIModelDB {
  id: number;
  model_name: string;
  rank: number;
  company: string;
  short_overview?: string;
  strengths?: string;
  weaknesses?: string;
  license_type?: string;
  context_window?: string;
  pricing?: string;
  key_benchmarks?: string;
  source?: string;
  generated_at?: string;
  ranking_scope?: string;
  notes?: string;
  currency?: string;
  updated_at?: string;
  created_at?: string;
}

/**
 * Parseia JSON de forma segura, retornando um valor padrão em caso de erro
 */
function safeJsonParse<T>(value: string | undefined | null, defaultValue: T): T {
  if (!value) return defaultValue;
  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Converte registro do banco para AIModel
 */
function toAIModel(model: AIModelDB): AIModel {
  return {
    id: model.id,
    model_name: model.model_name,
    rank: model.rank,
    company: model.company,
    short_overview: model.short_overview,
    strengths: safeJsonParse<string[]>(model.strengths, []),
    weaknesses: safeJsonParse<string[]>(model.weaknesses, []),
    license_type: model.license_type,
    context_window: model.context_window,
    pricing: safeJsonParse<Record<string, string>>(model.pricing, {}),
    key_benchmarks: safeJsonParse<Record<string, string | number>>(model.key_benchmarks, {}),
    source: model.source,
    generated_at: model.generated_at,
    ranking_scope: model.ranking_scope,
    notes: model.notes,
    currency: model.currency,
    updated_at: model.updated_at,
    created_at: model.created_at,
  };
}

/**
 * @title Loader de AI Models
 * @description Carrega os trending AI models do banco de dados
 */
async function loader(
  props: Props,
  _req: Request,
): Promise<AIModel[]> {
  const { limit = 0 } = props;

  try {
    const db = getDatabase();
    
    const hasLimit = limit > 0;
    
    const result = await db.query<AIModelDB>(`
      SELECT 
        id,
        model_name,
        rank,
        company,
        short_overview,
        strengths,
        weaknesses,
        license_type,
        context_window,
        pricing,
        key_benchmarks,
        source,
        generated_at,
        ranking_scope,
        notes,
        currency,
        updated_at,
        created_at
      FROM top_ai_models
      ORDER BY rank ASC
      ${hasLimit ? `LIMIT ${limit}` : ''}
    `);

    if (!result.success) {
      console.error("❌ [AI Models Loader] Erro ao buscar modelos:", result.error?.message);
      return [];
    }

    const models = (result.data ?? []).map(toAIModel);
    
    console.log(`✅ [AI Models Loader] ${models.length} modelos carregados`);
    return models;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("❌ [AI Models Loader] Erro:", message);
    return [];
  }
}

export default loader;


