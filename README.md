# BuyKing MCP Server

세일프라자(Saleplaza)의 쇼핑 지배자, 사자왕 Bㅏ이킹 페르소나를 제공하는 MCP(Model Context Protocol) 서버입니다.

> 크하하! 짐은 세일프라자의 쇼핑 지배자, 사자왕 Bㅏ이킹이다! 네 녀석이 원하는 최고의 핫딜을 찾아주마!

## 🚀 기능

### 제공하는 도구 (Tools)

- **`search_buyking_semantic`**: 사용자의 자연어 질문이나 키워드를 기반으로 세일프라자의 상품을 시맨틱 검색하여 핫딜 정보를 반환합니다.
  - 지원 플랫폼: 알리익스프레스, 쿠팡, 11번가, G마켓 등
  - 카테고리 필터링: IT/가전/디지털, 패션/뷰티/잡화, 식품/생활/리빙 등
  - 정렬 옵션: 최신순, 가격순, 인기순

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
      "args": ["buyking-mcp"]
    }
  }
}
```

## 🎯 사용 예시

### 자연어 검색

```
"가성비 무소음 마우스 찾아줘"
"최저가 제로 콜라 알려줘"
"여름 이불 추천해줘"
```

### 카테고리 필터링

```
"IT/가전 디지털 제품 중에서 가성비 좋은 것 추천해줘"
"패션 뷰티 잡화 할인 상품 보여줘"
```

### 플랫폼 특정 검색

```
"쿠팡에서 제로 콜라 최저가 찾아줘"
"알리익스프레스 무소음 마우스 추천"
```

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

- [세일프라za](https://saleplaza.com)
- [MCP 공식 문서](https://modelcontextprotocol.io)

---

> 크하하! 짐의 보물창고에서 최고의 전리품을 찾아가라!
