/**
 * Tipos para o sistema de AI Models
 */

export interface AIModel {
  id: number;
  model_name: string;
  rank: number;
  company: string;
  short_overview?: string;
  strengths: string[];
  weaknesses: string[];
  license_type?: string;
  context_window?: string;
  pricing?: {
    input?: string;
    output?: string;
    [key: string]: string | undefined;
  };
  key_benchmarks?: {
    [key: string]: string | number;
  };
  source?: string;
  generated_at?: string;
  ranking_scope?: string;
  notes?: string;
  currency?: string;
  updated_at?: string;
  created_at?: string;
}

export interface AIModelsLoaderResult {
  models: AIModel[];
  loading?: boolean;
  error?: string;
}


