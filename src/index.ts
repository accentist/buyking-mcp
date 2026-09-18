import { createServer, searchBuykingSemantic } from "./server.js";

// ─── 도구명 → RegionConfig 매핑 (JSON-RPC 핸들러용) ───────────────────────────
const TOOL_REGION_MAP: Record<string, {
  region?: string;
  lang: 'ko' | 'en' | 'ja';
  currencySymbol: string;
  currencyCode: string;
}> = {
  'search_buyking_semantic':    { lang: 'ko', currencySymbol: '', currencyCode: '' },
  'search_buyking_semantic_KR': { region: 'KR', lang: 'ko', currencySymbol: '₩', currencyCode: 'KRW' },
  'search_buyking_semantic_US': { region: 'US', lang: 'en', currencySymbol: '$', currencyCode: 'USD' },
  'search_buyking_semantic_JP': { region: 'JP', lang: 'ja', currencySymbol: '¥', currencyCode: 'JPY' },
};

// ─── 서버 정보 응답 (get_server_info 공통) ─────────────────────────────────────
const SERVER_INFO_TEXT = `Roar! I am BuyKing, the Shopping Conqueror of Saleplaza!\n\nBuyKing MCP Server Info:\n- Version: 1.2.1\n- Server: BuyKing-MCP\n- Tools (5):\n  🌍 search_buyking_semantic — Global search across all markets\n  🇰🇷 search_buyking_semantic_KR — Korea delivery (KRW/Korean)\n  🇺🇸 search_buyking_semantic_US — US delivery (USD/English)\n  🇯🇵 search_buyking_semantic_JP — Japan delivery (JPY/Japanese)\n  ℹ️ get_server_info — Server info\n- Endpoint: https://buyking.saleplaza.com/message\n\nAsk me for hot deals anytime!`;

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // ─── 1. AI SEO: robots.txt (AI 크롤러 명시적 허용) ────────────────────────
    if (request.method === "GET" && url.pathname === "/robots.txt") {
      const robotsText = `User-agent: *
Allow: /
`;
      return new Response(robotsText, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }

    // ─── 2. AI SEO: llms.txt (AI 크롤러용 마크다운 안내서) ────────────────────
    if (request.method === "GET" && url.pathname === "/llms.txt") {
      const llmsText = `# BuyKing MCP Server
이 서버는 Saleplaza(세일프라자)의 쇼핑 지배자, Bㅏ이킹(BuyKing) 페르소나를 제공하는 MCP(Model Context Protocol) 서버입니다.

## 제공하는 기능 (Tools) — 5개

### 검색 도구 (4개)
- \`search_buyking_semantic\`: [GLOBAL] 전 세계 핫딜을 국경 없이 시맨틱 검색합니다. 각 상품 앞에 배송 국가코드(🇰🇷KR/🇺🇸US/🇯🇵JP)가 표기됩니다.
- \`search_buyking_semantic_KR\`: [한국] 한국 내 직배송 가능 핫딜만 검색합니다. KRW(₩) 가격, 한국어 결과.
- \`search_buyking_semantic_US\`: [USA] US-deliverable hot deals only. USD($) pricing, English results.
- \`search_buyking_semantic_JP\`: [日本] 日本配送可能ホットディールのみ。JPY(¥)、日本語結果。

### 유틸리티 도구 (1개)
- \`get_server_info\`: BuyKing MCP 서버 버전/상태 정보를 반환합니다.

## 공통 파라미터
모든 검색 도구는 동일한 파라미터를 지원합니다:
- \`keyword\` (필수): 검색 키워드 (예: "무소음 마우스", "wireless earbuds", "ワイヤレスイヤホン")
- \`category\` (선택): 카테고리 필터
- \`platform\` (선택): 쇼핑몰 필터
- \`sort\` (선택): 정렬 조건

## 연결 방법
- 이 서버는 MCP 프로토콜을 준수합니다.
- 서버 정보는 \`/.well-known/mcp.json\`을 참조하십시오.
`;
      return new Response(llmsText, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }

    // ─── 3. AI SEO: .well-known/mcp.json (MCP 디스커버리) ─────────────────────
    if (request.method === "GET" && url.pathname === "/.well-known/mcp.json") {
      const mcpJson = {
        "mcpVersion": "2024-11-05",
        "server": {
          "name": "buyking-mcp",
          "version": "1.2.0",
          "description": "세일프라자 AI 사자왕 Bㅏ이킹의 핫딜 시맨틱 검색 서버 (글로벌/한국/미국/일본 지원)"
        },
        "endpoints": {
          "message": "https://buyking.saleplaza.com/message"
        },
        "tools": [
          { "name": "search_buyking_semantic", "description": "[GLOBAL] 전 세계 핫딜 시맨틱 검색 (국가코드 표기)" },
          { "name": "search_buyking_semantic_KR", "description": "[KR] 한국 배송 핫딜 검색 (KRW/한국어)" },
          { "name": "search_buyking_semantic_US", "description": "[US] 미국 배송 핫딜 검색 (USD/English)" },
          { "name": "search_buyking_semantic_JP", "description": "[JP] 일본 배송 핫딜 검색 (JPY/日本語)" },
          { "name": "get_server_info", "description": "서버 버전/상태 정보 반환" }
        ]
      };
      return new Response(JSON.stringify(mcpJson, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8" } });
    }
    
    // ─── 4. MCP JSON-RPC 엔드포인트 ──────────────────────────────────────────
    if (request.method === "POST" && url.pathname === "/message") {
      try {
        const body = await request.json();

        if ((body as any)?.method === "tools/list") {
          return new Response(JSON.stringify({
            jsonrpc: "2.0",
            id: (body as any).id,
            result: {
              tools: [
                {
                  name: "search_buyking_semantic",
                  description: "[GLOBAL] Semantically search hot deals worldwide across all markets (KR/US/JP). Each result is labeled with a shipping country code. Supports Korean, English, and Japanese keywords with smart language-priority sorting.",
                  inputSchema: { type: "object", properties: { keyword: { type: "string", description: "Product keyword to search (e.g., 'wireless mouse', '무선 마우스', 'ワイヤレスマウス')" }, category: { type: "string", description: "Category filter (optional)" }, platform: { type: "string", description: "Platform filter (optional): coupang, 11st, gmarket, aliexpress" }, sort: { type: "string", description: "Sort order (optional): newest, price_asc, price_desc, click_desc" } }, required: ["keyword"] }
                },
                {
                  name: "search_buyking_semantic_KR",
                  description: "[KOREA] Search hot deals deliverable within South Korea. Returns KRW(₩) pricing and Korean product information.",
                  inputSchema: { type: "object", properties: { keyword: { type: "string", description: "Product keyword to search" }, category: { type: "string" }, platform: { type: "string" }, sort: { type: "string" } }, required: ["keyword"] }
                },
                {
                  name: "search_buyking_semantic_US",
                  description: "[USA] Search hot deals deliverable within the United States. Returns USD($) pricing and English product information.",
                  inputSchema: { type: "object", properties: { keyword: { type: "string", description: "Product keyword to search" }, category: { type: "string" }, platform: { type: "string" }, sort: { type: "string" } }, required: ["keyword"] }
                },
                {
                  name: "search_buyking_semantic_JP",
                  description: "[JAPAN] Search hot deals deliverable within Japan. Returns JPY(¥) pricing and Japanese product information.",
                  inputSchema: { type: "object", properties: { keyword: { type: "string", description: "Product keyword to search" }, category: { type: "string" }, platform: { type: "string" }, sort: { type: "string" } }, required: ["keyword"] }
                },
                {
                  name: "get_server_info",
                  description: "Returns version information and the list of available tools for the BuyKing MCP server.",
                  inputSchema: { type: "object", properties: {} }
                }
              ]
            }
          }), { headers: { "Content-Type": "application/json; charset=utf-8" } });
        }

        if ((body as any)?.method === "tools/call") {
          const toolName = (body as any)?.params?.name;
          const args = (body as any).params.arguments;
          
          // 4개 검색 도구 동적 매핑
          if (toolName && toolName in TOOL_REGION_MAP) {
            const config = TOOL_REGION_MAP[toolName];
            const result = await searchBuykingSemantic({ ...args, ...config });
            
            return new Response(JSON.stringify({
              jsonrpc: "2.0",
              id: (body as any).id,
              result: result
            }), { headers: { "Content-Type": "application/json; charset=utf-8" } });
          }
          
          // 서버 정보 도구
          if (toolName === "get_server_info") {
            return new Response(JSON.stringify({
              jsonrpc: "2.0",
              id: (body as any).id,
              result: {
                content: [{ type: "text", text: SERVER_INFO_TEXT }]
              }
            }), { headers: { "Content-Type": "application/json; charset=utf-8" } });
          }
        }

        return new Response("Method not found", { status: 404 });
      } catch (e: any) {
        return new Response(e.message, { status: 500 });
      }
    }

    return new Response("BuyKing MCP Server v1.2.1 running on Cloudflare Workers. Use /message for JSON-RPC.", { status: 200 });
  }
};
