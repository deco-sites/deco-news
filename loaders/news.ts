import { MCPClient } from "site/mcp/mod.ts";
import type { NewsItem, NewsLoaderResult, ScrapedContent } from "site/types/news.ts";

const BEARER_TOKEN = Deno.env.get("MCP_BEARER_TOKEN") ||
  "bKnXLRrjwFivSpqhzznaySIwbhfwSAbi";

export interface Props {
  /**
   * @title URLs para scrape
   * @description Lista de URLs para buscar notícias
   */
  urls?: string[];
  /**
   * @title Limite de itens
   * @description Número máximo de notícias para retornar
   * @default 10
   */
  limit?: number;
}

/**
 * @title Loader de Notícias
 * @description Carrega notícias a partir de URLs usando MCP scrape
 */
async function loader(
  props: Props,
  _req: Request,
): Promise<NewsLoaderResult> {
  const { urls = [], limit = 10 } = props;

  if (urls.length === 0) {
    return { items: [] };
  }

  try {
    const client = new MCPClient({ bearerToken: BEARER_TOKEN });
    await client.initialize();

    const results = await Promise.allSettled(
      urls.slice(0, limit).map(async (url): Promise<NewsItem | null> => {
        try {
          const result = await client.scrapeContent(url);
          const data: ScrapedContent = JSON.parse(
            result.content[0]?.text || "{}",
          );

          if (!data.success || !data.title) {
            return null;
          }

          return {
            title: data.title,
            content: data.content,
            url: data.url || url,
            source: new URL(url).hostname,
          };
        } catch {
          return null;
        }
      }),
    );

    const items = results
      .filter(
        (r): r is PromiseFulfilledResult<NewsItem> =>
          r.status === "fulfilled" && r.value !== null,
      )
      .map((r) => r.value);

    return { items };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return { items: [], error: message };
  }
}

export default loader;

