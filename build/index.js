"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_js_1 = require("./server.js");
// ─── 도구명 → RegionConfig 매핑 (JSON-RPC 핸들러용) ───────────────────────────
const TOOL_REGION_MAP = {
    'search_buyking_semantic': { lang: 'ko', currencySymbol: '', currencyCode: '' },
    'search_buyking_semantic_KR': { region: 'KR', lang: 'ko', currencySymbol: '₩', currencyCode: 'KRW' },
    'search_buyking_semantic_US': { region: 'US', lang: 'en', currencySymbol: '$', currencyCode: 'USD' },
    'search_buyking_semantic_JP': { region: 'JP', lang: 'ja', currencySymbol: '¥', currencyCode: 'JPY' },
};
// ─── 서버 정보 응답 (get_server_info 공통) ─────────────────────────────────────
const SERVER_INFO_TEXT = `크하하! 짐은 세일프라자의 쇼핑 지배자, 사자왕 Bㅏ이킹이다!\n\n현재 BuyKing MCP 서버 정보:\n- 버전: 1.2.0\n- 서버명: BuyKing-MCP\n- 제공 도구 (5개):\n  🌍 search_buyking_semantic — GLOBAL 전체 검색 (국가코드 표기)\n  🇰🇷 search_buyking_semantic_KR — 한국 배송 (KRW/한국어)\n  🇺🇸 search_buyking_semantic_US — 미국 배송 (USD/English)\n  🇯🇵 search_buyking_semantic_JP — 일본 배송 (JPY/日本語)\n  ℹ️ get_server_info — 서버 정보\n- 엔드포인트: https://buyking.saleplaza.com/message\n\n계속해서 핫딜 정보를 물어보라!`;
exports.default = {
    async fetch(request, env, ctx) {
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
                if (body?.method === "tools/call") {
                    const toolName = body?.params?.name;
                    const args = body.params.arguments;
                    // 4개 검색 도구 동적 매핑
                    if (toolName && toolName in TOOL_REGION_MAP) {
                        const config = TOOL_REGION_MAP[toolName];
                        const result = await (0, server_js_1.searchBuykingSemantic)({ ...args, ...config });
                        return new Response(JSON.stringify({
                            jsonrpc: "2.0",
                            id: body.id,
                            result: result
                        }), { headers: { "Content-Type": "application/json" } });
                    }
                    // 서버 정보 도구
                    if (toolName === "get_server_info") {
                        return new Response(JSON.stringify({
                            jsonrpc: "2.0",
                            id: body.id,
                            result: {
                                content: [{ type: "text", text: SERVER_INFO_TEXT }]
                            }
                        }), { headers: { "Content-Type": "application/json" } });
                    }
                }
                return new Response("Method not found", { status: 404 });
            }
            catch (e) {
                return new Response(e.message, { status: 500 });
            }
        }
        return new Response("BuyKing MCP Server v1.2.0 running on Cloudflare Workers. Use /message for JSON-RPC.", { status: 200 });
    }
};
