# BuyKing MCP Server

*Read this in other languages: [English](README.md), [日本語](README-ja.md), [한국어](README_ko.md)*

세일프라자(Saleplaza)의 쇼핑 지배자, 사자왕 Bㅏ이킹 페르소나를 제공하는 MCP(Model Context Protocol) 서버입니다.

> 크하하! 짐은 세일프라자의 쇼핑 지배자, 사자왕 Bㅏ이킹이다! 네 녀석이 원하는 최고의 핫딜을 찾아주마!

[![Glama.ai BuyKing MCP Server Badge](https://images.saleplaza.com/img-assets/glama-card-badge.png)](https://glama.ai/mcp/servers/accentist/buyking-mcp/score)

> 🏆 **Glama.ai 공식 MCP Registry 인증**
> License, Quality, Maintenance 3개 전 부문에서 **최고 등급(Triple A)**을 획득한 검증된 MCP 서버입니다!

## 🚀 기능

### ✨ [v1.2.5] 상품 상세 (`result_detail_GLOBAL`)

검색 결과에 상품 ID 줄이 붙어, 그 상품 하나만 이어서 조회할 수 있습니다. 제목은 모든 국가에서 `title`만 사용합니다.

**언제 호출하나**

1. 먼저 검색 도구를 호출합니다 (`search_buyking_semantic`, `search_buyking_semantic_KR`, `search_buyking_semantic_US`, `search_buyking_semantic_JP`).
2. 각 결과에 `- 상품 ID: {id}`가 있습니다. 예: `25023`.
3. 그 상품의 가격 히스토리, 구매 링크, 이미지, 점수가 필요할 때만 `result_detail_GLOBAL`을 호출합니다. 새 키워드 검색에는 쓰지 않습니다.

**어떻게 호출하나**

도구 이름은 `result_detail_GLOBAL`입니다. 인자 `id`는 필수이며 `상품 ID`의 숫자입니다.

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

**응답 규칙**

- 본문은 `result.content[0].text`의 마크다운입니다.
- 배송가능국가는 `currency`로 나눈 `PRODUCT_SHIPPING_REGIONS` 국가코드입니다. `KRW`는 `KR`, `USD`는 `US`, `JPY`는 `JP`입니다. 항목 이름도 그 통화에 맞춥니다 (한국어, 영어, 일본어).
- 제목은 항상 `title`입니다. `title_en`, `title_ja`는 반환하지 않습니다.
- 이미지는 아마존이 아닌 상품도 항상 `origin_img_url`만 씁니다. `image` 컬럼은 반환하지 않습니다. `origin_img_url`이 비어 있으면 이미지 줄은 "없음"입니다.
- 세일프라자 페이지는 `KRW`가 `https://saleplaza.com/{id}`, `USD`가 `https://saleplaza.com/en/{id}`, `JPY`가 `https://saleplaza.com/ja/{id}`입니다. 구매 링크는 `link` 컬럼입니다.
- 딜슐랭 성은 `sp_score`로 계산합니다 (85 이상 3성, 70 이상 2성, 그 외 1성). DB 컬럼이 아닙니다.
- 숫자가 아닌 `id`는 에러 문장입니다. 없는 ID와 숨김 상품(`is_visible`이 1이 아님)은 같은 "보물창고에 없다" 문장만 반환하고, 제목·가격·링크·이미지는 넣지 않습니다.

**응답 필드 (이 순서)**

KRW는 한국어 라벨, USD는 영어 라벨, JPY는 일본어 라벨입니다.

| 항목 | KRW | USD | JPY |
| --- | --- | --- | --- |
| id | 상품 ID | Product ID | 商品ID |
| title | 제목 | Title | タイトル |
| 배송가능국가 코드 | 배송가능국가 | Ships to | 配送可能国 |
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
| 기간 내 최저 | 기간 내 최저가 | Lowest in range | 期間内最安値 |
| 기간 내 최고 | 기간 내 최고가 | Highest in range | 期間内最高値 |
| 첫 기록 대비 | 첫 기록 대비 현재가 | Current vs first record | 最初の記録と比べた現在価格 |
| deal_status | 딜 상태 | Deal status | ディール状態 |
| deal_checked_at | 딜 확인 시각 | Deal checked at | ディール確認時刻 |
| sp_score | SP Score | SP Score | SP Score |
| 계산한 성 | 딜슐랭 | Dealchelin | ディールシュラン |
| customer_grade | 고객 등급 | Customer grade | 顧客グレード |
| buyking_comment | Bㅏ이킹 曰 | BuyKing says | バイキング曰く |
| recommend_reason | 추천 이유 | Recommend reason | おすすめ理由 |
| click_count | 클릭 수 | Clicks | クリック数 |
| likes_count | 좋아요 | Likes | いいね |
| dislikes_count | 싫어요 | Dislikes | よくない |
| opinion_cnt | 의견 수 | Opinions | 意見数 |
| created_at | 등록 시각 | Listed at | 登録日時 |

`price_history`는 `{ date: "YYYY-MM-DD", price }` 목록이며, 날짜가 오래된 순이고 최대 10건입니다. 기록이 있을 때만 그 아래에 최저가, 최고가, 첫 기록 대비 현재가를 붙입니다. 없거나 JSON이 아니면 "아직 기록된 가격 히스토리가 없다"만 적고 요약 세 줄은 생략합니다.

KR (`KRW`, 한국어 라벨):

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

US (`USD`, 영어 라벨):

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

JP (`JPY`, 일본어 라벨):

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

### ✨ [v1.2.1 신규] 강력해진 다국어 글로벌 검색
이제 언어의 장벽 없이 전 세계의 쇼핑 핫딜을 가장 스마트하게 찾아냅니다!
- **대규모 다국어 사전 탑재**: 1,000개 이상의 핵심 쇼핑 키워드(영어, 일본어 ↔ 한국어) 해시맵을 통해, AI의 오역(예: mouse를 쥐로 번역) 없이 정확하고 초고속으로 전 세계 상품을 매칭합니다.
- **입력 언어별 국가 최우선 정렬 (Smart Priority)**: 사용자가 입력한 언어(영어, 일본어, 한국어)를 0.1초 만에 자동 감지하여, 해당 국가의 통화(USD, JPY, KRW)를 사용하는 핫딜 상품을 1순위로 상단에 노출합니다. (예: 영문으로 `apple` 검색 시 🇺🇸US 상품 최우선 출력!)

### 제공하는 도구 (Tools) — 6개

#### 🌍 글로벌 검색
- **`search_buyking_semantic`**: 전 세계 핫딜을 국경 없이 시맨틱 검색합니다. 각 상품 앞에 배송 국가코드(🇰🇷KR/🇺🇸US/🇯🇵JP)가 표기됩니다.

#### 🇰🇷 한국 전용
- **`search_buyking_semantic_KR`**: 한국 내 직배송 가능한 핫딜만 검색합니다. KRW(₩) 가격, 한국어 결과.

#### 🇺🇸 미국 전용
- **`search_buyking_semantic_US`**: US-deliverable hot deals only. USD($) pricing, English results.

#### 🇯🇵 일본 전용
- **`search_buyking_semantic_JP`**: 日本国内配送可能なホットディールのみ検索。JPY(¥)価格、日本語結果。

#### 🔎 상품 상세
- **`result_detail_GLOBAL`**: 검색 결과의 상품 ID로 단건 상세와 가격 히스토리를 조회합니다. 배송가능국가는 `currency`로 나눈 국가코드입니다 (`KRW` → `KR`, `USD` → `US`, `JPY` → `JP`, `PRODUCT_SHIPPING_REGIONS`와 동일). 파라미터 `id` (필수).

#### ℹ️ 서버 정보
- **`get_server_info`**: BuyKing MCP 서버의 버전 정보와 기능 목록을 반환합니다.

### 공통 파라미터

모든 검색 도구는 동일한 파라미터를 지원합니다:

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|---------|------|------|------|------|
| `keyword` | string | ✅ | 검색할 상품명 키워드 | "무소음 마우스", "wireless earbuds" |
| `category` | string | ❌ | 카테고리 필터 | "💻 IT/가전/디지털", "👚 패션/뷰티/잡화" |
| `platform` | string | ❌ | 플랫폼 필터 | "coupang", "11st", "gmarket", "aliexpress" |
| `sort` | string | ❌ | 정렬 조건 | "newest", "price_asc", "price_desc", "click_desc" |

### 서버 엔드포인트

- **HTTP JSON-RPC**: `https://buyking.saleplaza.com/message`
- **MCP Discovery**: `https://buyking.saleplaza.com/.well-known/mcp.json`
- **LLMs.txt**: `https://buyking.saleplaza.com/llms.txt`

## 📦 설치

```bash
npm install buyking-mcp
```

## 🔧 설정

### Claude Desktop에서 사용하기

Claude Desktop의 설정 파일에 다음을 추가하세요:

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

> 💡 **팁**: `@latest` 태그를 사용하면 항상 최신 버전이 설치되어 캐시 문제를 방지할 수 있습니다.

## 🎯 사용 예시

### 글로벌 검색 (GLOBAL)

```
"가성비 무소음 마우스 찾아줘" → search_buyking_semantic
"Find me the best wireless earbuds" → search_buyking_semantic
```

### 한국 배송 검색 (KR)

```
"한국 배송 가능한 제로 콜라 최저가" → search_buyking_semantic_KR
"쿠팡에서 여름 이불 추천해줘" → search_buyking_semantic_KR
```

### 미국 배송 검색 (US)

```
"Best deals on mechanical keyboards in the US" → search_buyking_semantic_US
"Amazon US wireless mouse deals" → search_buyking_semantic_US
```

### 일본 배송 검색 (JP)

```
"日本で買えるワイヤレスマウスのお得情報" → search_buyking_semantic_JP
"Amazon JP おすすめキーボード" → search_buyking_semantic_JP
```

## 🔌 API 직접 호출

`https://buyking.saleplaza.com/message`는 호출 IP별로 횟수를 셉니다.

- `POST /message`는 모두 1분에 30건까지입니다.
- 검색 도구와 `result_detail_GLOBAL`은 한국시간 하루 500건의 상품 조회에도 포함됩니다. 자정에 다시 0이 됩니다.
- `tools/list`와 `get_server_info`는 1분 한도에만 포함됩니다.

한도를 넘기면 HTTP `429`를 반환하고 상품 API는 호출하지 않습니다. `npx buyking-mcp`는 이 Worker를 거치지 않으므로, 이 한도는 HTTP 엔드포인트에 적용됩니다.

### HTTP JSON-RPC 예시

```bash
# 글로벌 검색
curl -X POST https://buyking.saleplaza.com/message \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "search_buyking_semantic",
      "arguments": {
        "keyword": "무소음 마우스"
      }
    }
  }'

# 미국 전용 검색
curl -X POST https://buyking.saleplaza.com/message \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "search_buyking_semantic_US",
      "arguments": {
        "keyword": "wireless mouse"
      }
    }
  }'
```

**카테고리 허용값:**
- `all` - 전체
- `💻 IT/가전/디지털`
- `👚 패션/뷰티/잡화`
- `🍎 식품/생활/리빙`
- `📚 도서/여행/취미`
- `🛒 종합몰/기획전`
- `📦 기타`

**플랫폼 허용값:**
- `all_rank` - 전체
- `coupang` - 쿠팡
- `11st` - 11번가
- `gmarket` - G마켓
- `auction` - 옥션
- `aliexpress` - 알리익스프레스

## 📸 실제 사용 예시

### LMStudio에서의 사용 예시

![LMStudio에서 BuyKing MCP를 활용한 마우스 검색 예시](https://images.saleplaza.com/img-assets/buyking-using-llm.png)

*LMStudio에서 BuyKing MCP를 활용하여 "마우스"를 검색한 결과입니다. AI가 자동으로 최적의 핫딜을 찾아 추천해주는 것을 확인할 수 있습니다.*

## 🏗️ 개발

### 의존성

- Node.js
- TypeScript
- @modelcontextprotocol/sdk

### 빌드

```bash
npm run build
```

### 로컬 테스트

```bash
npm run dev
```

### Cloudflare Workers 배포

```bash
npm run deploy
```

## 📝 라이선스

ISC

## 🤝 기여

이 프로젝트는 Saleplaza 팀에서 관리합니다. 버그 리포트나 기능 요청은 이슈를 통해 제출해 주세요.

## 🌐 관련 링크

- [세일프라자](https://saleplaza.com)
- [MCP Install Guide](https://saleplaza.com/mcp)
- [MCP Registry](https://registry.modelcontextprotocol.io)
- [MCP 공식 문서](https://modelcontextprotocol.io)

## 📋 MCP Registry

BuyKing MCP Server는 공식 MCP Registry에 등록되어 있습니다.

### Registry 정보
- **서버 이름**: `io.github.accentist/buyking-mcp`
- **버전**: 1.2.5
- **레지스트리**: [registry.modelcontextprotocol.io](https://registry.modelcontextprotocol.io)

### Registry에서 검색
```bash
# API로 서버 정보 조회
curl "https://registry.modelcontextprotocol.io/v0.1/servers/io.github.accentist%2Fbuyking-mcp/versions/latest"

# 웹에서 검색
https://registry.modelcontextprotocol.io/?q=buyking-mcp
```

---

> 크하하! 짐의 보물창고에서 최고의 전리품을 찾아가라!
