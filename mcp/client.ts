/**
 * Cliente MCP para conectar ao gateway mesh
 * Implementa o protocolo MCP sobre HTTP JSON-RPC
 */

const MCP_GATEWAY_URL =
  "https://mesh-admin.decocms.com/mcp/gateway/gw_m1s2zg_mcV8MxpzEM0rCh";

interface MCPRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

interface MCPResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

interface Tool {
  name: string;
  description?: string;
  inputSchema?: {
    type: string;
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

interface ToolsListResult {
  tools: Tool[];
}

interface ToolCallResult {
  content: Array<{
    type: string;
    text?: string;
    data?: unknown;
  }>;
  isError?: boolean;
}

export interface MCPClientOptions {
  gatewayUrl?: string;
  apiKey?: string;
  bearerToken?: string;
}

export class MCPClient {
  private gatewayUrl: string;
  private apiKey?: string;
  private bearerToken?: string;
  private messageId = 0;

  constructor(options: MCPClientOptions = {}) {
    this.gatewayUrl = options.gatewayUrl ?? MCP_GATEWAY_URL;
    this.apiKey = options.apiKey ?? Deno.env.get("MCP_API_KEY");
    this.bearerToken = options.bearerToken ?? Deno.env.get("MCP_BEARER_TOKEN");
  }

  private generateId(): number {
    return ++this.messageId;
  }

  /**
   * Retorna os headers de autenticação
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.bearerToken) {
      headers["Authorization"] = `Bearer ${this.bearerToken}`;
    }
    if (this.apiKey) {
      headers["X-API-Key"] = this.apiKey;
    }

    return headers;
  }

  /**
   * Processa uma resposta SSE e extrai o resultado JSON-RPC
   */
  private async parseSSEResponse(response: Response): Promise<MCPResponse> {
    const text = await response.text();

    // Parse SSE events
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
      try {
        return JSON.parse(text);
      } catch {
        throw new Error(`Resposta inválida: ${text}`);
      }
    }

    return JSON.parse(data);
  }

  /**
   * Faz uma requisição MCP para o gateway
   */
  private async request<T>(
    method: string,
    params?: Record<string, unknown>,
  ): Promise<T> {
    const request: MCPRequest = {
      jsonrpc: "2.0",
      id: this.generateId(),
      method,
      params,
    };

    const response = await fetch(this.gatewayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Erro HTTP ${response.status}: ${response.statusText}\n${errorText}`,
      );
    }

    const contentType = response.headers.get("content-type") || "";
    let result: MCPResponse;

    if (contentType.includes("text/event-stream")) {
      result = await this.parseSSEResponse(response);
    } else {
      result = await response.json();
    }

    if (result.error) {
      throw new Error(`Erro MCP: ${result.error.message} (${result.error.code})`);
    }

    return result.result as T;
  }

  /**
   * Lista todas as tools disponíveis no gateway
   */
  async listTools(): Promise<Tool[]> {
    const result = await this.request<ToolsListResult>("tools/list");
    return result.tools;
  }

  /**
   * Faz scrape de conteúdo de uma URL usando o workflow n8n
   * @param url URL para fazer scrape
   */
  async scrapeContent(url: string): Promise<ToolCallResult> {
    return await this.callTool("scrape_content", { url });
  }

  /**
   * Chama qualquer tool genérica
   */
  async callTool(
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<ToolCallResult> {
    const result = await this.request<ToolCallResult>("tools/call", {
      name: toolName,
      arguments: args,
    });
    return result;
  }

  /**
   * Inicializa a conexão MCP (handshake)
   */
  async initialize(): Promise<unknown> {
    const result = await this.request("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {},
      },
      clientInfo: {
        name: "deco-news-mcp-client",
        version: "1.0.0",
      },
    });
    return result;
  }
}

// Função helper para uso simples
export async function scrapeContent(
  url: string,
  options?: MCPClientOptions,
): Promise<ToolCallResult> {
  const client = new MCPClient(options);
  await client.initialize();
  return await client.scrapeContent(url);
}

export { MCP_GATEWAY_URL };

