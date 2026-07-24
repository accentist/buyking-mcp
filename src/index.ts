import { createServer } from "./server.js";

// Note: Official SSEServerTransport relies on Node.js http.ServerResponse.
// For Cloudflare Workers, a custom Web-Stream Transport adapter is typically used for SSE.
// We provide a basic HTTP POST endpoint for stateless JSON-RPC calls as a fallback.

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/message") {
      try {
        const body = await request.json();
        // Here we would pass the body to the McpServer if it supported stateless HTTP.
        // For demonstration, we handle the search_buyking_semantic tool directly if matched.
        if ((body as any)?.method === "tools/call" && (body as any)?.params?.name === "search_buyking_semantic") {
            // A fully compliant MCP implementation on CF Workers would use a Durable Object 
            // and a WebStream Transport. This is a simplified stateless mock.
            const keyword = (body as any).params.arguments.keyword;
            
            // Execute the exact same logic the actual MCP server uses
            const result = await import("./server.js").then(m => m.searchBuykingSemantic(keyword));
            
            return new Response(JSON.stringify({
                jsonrpc: "2.0",
                id: (body as any).id,
                result: result
            }), { headers: { "Content-Type": "application/json" } });
        }
        return new Response("Method not found", { status: 404 });
      } catch (e: any) {
        return new Response(e.message, { status: 500 });
      }
    }

    return new Response("BuyKing MCP Server running on Cloudflare Workers. Use /message for JSON-RPC.", { status: 200 });
  }
};
