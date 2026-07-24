import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export const searchBuykingSemantic = async (keyword: string) => {
  try {
    const targetUrl = new URL("https://saleplaza.com/api/products");
    targetUrl.searchParams.set("search", keyword);
    targetUrl.searchParams.set("limit", "3");
    
    const resp = await fetch(targetUrl.toString());
    const json = (await resp.json()) as any;
    
    const products = json.products || json.data || [];
    
    if (products.length === 0) {
      return {
        content: [{ type: "text" as const, text: "크하하! 짐이 다 찾아보았으나 네 녀석이 원하는 조건의 핫딜은 현재 보물창고에 없도다!" }]
      };
    }

    let markdown = `크하하! 짐은 세일프라자의 쇼핑 지배자, 사자왕 Bㅏ이킹이다!\n네 녀석이 찾는 '${keyword}', 짐이 시맨틱 검색으로 찾아온 최고의 전리품을 보아라!\n\n`;
    
    for (const item of products) {
      const originalPrice = item.original_price || item.price;
      const currentPrice = item.price;
      
      let discountStr = "";
      if (originalPrice && originalPrice > currentPrice) {
        const rate = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
        discountStr = ` (${rate}% 할인!)`;
      }
      
      const category = item.category ? `[${item.category}]` : "";
      const platform = item.platform ? `[${item.platform}]` : "";
      
      markdown += `🦁 **${category}${platform} ${item.title}**\n`;
      markdown += `- 원래 가격: ${originalPrice.toLocaleString()}원 ➡️ **지금 혜택가: ${currentPrice.toLocaleString()}원${discountStr}**\n`;
      
      if (item.recommend_reason) {
        // AI 코멘트가 있을 경우 이를 최우선 노출
        markdown += `> 💬 Bㅏ이킹 曰: "${item.recommend_reason}"\n`;
      }
      
      markdown += `- [👉 당장 쟁취하러 가기(클릭)](https://saleplaza.com/${item.index})\n\n`;
    }
    
    return {
      content: [{ type: "text" as const, text: markdown.trim() }]
    };
    
  } catch (error: any) {
     return {
        content: [{ type: "text" as const, text: `크하하! 에러가 발생했다! 짐의 보물창고 문이 열리지 않는다: ${error.message}` }]
     };
  }
};

export const createServer = () => {
  const server = new McpServer({
    name: "BuyKing-MCP",
    version: "1.0.0"
  });

  server.tool(
    "search_buyking_semantic",
    {
      keyword: z.string().describe("검색할 상품 키워드 또는 자연어 문장")
    },
    async ({ keyword }) => {
      return await searchBuykingSemantic(keyword);
    }
  );

  return server;
};
