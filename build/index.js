"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpRateLimiter = void 0;
const ip_rate_limit_js_1 = require("./ip-rate-limit.js");
const server_js_1 = require("./server.js");
const ip_rate_limiter_js_1 = require("./ip-rate-limiter.js");
Object.defineProperty(exports, "IpRateLimiter", { enumerable: true, get: function () { return ip_rate_limiter_js_1.IpRateLimiter; } });
const PRODUCT_TOOLS = new Set([
    "search_buyking_semantic",
    "search_buyking_semantic_KR",
    "search_buyking_semantic_US",
    "search_buyking_semantic_JP",
    "result_detail_GLOBAL",
]);
function rateLimitResponse(id, decision) {
    const message = decision.scope === "day"
        ? `크하하! 이 IP는 하루에 상품 조회 ${ip_rate_limit_js_1.DAILY_LIMIT}번까지만 할 수 있다. 한국시간 자정 이후에 다시 오라.`
        : "크하하! 이 IP는 1분에 30번까지만 호출할 수 있다. 잠시 후 다시 오라.";
    return new Response(JSON.stringify({
        jsonrpc: "2.0",
        id: id ?? null,
        error: { code: -32029, message },
    }), {
        status: 429,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Retry-After": String(decision.retryAfter),
        },
    });
}
async function enforceRateLimit(request, env, countDaily, id) {
    const ns = env?.RATE_LIMITER;
    if (!ns)
        return null;
    const ip = request.headers.get("CF-Connecting-IP")?.trim() || "unknown";
    const stub = ns.get(ns.idFromName(ip));
    const decision = await stub.consume(countDaily);
    if (decision.ok)
        return null;
    return rateLimitResponse(id, decision);
}
// ─── 도구명 → RegionConfig 매핑 (JSON-RPC 핸들러용) ───────────────────────────
const TOOL_REGION_MAP = {
    'search_buyking_semantic': { lang: 'ko', currencySymbol: '', currencyCode: '' },
    'search_buyking_semantic_KR': { region: 'KR', lang: 'ko', currencySymbol: '₩', currencyCode: 'KRW' },
    'search_buyking_semantic_US': { region: 'US', lang: 'en', currencySymbol: '$', currencyCode: 'USD' },
    'search_buyking_semantic_JP': { region: 'JP', lang: 'ja', currencySymbol: '¥', currencyCode: 'JPY' },
};
// ─── 서버 정보 응답 (get_server_info 공통) ─────────────────────────────────────
const SERVER_INFO_TEXT = `Roar! I am BuyKing, the Shopping Conqueror of Saleplaza!\n\nBuyKing MCP Server Info:\n- Version: 1.2.5\n- Server: BuyKing-MCP\n- Tools (6):\n  🌍 search_buyking_semantic — Global search across all markets\n  🇰🇷 search_buyking_semantic_KR — Korea delivery (KRW/Korean)\n  🇺🇸 search_buyking_semantic_US — US delivery (USD/English)\n  🇯🇵 search_buyking_semantic_JP — Japan delivery (JPY/Japanese)\n  🔎 result_detail_GLOBAL — Product detail by ID (price history)\n  ℹ️ get_server_info — Server info\n- Endpoint: https://buyking.saleplaza.com/message\n\nAsk me for hot deals anytime!`;
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

## 제공하는 기능 (Tools) — 6개

### 검색 도구 (4개)
- \`search_buyking_semantic\`: [GLOBAL] 전 세계 핫딜을 국경 없이 시맨틱 검색합니다. 각 상품 앞에 배송 국가코드(🇰🇷KR/🇺🇸US/🇯🇵JP)가 표기됩니다.
- \`search_buyking_semantic_KR\`: [한국] 한국 내 직배송 가능 핫딜만 검색합니다. KRW(₩) 가격, 한국어 결과.
- \`search_buyking_semantic_US\`: [USA] US-deliverable hot deals only. USD($) pricing, English results.
- \`search_buyking_semantic_JP\`: [日本] 日本配送可能ホットディールのみ。JPY(¥)、日本語結果。

### 상세 도구 (1개)
- \`result_detail_GLOBAL\`: 검색 결과의 상품 ID로 단건 상세와 가격 히스토리를 조회합니다. 국가 구분은 currency(KRW/USD/JPY) 기준입니다.

### 유틸리티 도구 (1개)
- \`get_server_info\`: BuyKing MCP 서버 버전/상태 정보를 반환합니다.

## 공통 파라미터
모든 검색 도구는 동일한 파라미터를 지원합니다:
- \`keyword\` (필수): 검색 키워드 (예: "무소음 마우스", "wireless earbuds", "ワイヤレスイヤホン")
- \`category\` (선택): 카테고리 필터
- \`platform\` (선택): 쇼핑몰 필터
- \`sort\` (선택): 정렬 조건

\`result_detail_GLOBAL\` 파라미터:
- \`id\` (필수): 검색 결과의 상품 ID

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
                    "version": "1.2.5",
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
                    { "name": "result_detail_GLOBAL", "description": "상품 ID 단건 상세와 가격 히스토리. 국가는 currency 기준" },
                    { "name": "get_server_info", "description": "서버 버전/상태 정보 반환" }
                ]
            };
            return new Response(JSON.stringify(mcpJson, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8" } });
        }
        // ─── 4. MCP JSON-RPC 엔드포인트 ──────────────────────────────────────────
        if (request.method === "POST" && url.pathname === "/message") {
            let body;
            try {
                body = await request.json();
            }
            catch (e) {
                const blocked = await enforceRateLimit(request, env, false, null);
                if (blocked)
                    return blocked;
                return new Response(e.message, { status: 500 });
            }
            const toolName = body?.method === "tools/call" ? body?.params?.name : undefined;
            const countDaily = typeof toolName === "string" && PRODUCT_TOOLS.has(toolName);
            const blocked = await enforceRateLimit(request, env, countDaily, body?.id);
            if (blocked)
                return blocked;
            try {
                if (body?.method === "tools/list") {
                    return new Response(JSON.stringify({
                        jsonrpc: "2.0",
                        id: body.id,
                        result: {
                            tools: [
                                {
                                    name: "search_buyking_semantic",
                                    description: "[GLOBAL] Semantically search hot deals worldwide across all markets (KR/US/JP). Each result is labeled with a shipping country code. Supports Korean, English, and Japanese keywords with smart language-priority sorting. To inspect one product, call result_detail_GLOBAL with its 상품 ID.",
                                    inputSchema: { type: "object", properties: { keyword: { type: "string", description: "Product keyword to search (e.g., 'wireless mouse', '무선 마우스', 'ワイヤレスマウス')" }, category: { type: "string", description: "Category filter (optional)" }, platform: { type: "string", description: "Platform filter (optional): coupang, 11st, gmarket, aliexpress" }, sort: { type: "string", description: "Sort order (optional): newest, price_asc, price_desc, click_desc" } }, required: ["keyword"] }
                                },
                                {
                                    name: "search_buyking_semantic_KR",
                                    description: "[KOREA] Search hot deals deliverable within South Korea. Returns KRW(₩) pricing and Korean product information. To inspect one product, call result_detail_GLOBAL with its 상품 ID.",
                                    inputSchema: { type: "object", properties: { keyword: { type: "string", description: "Product keyword to search" }, category: { type: "string" }, platform: { type: "string" }, sort: { type: "string" } }, required: ["keyword"] }
                                },
                                {
                                    name: "search_buyking_semantic_US",
                                    description: "[USA] Search hot deals deliverable within the United States. Returns USD($) pricing and English product information. To inspect one product, call result_detail_GLOBAL with its 상품 ID.",
                                    inputSchema: { type: "object", properties: { keyword: { type: "string", description: "Product keyword to search" }, category: { type: "string" }, platform: { type: "string" }, sort: { type: "string" } }, required: ["keyword"] }
                                },
                                {
                                    name: "search_buyking_semantic_JP",
                                    description: "[JAPAN] Search hot deals deliverable within Japan. Returns JPY(¥) pricing and Japanese product information. To inspect one product, call result_detail_GLOBAL with its 상품 ID.",
                                    inputSchema: { type: "object", properties: { keyword: { type: "string", description: "Product keyword to search" }, category: { type: "string" }, platform: { type: "string" }, sort: { type: "string" } }, required: ["keyword"] }
                                },
                                {
                                    name: "result_detail_GLOBAL",
                                    description: "Fetch one product by the 상품 ID from a previous search. Returns price history, Saleplaza link, and the store buy link. Country is determined only by currency (KRW Korea, USD United States, JPY Japan). Hidden products are answered as not found.",
                                    inputSchema: { type: "object", properties: { id: { type: "string", description: "Product ID from the previous search result, e.g. 25023" } }, required: ["id"] }
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
                        }), { headers: { "Content-Type": "application/json; charset=utf-8" } });
                    }
                    if (toolName === "result_detail_GLOBAL") {
                        const result = await (0, server_js_1.getBuykingProductDetail)({ id: args?.id });
                        return new Response(JSON.stringify({
                            jsonrpc: "2.0",
                            id: body.id,
                            result: result
                        }), { headers: { "Content-Type": "application/json; charset=utf-8" } });
                    }
                    // 서버 정보 도구
                    if (toolName === "get_server_info") {
                        return new Response(JSON.stringify({
                            jsonrpc: "2.0",
                            id: body.id,
                            result: {
                                content: [{ type: "text", text: SERVER_INFO_TEXT }]
                            }
                        }), { headers: { "Content-Type": "application/json; charset=utf-8" } });
                    }
                }
                return new Response("Method not found", { status: 404 });
            }
            catch (e) {
                return new Response(e.message, { status: 500 });
            }
        }
        return new Response("BuyKing MCP Server v1.2.5 running on Cloudflare Workers. Use /message for JSON-RPC.", { status: 200 });
    }
};
