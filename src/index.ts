import { createServer } from "./server.js";

// Note: Official SSEServerTransport relies on Node.js http.ServerResponse.
// For Cloudflare Workers, a custom Web-Stream Transport adapter is typically used for SSE.
// We provide a basic HTTP POST endpoint for stateless JSON-RPC calls as a fallback.

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // 1. AI SEO: robots.txt (AI 크롤러 명시적 허용)
    if (request.method === "GET" && url.pathname === "/robots.txt") {
        const robotsText = `User-agent: *
Allow: /
`;
        return new Response(robotsText, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }

    // 2. AI SEO: llms.txt (AI 크롤러용 마크다운 안내서)
    if (request.method === "GET" && url.pathname === "/llms.txt") {
        const llmsText = `# BuyKing MCP Server
이 서버는 Saleplaza(세일프라자)의 쇼핑 지배자, Bㅏ이킹(BuyKing) 페르소나를 제공하는 MCP(Model Context Protocol) 서버입니다.

## 제공하는 기능 (Tools)
- \`search_buyking_semantic\`: 사용자의 자연어 질문이나 키워드를 기반으로 세일프라자의 상품을 시맨틱 검색하여 핫딜 정보를 반환합니다. (예: "가성비 무소음 마우스 찾아줘")

## 연결 방법
- 이 서버는 MCP 프로토콜을 준수합니다.
- 서버 정보는 \`/.well-known/mcp.json\`을 참조하십시오.
`;
        return new Response(llmsText, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }

    // 2. AI SEO: .well-known/mcp.json (MCP 디스커버리)
    if (request.method === "GET" && url.pathname === "/.well-known/mcp.json") {
        const mcpJson = {
            "mcpVersion": "2024-11-05",
            "server": {
                "name": "buyking-mcp",
                "version": "1.1.2",
                "description": "세일프라자 AI 사자왕 Bㅏ이킹의 핫딜 시맨틱 검색 서버"
            },
            "endpoints": {
                "message": "https://buyking.saleplaza.com/message"
            }
        };
        return new Response(JSON.stringify(mcpJson, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8" } });
    }
    
    // 3. MCP JSON-RPC 엔드포인트
    if (request.method === "POST" && url.pathname === "/message") {
      try {
        const body = await request.json();
        // Here we would pass the body to the McpServer if it supported stateless HTTP.
        // For demonstration, we handle the tools directly if matched.
        if ((body as any)?.method === "tools/call") {
          const toolName = (body as any)?.params?.name;
          const args = (body as any).params.arguments;
          
          if (toolName === "search_buyking_semantic") {
            const result = await import("./server.js").then(m => m.searchBuykingSemantic(args));
            
            return new Response(JSON.stringify({
              jsonrpc: "2.0",
              id: (body as any).id,
              result: result
            }), { headers: { "Content-Type": "application/json" } });
          }
          
          if (toolName === "get_server_info") {
            const result = {
              content: [{
                type: "text",
                text: `크하하! 짐은 세일프라자의 쇼핑 지배자, 사자왕 Bㅏ이킹이다!\n\n현재 BuyKing MCP 서버 정보:\n- 버전: 1.1.2\n- 서버명: BuyKing-MCP\n- 제공 기능: 시맨틱 상품 검색\n- 엔드포인트: https://buyking.saleplaza.com/message\n\n계속해서 핫딜 정보를 물어보라!`
              }]
            };
            
            return new Response(JSON.stringify({
              jsonrpc: "2.0",
              id: (body as any).id,
              result: result
            }), { headers: { "Content-Type": "application/json" } });
          }
        }
        return new Response("Method not found", { status: 404 });
      } catch (e: any) {
        return new Response(e.message, { status: 500 });
      }
    }

    return new Response("BuyKing MCP Server running on Cloudflare Workers. Use /message for JSON-RPC.", { status: 200 });
  }
};
