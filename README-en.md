# BuyKing MCP Server

*Read this in other languages: [English](README-en.md), [日本語](README-ja.md), [한국어](README.md)*

An MCP (Model Context Protocol) server providing the persona of "BuyKing, the Shopping Conqueror of Saleplaza."

> Roar! I am BuyKing, the Shopping Conqueror of Saleplaza! I will find you the best hot deals you desire!

[![Glama.ai BuyKing MCP Server Badge](https://images.saleplaza.com/img-assets/glama-card-badge.png)](https://glama.ai/mcp/servers/accentist/buyking-mcp/score)

> 🏆 **Glama.ai Official MCP Registry Certified**
> A certified MCP server that has achieved the **highest rating (Triple A)** in all three categories: License, Quality, and Maintenance!

## 🚀 Features

### ✨ [v1.2.0 New] Enhanced Multilingual Global Search
Find global shopping hot deals smarter without language barriers!
- **Massive Multilingual Dictionary Built-in**: Accurately and instantly matches global products without AI mistranslation (e.g., translating "mouse" to an animal) using a hashmap of 1,000+ core shopping keywords (English, Japanese ↔ Korean).
- **Smart Priority Sorting by Input Language**: Automatically detects the user's input language (English, Japanese, Korean) in 0.1 seconds and prioritizes hot deals using that country's currency (USD, JPY, KRW) to the top. (e.g., searching for `apple` in English will show 🇺🇸US products first!)

### Provided Tools — 5

#### 🌍 Global Search
- **`search_buyking_semantic`**: Semantically searches hot deals worldwide without borders. Each product is labeled with a shipping country code (🇰🇷KR/🇺🇸US/🇯🇵JP).

#### 🇰🇷 Korea Exclusive
- **`search_buyking_semantic_KR`**: Searches only hot deals directly shippable within Korea. KRW(₩) pricing, Korean results.

#### 🇺🇸 US Exclusive
- **`search_buyking_semantic_US`**: US-deliverable hot deals only. USD($) pricing, English results.

#### 🇯🇵 Japan Exclusive
- **`search_buyking_semantic_JP`**: Searches only hot deals deliverable within Japan. JPY(¥) pricing, Japanese results.

#### ℹ️ Server Info
- **`get_server_info`**: Returns the version information and feature list of the BuyKing MCP server.

### Common Parameters

All search tools support the same parameters:

| Parameter | Type | Required | Description | Example |
|---------|------|------|------|------|
| `keyword` | string | ✅ | Product keyword to search | "wireless mouse", "earbuds" |
| `category` | string | ❌ | Category filter | "💻 IT/Electronics/Digital" |
| `platform` | string | ❌ | Platform filter | "amazon", "aliexpress" |
| `sort` | string | ❌ | Sort condition | "newest", "price_asc", "price_desc" |

### Server Endpoints

- **HTTP JSON-RPC**: `https://buyking.saleplaza.com/message`
- **MCP Discovery**: `https://buyking.saleplaza.com/.well-known/mcp.json`
- **LLMs.txt**: `https://buyking.saleplaza.com/llms.txt`

## 📦 Installation

```bash
npm install buyking-mcp
```

## 🔧 Configuration

### Using in Claude Desktop

Add the following to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "buyking-mcp": {
      "command": "npx",
      "args": ["-y", "buyking-mcp@latest"]
    }
  }
}
```

> 💡 **Tip**: Using the `@latest` tag ensures you always have the latest version installed, preventing cache issues.

## 🔌 Direct API Call

### HTTP JSON-RPC Example

```bash
# Global Search
curl -X POST https://buyking.saleplaza.com/message \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "search_buyking_semantic",
      "arguments": {
        "keyword": "wireless mouse"
      }
    }
  }'
```

## 🏗️ Development

### Dependencies
- Node.js
- TypeScript
- @modelcontextprotocol/sdk

### Build
```bash
npm run build
```

### Local Test
```bash
npm run dev
```

### Cloudflare Workers Deployment
```bash
npm run deploy
```

## 📝 License
ISC

---

> Roar! Take the best loot from my treasure trove!
