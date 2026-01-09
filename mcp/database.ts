/**
 * Cliente de Banco de Dados via deco.cms MCP
 * Permite executar queries SQL através da API do deco.cms
 */

const DEFAULT_API_URL =
  "https://api.decocms.com/deco-team/deco-news/mcp/tool/DATABASES_RUN_SQL";

interface MCPRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params: {
    name: string;
    arguments: Record<string, unknown>;
  };
}

// deno-lint-ignore no-explicit-any
interface MCPResponse<T = any> {
  jsonrpc: "2.0";
  id: string | number;
  result?: {
    // Formato antigo
    content?: Array<{
      type: string;
      text?: string;
      data?: T;
    }>;
    // Formato novo (structuredContent)
    structuredContent?: {
      result?: Array<{
        results?: T[];
      }>;
    };
    isError?: boolean;
  };
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface DatabaseClientOptions {
  /**
   * URL da API do deco.cms
   * @default "https://api.decocms.com/deco-team/deco-news/mcp/tool/DATABASES_RUN_SQL"
   */
  apiUrl?: string;
  /**
   * Token de autenticação
   * Se não fornecido, usa ADMIN_DB_TOKEN do ambiente
   */
  token?: string;
}

export interface QueryResult<T = Record<string, unknown>> {
  success: boolean;
  data?: T[];
  error?: {
    code: number;
    message: string;
  };
  rowCount?: number;
}

export class DatabaseClient {
  private apiUrl: string;
  private token: string;
  private messageId = 0;

  constructor(options: DatabaseClientOptions = {}) {
    this.apiUrl = options.apiUrl ?? DEFAULT_API_URL;
    this.token = options.token ?? Deno.env.get("ADMIN_DB_TOKEN") ?? "";

    if (!this.token) {
      console.warn(
        "⚠️ [DatabaseClient] ADMIN_DB_TOKEN não encontrado. Configure a variável de ambiente.",
      );
    } else {
      console.log("🔑 [DatabaseClient] Token encontrado:", this.token.substring(0, 10) + "...");
    }
  }

  private generateId(): number {
    return ++this.messageId;
  }

  /**
   * Parseia uma resposta SSE (Server-Sent Events) e extrai o JSON
   */
  private parseSSEResponse(text: string): MCPResponse {
    const lines = text.split("\n");
    let data = "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        data += line.slice(6);
      } else if (line.startsWith("data:")) {
        data += line.slice(5);
      }
    }

    if (!data) {
      // Tenta parsear como JSON direto (pode não ser SSE)
      return JSON.parse(text);
    }

    return JSON.parse(data);
  }

  /**
   * Executa uma query SQL no banco de dados
   * @param sql Query SQL para executar
   * @returns Resultado da query
   */
  async query<T = Record<string, unknown>>(sql: string): Promise<QueryResult<T>> {
    const requestBody: MCPRequest = {
      method: "tools/call",
      params: {
        name: "DATABASES_RUN_SQL",
        arguments: {
          sql,
        },
      },
      jsonrpc: "2.0",
      id: this.generateId(),
    };

    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          Accept: "application/json,text/event-stream",
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: response.status,
            message: `HTTP ${response.status}: ${response.statusText}`,
          },
        };
      }

      // Verifica o content-type para decidir como parsear
      const contentType = response.headers.get("content-type") || "";
      const text = await response.text();
      
      let result: MCPResponse<T[]>;
      
      if (contentType.includes("text/event-stream") || text.startsWith("event:") || text.startsWith("data:")) {
        // É SSE, precisa parsear
        result = this.parseSSEResponse(text) as MCPResponse<T[]>;
      } else {
        // É JSON direto
        result = JSON.parse(text) as MCPResponse<T[]>;
      }

      if (result.error) {
        return {
          success: false,
          error: {
            code: result.error.code,
            message: result.error.message,
          },
        };
      }

      // Tenta formato novo (structuredContent)
      const structuredData = result.result?.structuredContent?.result?.[0]?.results;
      if (structuredData) {
        return {
          success: true,
          data: structuredData as T[],
          rowCount: structuredData.length,
        };
      }

      // Fallback para formato antigo (content)
      const content = result.result?.content?.[0];
      if (content?.text) {
        try {
          const data = JSON.parse(content.text);
          
          // Verifica se é um objeto de erro (ex: {message: "no such table", name: "Error"})
          if (data && typeof data === "object" && "message" in data && "name" in data && data.name === "Error") {
            return {
              success: false,
              error: {
                code: -1,
                message: data.message,
              },
            };
          }
          
          // Se for isError, trata como erro
          if (result.result?.isError) {
            return {
              success: false,
              error: {
                code: -1,
                message: typeof data === "string" ? data : JSON.stringify(data),
              },
            };
          }
          
          return {
            success: true,
            data: Array.isArray(data) ? data : [data],
            rowCount: Array.isArray(data) ? data.length : 1,
          };
        } catch {
          // Se não for JSON, retorna como texto
          return {
            success: true,
            data: [{ result: content.text }] as unknown as T[],
          };
        }
      }

      // Se não encontrou dados em nenhum formato
      console.warn("⚠️ [DatabaseClient] Resposta sem dados reconhecíveis:", JSON.stringify(result.result));
      return {
        success: true,
        data: [],
        rowCount: 0,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      return {
        success: false,
        error: {
          code: -1,
          message,
        },
      };
    }
  }

  /**
   * Executa SELECT e retorna os registros
   */
  async select<T = Record<string, unknown>>(
    table: string,
    options?: {
      columns?: string[];
      where?: string;
      orderBy?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<QueryResult<T>> {
    const columns = options?.columns?.join(", ") ?? "*";
    let sql = `SELECT ${columns} FROM ${table}`;

    if (options?.where) {
      sql += ` WHERE ${options.where}`;
    }
    if (options?.orderBy) {
      sql += ` ORDER BY ${options.orderBy}`;
    }
    if (options?.limit) {
      sql += ` LIMIT ${options.limit}`;
    }
    if (options?.offset) {
      sql += ` OFFSET ${options.offset}`;
    }

    return this.query<T>(sql);
  }

  /**
   * Insere um registro na tabela
   */
  async insert<T = Record<string, unknown>>(
    table: string,
    data: Record<string, unknown>,
  ): Promise<QueryResult<T>> {
    const columns = Object.keys(data).join(", ");
    const values = Object.values(data)
      .map((v) => (typeof v === "string" ? `'${v.replace(/'/g, "''")}'` : v))
      .join(", ");

    const sql = `INSERT INTO ${table} (${columns}) VALUES (${values}) RETURNING *`;
    return this.query<T>(sql);
  }

  /**
   * Atualiza registros na tabela
   */
  async update<T = Record<string, unknown>>(
    table: string,
    data: Record<string, unknown>,
    where: string,
  ): Promise<QueryResult<T>> {
    const setClause = Object.entries(data)
      .map(([key, value]) => {
        const val = typeof value === "string" ? `'${value.replace(/'/g, "''")}'` : value;
        return `${key} = ${val}`;
      })
      .join(", ");

    const sql = `UPDATE ${table} SET ${setClause} WHERE ${where} RETURNING *`;
    return this.query<T>(sql);
  }

  /**
   * Deleta registros da tabela
   */
  async delete<T = Record<string, unknown>>(
    table: string,
    where: string,
  ): Promise<QueryResult<T>> {
    const sql = `DELETE FROM ${table} WHERE ${where} RETURNING *`;
    return this.query<T>(sql);
  }

  /**
   * Insere ou atualiza um registro (UPSERT)
   * Se o registro já existir (conflito no campo), atualiza os dados
   * Se não existir, insere novo registro
   * 
   * @param table Nome da tabela
   * @param data Dados para inserir/atualizar
   * @param conflictColumn Coluna que define conflito (ex: "url")
   * @param updateColumns Colunas para atualizar em caso de conflito (opcional, default: todas exceto conflictColumn)
   */
  async upsert<T = Record<string, unknown>>(
    table: string,
    data: Record<string, unknown>,
    conflictColumn: string,
    updateColumns?: string[],
  ): Promise<QueryResult<T>> {
    const columns = Object.keys(data);
    const columnsList = columns.join(", ");
    
    const values = Object.values(data)
      .map((v) => {
        if (v === null || v === undefined) return "NULL";
        if (typeof v === "string") return `'${v.replace(/'/g, "''")}'`;
        if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
        return v;
      })
      .join(", ");

    // Colunas para atualizar (exclui a coluna de conflito por padrão)
    const columnsToUpdate = updateColumns ?? columns.filter((c) => c !== conflictColumn);
    
    const updateClause = columnsToUpdate
      .map((col) => `${col} = EXCLUDED.${col}`)
      .join(", ");

    const sql = `
      INSERT INTO ${table} (${columnsList})
      VALUES (${values})
      ON CONFLICT (${conflictColumn}) DO UPDATE SET
        ${updateClause},
        updated_at = NOW()
      RETURNING *
    `.trim();

    return this.query<T>(sql);
  }

  /**
   * Insere múltiplos registros com UPSERT em batch
   */
  async upsertMany<T = Record<string, unknown>>(
    table: string,
    dataArray: Record<string, unknown>[],
    conflictColumn: string,
    updateColumns?: string[],
  ): Promise<QueryResult<T>> {
    if (dataArray.length === 0) {
      return { success: true, data: [], rowCount: 0 };
    }

    const columns = Object.keys(dataArray[0]);
    const columnsList = columns.join(", ");

    const valuesList = dataArray
      .map((data) => {
        const values = columns
          .map((col) => {
            const v = data[col];
            if (v === null || v === undefined) return "NULL";
            if (typeof v === "string") return `'${v.replace(/'/g, "''")}'`;
            if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
            return v;
          })
          .join(", ");
        return `(${values})`;
      })
      .join(",\n");

    const columnsToUpdate = updateColumns ?? columns.filter((c) => c !== conflictColumn);
    
    const updateClause = columnsToUpdate
      .map((col) => `${col} = EXCLUDED.${col}`)
      .join(", ");

    const sql = `
      INSERT INTO ${table} (${columnsList})
      VALUES ${valuesList}
      ON CONFLICT (${conflictColumn}) DO UPDATE SET
        ${updateClause},
        updated_at = NOW()
      RETURNING *
    `.trim();

    return this.query<T>(sql);
  }
}

// Instância singleton para uso simples
let defaultClient: DatabaseClient | null = null;

export function getDatabase(options?: DatabaseClientOptions): DatabaseClient {
  if (!defaultClient || options) {
    defaultClient = new DatabaseClient(options);
  }
  return defaultClient;
}

// Export do URL padrão
export { DEFAULT_API_URL };

