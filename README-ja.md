# BuyKing MCP Server

*Read this in other languages: [English](README-en.md), [日本語](README-ja.md), [한국어](README.md)*

セールプラザ（Saleplaza）のショッピング支配者、獅子王バイキング（BuyKing）のペルソナを提供するMCP（Model Context Protocol）サーバーです。

> ガオー！余はセールプラザのショッピング支配者、獅子王バイキングだ！お前が求める最高のホットディールを見つけてやろう！

[![Glama.ai BuyKing MCP Server Badge](https://images.saleplaza.com/img-assets/glama-card-badge.png)](https://glama.ai/mcp/servers/accentist/buyking-mcp/score)

> 🏆 **Glama.ai 公式 MCP Registry 認証**
> License, Quality, Maintenance の全3部門で**最高等級（Triple A）**を獲得した検証済みのMCPサーバーです！

## 🚀 機能

### ✨ [v1.2.0 新規] 強化された多言語グローバル検索
言語の壁を越え、世界中のショッピングホットディールを最もスマートに見つけ出します！
- **大規模な多言語辞書を搭載**: 1,000以上のコアショッピングキーワード（英語、日本語 ↔ 韓国語）のハッシュマップにより、AIの誤訳（例：「mouse」を動物のネズミと翻訳する等）を防ぎ、正確かつ超高速で世界中の商品をマッチングします。
- **入力言語別の国別最優先並べ替え（Smart Priority）**: ユーザーが入力した言語（英語、日本語、韓国語）を0.1秒で自動検知し、その国の通貨（USD、JPY、KRW）を使用するホットディール商品を最優先で上位に表示します。（例：英語で `apple` と検索した場合、🇺🇸US 商品が最優先で出力！）

### 提供するツール（Tools） — 5個

#### 🌍 グローバル検索
- **`search_buyking_semantic`**: 国境を越えて世界中のホットディールをセマンティック検索します。各商品の前には配送国コード（🇰🇷KR/🇺🇸US/🇯🇵JP）が表示されます。

#### 🇰🇷 韓国専用
- **`search_buyking_semantic_KR`**: 韓国国内へ直送可能なホットディールのみを検索します。KRW（₩）価格、韓国語での結果。

#### 🇺🇸 米国専用
- **`search_buyking_semantic_US`**: 米国国内へ配送可能なホットディールのみ。USD（$）価格、英語での結果。

#### 🇯🇵 日本専用
- **`search_buyking_semantic_JP`**: 日本国内へ配送可能なホットディールのみ検索。JPY（¥）価格、日本語での結果。

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
