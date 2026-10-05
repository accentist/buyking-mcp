# BuyKing MCP Server

*Read this in other languages: [English](README.md), [日本語](README-ja.md), [한국어](README_ko.md)*

An MCP (Model Context Protocol) server providing the persona of "BuyKing, the Shopping Conqueror of Saleplaza."

> Roar! I am BuyKing, the Shopping Conqueror of Saleplaza! I will find you the best hot deals you desire!

[![Glama.ai BuyKing MCP Server Badge](https://images.saleplaza.com/img-assets/glama-card-badge.png)](https://glama.ai/mcp/servers/accentist/buyking-mcp/score)

> 🏆 **Glama.ai Official MCP Registry Certified**
> A certified MCP server that has achieved the **highest rating (Triple A)** in all three categories: License, Quality, and Maintenance!

## 🚀 Features

### ✨ [v1.2.5] Product detail (`result_detail_GLOBAL`)

Search results now include a product ID line so a follow-up call can load one product. Titles in every country use `title` only.

**When to call**

1. Call a search tool first (`search_buyking_semantic`, `search_buyking_semantic_KR`, `search_buyking_semantic_US`, or `search_buyking_semantic_JP`).
2. Each result contains `- 상품 ID: {id}` (for example `25023`).
3. Call `result_detail_GLOBAL` only when the user wants more about that one product: price history, the store buy link, the image, or scores. Do not use it for a new keyword search.

**How to call**

Tool name: `result_detail_GLOBAL`. Argument `id` is required and must be a numeric string from `상품 ID`.

```bash
curl -X POST https://buyking.saleplaza.com/message \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "result_detail_GLOBAL",
      "arguments": { "id": "25023" }
    }
  }'
```

**Response rules**

- The body is Markdown in `result.content[0].text`.
- The shippable country is a `PRODUCT_SHIPPING_REGIONS` region code derived from `currency`: `KRW` → `KR`, `USD` → `US`, `JPY` → `JP`. Field labels follow that currency (Korean, English, Japanese).
- The title is always `title`. `title_en` and `title_ja` are not returned.
- The image is always `origin_img_url`, including for non-Amazon products. The `image` column is never returned. If `origin_img_url` is empty, the image line is the localized word for none.
- Saleplaza page: `KRW` → `https://saleplaza.com/{id}`, `USD` → `https://saleplaza.com/en/{id}`, `JPY` → `https://saleplaza.com/ja/{id}`. The buy link is the `link` column.
- Dealchelin stars are computed from `sp_score` (85+ is 3, 70+ is 2, otherwise 1). It is not a database column.
- A non-numeric `id` returns an error sentence. An unknown id and a hidden product (`is_visible` is not 1) return the same "not in the vault" sentence, with no title, price, link, or image.

**Response fields, in order**

Labels below are the Korean (`KRW`) names. USD uses the English names, JPY the Japanese names.

| Field | KRW label | USD label | JPY label |
| --- | --- | --- | --- |
| id | 상품 ID | Product ID | 商品ID |
| title | 제목 | Title | タイトル |
| shipping region code | 배송가능국가 | Ships to | 配送可能国 |
| platform | 플랫폼 | Platform | プラットフォーム |
| category | 카테고리 | Category | カテゴリ |
| origin_img_url | 이미지 | Image | 画像 |
| Saleplaza URL | 세일프라자 | Saleplaza | セールプラザ |
| link | 구매 링크 | Buy link | 購入リンク |
| original_price | 원래 가격 | Original | 元の価格 |
| price | 지금 혜택가 | Deal Price | 特価 |
| discount | 할인 | Discount | 割引 |
| target_price | 목표가 | Target price | 目標価格 |
| price_history | 가격 히스토리 | Price history | 価格履歴 |
| lowest in history | 기간 내 최저가 | Lowest in range | 期間内最安値 |
| highest in history | 기간 내 최고가 | Highest in range | 期間内最高値 |
| current vs first history row | 첫 기록 대비 현재가 | Current vs first record | 最初の記録と比べた現在価格 |
| deal_status | 딜 상태 | Deal status | ディール状態 |
| deal_checked_at | 딜 확인 시각 | Deal checked at | ディール確認時刻 |
| sp_score | SP Score | SP Score | SP Score |
| computed stars | 딜슐랭 | Dealchelin | ディールシュラン |
| customer_grade | 고객 등급 | Customer grade | 顧客グレード |
| buyking_comment | Bㅏ이킹 曰 | BuyKing says | バイキング曰く |
| recommend_reason | 추천 이유 | Recommend reason | おすすめ理由 |
| click_count | 클릭 수 | Clicks | クリック数 |
| likes_count | 좋아요 | Likes | いいね |
| dislikes_count | 싫어요 | Dislikes | よくない |
| opinion_cnt | 의견 수 | Opinions | 意見数 |
| created_at | 등록 시각 | Listed at | 登録日時 |

`price_history` is a list of `{ date: "YYYY-MM-DD", price }` rows, newest dates last, at most 10. When history exists, the three summary lines follow that list. When it is missing or not valid JSON, the history line says there is no record yet and the summary lines are omitted.

KR (`KRW`, Korean labels):

```text
- 상품 ID: 25023
- 제목: ...
- 배송가능국가: KR
- 플랫폼: ali
- 카테고리: ...
- 이미지: https://ae-pic-a1.aliexpress-media.com/...jpg
- 세일프라자: https://saleplaza.com/25023
- 구매 링크: https://...
- 원래 가격: KRW 3,261
- 지금 혜택가: KRW 3,250
- 할인: 1%
- 목표가: KRW 2,500
- 가격 히스토리:
  - 2026-10-04: KRW 35,900
- 기간 내 최저가: KRW 35,900
- 기간 내 최고가: KRW 35,900
- 첫 기록 대비 현재가: KRW 0
- 딜 상태: ...
- 딜 확인 시각: ...
- SP Score: 74
- 딜슐랭: 2성
- 고객 등급: ...
- Bㅏ이킹 曰: ...
- 추천 이유: ...
- 클릭 수: 0
- 좋아요: 0
- 싫어요: 0
- 의견 수: 0
- 등록 시각: 2026-10-01T15:00:01.000Z
```

US (`USD`, English labels):

```text
- Product ID: 25023
- Title: ...
- Ships to: US
- Platform: amazon
- Category: ...
- Image: https://m.media-amazon.com/...jpg
- Saleplaza: https://saleplaza.com/en/25023
- Buy link: https://...
- Original: USD 29.9
- Deal Price: USD 19.9
- Discount: 33%
- Target price: none
- Price history:
  - 2026-09-01: USD 25
  - 2026-09-20: USD 19.9
- Lowest in range: USD 19.9
- Highest in range: USD 25
- Current vs first record: USD -5.1
- Deal status: ...
- Deal checked at: ...
- SP Score: 88
- Dealchelin: 3-star
- Customer grade: ...
- BuyKing says: ...
- Recommend reason: ...
- Clicks: 0
- Likes: 0
- Dislikes: 0
- Opinions: 0
- Listed at: 2026-10-01T15:00:01.000Z
```

JP (`JPY`, Japanese labels):

```text
- 商品ID: 25023
- タイトル: ...
- 配送可能国: JP
- プラットフォーム: jp-amazon
- カテゴリ: ...
- 画像: https://m.media-amazon.com/...jpg
- セールプラザ: https://saleplaza.com/ja/25023
- 購入リンク: https://...
- 元の価格: JPY 1,980
- 特価: JPY 1,480
- 割引: 25%
- 目標価格: なし
- 価格履歴:
  - 2026-10-04: JPY 1,980
- 期間内最安値: JPY 1,480
- 期間内最高値: JPY 1,980
- 最初の記録と比べた現在価格: JPY -500
- ディール状態: ...
- ディール確認時刻: ...
- SP Score: 74
- ディールシュラン: 2つ星
- 顧客グレード: ...
- バイキング曰く: ...
- おすすめ理由: ...
- クリック数: 0
- いいね: 0
- よくない: 0
- 意見数: 0
- 登録日時: 2026-10-01T15:00:01.000Z
```

### ✨ [v1.2.1 New] Enhanced Multilingual Global Search
Find global shopping hot deals smarter without language barriers!
- **Massive Multilingual Dictionary Built-in**: Accurately and instantly matches global products without AI mistranslation (e.g., translating "mouse" to an animal) using a hashmap of 1,000+ core shopping keywords (English, Japanese ↔ Korean).
- **Smart Priority Sorting by Input Language**: Automatically detects the user's input language (English, Japanese, Korean) in 0.1 seconds and prioritizes hot deals using that country's currency (USD, JPY, KRW) to the top. (e.g., searching for `apple` in English will show 🇺🇸US products first!)

### Provided Tools — 6

#### 🌍 Global Search
- **`search_buyking_semantic`**: Semantically searches hot deals worldwide without borders. Each product is labeled with a shipping country code (🇰🇷KR/🇺🇸US/🇯🇵JP).

#### 🇰🇷 Korea Exclusive
- **`search_buyking_semantic_KR`**: Searches only hot deals directly shippable within Korea. KRW(₩) pricing, Korean results.

#### 🇺🇸 US Exclusive
- **`search_buyking_semantic_US`**: US-deliverable hot deals only. USD($) pricing, English results.

#### 🇯🇵 Japan Exclusive
- **`search_buyking_semantic_JP`**: Searches only hot deals deliverable within Japan. JPY(¥) pricing, Japanese results.

#### 🔎 Product Detail
- **`result_detail_GLOBAL`**: Fetches one product and its price history by the product ID from a search result. The shippable country is a region code from `currency`, matching `PRODUCT_SHIPPING_REGIONS` (`KRW` → `KR`, `USD` → `US`, `JPY` → `JP`). Parameter `id` (required).

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
