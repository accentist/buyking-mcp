# BuyKing MCP Server

*Read this in other languages: [English](README.md), [日本語](README-ja.md), [한국어](README_ko.md)*

セールプラザ（Saleplaza）のショッピング支配者、獅子王バイキング（BuyKing）のペルソナを提供するMCP（Model Context Protocol）サーバーです。

> ガオー！余はセールプラザのショッピング支配者、獅子王バイキングだ！お前が求める最高のホットディールを見つけてやろう！

[![Glama.ai BuyKing MCP Server Badge](https://images.saleplaza.com/img-assets/glama-card-badge.png)](https://glama.ai/mcp/servers/accentist/buyking-mcp/score)

> 🏆 **Glama.ai 公式 MCP Registry 認証**
> License, Quality, Maintenance の全3部門で**最高等級（Triple A）**を獲得した検証済みのMCPサーバーです！

## 🚀 機能

### ✨ [v1.2.5] 商品詳細 (`result_detail_GLOBAL`)

検索結果に商品IDの行が付き、その1件だけを後から読み込めるようになりました。タイトルはどの国でも `title` だけを使います。

**いつ呼ぶか**

1. 先に検索ツールを呼びます（`search_buyking_semantic`、`search_buyking_semantic_KR`、`search_buyking_semantic_US`、`search_buyking_semantic_JP`）。
2. 各結果に `- 상품 ID: {id}` があります（例: `25023`）。
3. その1商品の価格履歴、購入リンク、画像、評価が欲しいときだけ `result_detail_GLOBAL` を呼びます。新しいキーワード検索には使いません。

**呼び方**

ツール名は `result_detail_GLOBAL`。引数 `id` は必須で、`상품 ID` の数字です。

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

**応答の決まり**

- 本文は `result.content[0].text` の Markdown です。
- 配送可能国は `currency` から分けた `PRODUCT_SHIPPING_REGIONS` の国コードです。`KRW` は `KR`、`USD` は `US`、`JPY` は `JP` です。項目名もその通貨に合わせます（韓国語、英語、日本語）。
- タイトルは常に `title` です。`title_en` と `title_ja` は返しません。
- 画像はアマゾン以外も含め、常に `origin_img_url` だけです。`image` 列は返しません。`origin_img_url` が空なら、画像の行は「なし」です。
- セールプラザのページは `KRW` が `https://saleplaza.com/{id}`、`USD` が `https://saleplaza.com/en/{id}`、`JPY` が `https://saleplaza.com/ja/{id}` です。購入リンクは `link` 列です。
- ディールシュランの星は `sp_score` から計算します（85以上が3、70以上が2、それ以外は1）。DB列ではありません。
- 数字でない `id` はエラー文です。存在しないIDと非表示商品（`is_visible` が 1 でない）は同じ「宝庫にない」文だけで、タイトル・価格・リンク・画像は出しません。

**応答フィールド（この順）**

下の表の左から、KRW は韓国語ラベル、USD は英語ラベル、JPY は日本語ラベルです。

| 項目 | KRW | USD | JPY |
| --- | --- | --- | --- |
| id | 상품 ID | Product ID | 商品ID |
| title | 제목 | Title | タイトル |
| 配送可能国コード | 배송가능국가 | Ships to | 配送可能国 |
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
| 期間内の最安 | 기간 내 최저가 | Lowest in range | 期間内最安値 |
| 期間内の最高 | 기간 내 최고가 | Highest in range | 期間内最高値 |
| 最初の記録との差 | 첫 기록 대비 현재가 | Current vs first record | 最初の記録と比べた現在価格 |
| deal_status | 딜 상태 | Deal status | ディール状態 |
| deal_checked_at | 딜 확인 시각 | Deal checked at | ディール確認時刻 |
| sp_score | SP Score | SP Score | SP Score |
| 計算した星 | 딜슐랭 | Dealchelin | ディールシュラン |
| customer_grade | 고객 등급 | Customer grade | 顧客グレード |
| buyking_comment | 바이킹 曰 | BuyKing says | バイキング曰く |
| recommend_reason | 추천 이유 | Recommend reason | おすすめ理由 |
| click_count | 클릭 수 | Clicks | クリック数 |
| likes_count | 좋아요 | Likes | いいね |
| dislikes_count | 싫어요 | Dislikes | よくない |
| opinion_cnt | 의견 수 | Opinions | 意見数 |
| created_at | 등록 시각 | Listed at | 登録日時 |

`price_history` は `{ date: "YYYY-MM-DD", price }` の配列で、日付の古い順、最大10件です。履歴があるときだけ、その下に最安・最高・最初の記録との差を付けます。無い、またはJSONでないときは「まだ記録はない」とだけ書き、要約3行は出しません。

KR（`KRW`、韓国語ラベル）:

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
- 바이킹 曰: ...
- 추천 이유: ...
- 클릭 수: 0
- 좋아요: 0
- 싫어요: 0
- 의견 수: 0
- 등록 시각: 2026-10-01T15:00:01.000Z
```

US（`USD`、英語ラベル）:

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

JP（`JPY`、日本語ラベル）:

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

### ✨ [v1.2.1 新規] 強化された多言語グローバル検索
言語の壁を越え、世界中のショッピングホットディールを最もスマートに見つけ出します！
- **大規模な多言語辞書を搭載**: 1,000以上のコアショッピングキーワード（英語、日本語 ↔ 韓国語）のハッシュマップにより、AIの誤訳（例：「mouse」を動物のネズミと翻訳する等）を防ぎ、正確かつ超高速で世界中の商品をマッチングします。
- **入力言語別の国別最優先並べ替え（Smart Priority）**: ユーザーが入力した言語（英語、日本語、韓国語）を0.1秒で自動検知し、その国の通貨（USD、JPY、KRW）を使用するホットディール商品を最優先で上位に表示します。（例：英語で `apple` と検索した場合、🇺🇸US 商品が最優先で出力！）

### 提供するツール（Tools） — 6個

#### 🌍 グローバル検索
- **`search_buyking_semantic`**: 国境を越えて世界中のホットディールをセマンティック検索します。各商品の前には配送国コード（🇰🇷KR/🇺🇸US/🇯🇵JP）が表示されます。

#### 🇰🇷 韓国専用
- **`search_buyking_semantic_KR`**: 韓国国内へ直送可能なホットディールのみを検索します。KRW（₩）価格、韓国語での結果。

#### 🇺🇸 米国専用
- **`search_buyking_semantic_US`**: 米国国内へ配送可能なホットディールのみ。USD（$）価格、英語での結果。

#### 🇯🇵 日本専用
- **`search_buyking_semantic_JP`**: 日本国内へ配送可能なホットディールのみ検索。JPY（¥）価格、日本語での結果。

#### 🔎 商品詳細
- **`result_detail_GLOBAL`**: 検索結果の商品IDで1件の詳細と価格履歴を取得します。配送可能国は `currency` から分けた国コードです（`KRW` → `KR`、`USD` → `US`、`JPY` → `JP`。`PRODUCT_SHIPPING_REGIONS` と同じ）。パラメーター `id`（必須）。

#### ℹ️ サーバー情報
- **`get_server_info`**: BuyKing MCP サーバーのバージョン情報と機能リストを返します。

### 共通パラメーター

すべての検索ツールは同じパラメーターをサポートしています：

| パラメーター | タイプ | 必須 | 説明 | 例 |
|---------|------|------|------|------|
| `keyword` | string | ✅ | 検索する商品名のキーワード | "ワイヤレスマウス", "イヤホン" |
| `category` | string | ❌ | カテゴリフィルター | "💻 IT/家電/デジタル" |
| `platform` | string | ❌ | プラットフォームフィルター | "amazon", "aliexpress" |
| `sort` | string | ❌ | 並べ替え条件 | "newest", "price_asc", "price_desc" |

### サーバーエンドポイント

- **HTTP JSON-RPC**: `https://buyking.saleplaza.com/message`
- **MCP Discovery**: `https://buyking.saleplaza.com/.well-known/mcp.json`
- **LLMs.txt**: `https://buyking.saleplaza.com/llms.txt`

## 📦 インストール

```bash
npm install buyking-mcp
```

## 🔧 設定

### Claude Desktop での使用

Claude Desktop の設定ファイルに以下を追加してください：

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

> 💡 **ヒント**: `@latest` タグを使用すると、常に最新バージョンがインストールされ、キャッシュの問題を防ぐことができます。

## 🔌 API 直接呼び出し

`https://buyking.saleplaza.com/message` は呼び出し元 IP ごとに回数を数えます。

- `POST /message` はすべて 1 分あたり 30 件までです。
- 検索ツールと `result_detail_GLOBAL` は、韓国時間の 1 日 500 件の商品照会にも数えます。日付が変わると 0 に戻ります。
- `tools/list` と `get_server_info` は 1 分の上限にだけ数えます。

上限を超えると HTTP `429` を返し、商品 API は呼び出しません。`npx buyking-mcp` はこの Worker を通らないため、この上限は HTTP エンドポイントに適用されます。

### HTTP JSON-RPC の例

```bash
# グローバル検索
curl -X POST https://buyking.saleplaza.com/message \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "search_buyking_semantic",
      "arguments": {
        "keyword": "ワイヤレスマウス"
      }
    }
  }'
```

## 🏗️ 開発

### 依存関係
- Node.js
- TypeScript
- @modelcontextprotocol/sdk

### ビルド
```bash
npm run build
```

### ローカルテスト
```bash
npm run dev
```

### Cloudflare Workers デプロイ
```bash
npm run deploy
```

## 📝 ライセンス
ISC

---

> ガオー！余の宝物庫から最高の戦利品を持っていけ！
