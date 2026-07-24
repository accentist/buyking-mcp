# 🦁 BuyKing MCP Server

> **"크하하! 짐은 세일프라자의 쇼핑 지배자, 사자왕 Bㅏ이킹이다! 네 녀석이 찾는 모든 핫딜은 내 보물창고에 있다!"**

**BuyKing MCP Server**는 세일프라자(Saleplaza)의 방대한 쇼핑 데이터를 외부 AI(Claude, ChatGPT 등)가 쉽게 검색하고 사용자에게 추천할 수 있도록 연결해 주는 **MCP(Model Context Protocol)** 서버입니다.

이 서버를 연동하면, 귀하의 AI 비서가 "Bㅏ이킹"이라는 강력하고 매력적인 페르소나를 장착하여 완벽한 쇼핑 도우미로 변신합니다! 🚀

---

## ✨ 핵심 기능 (Features)

* 🔍 **시맨틱 핫딜 검색 (`search_buyking_semantic`)**
  * "가성비 무소음 마우스 찾아줘", "여름용 시원한 이불 추천해 줘" 같은 자연어 질문의 맥락(Context)을 이해하고, DB에서 가장 의미가 유사한 특가 상품을 찰떡같이 찾아옵니다.
* 🗣️ **완벽한 Bㅏ이킹 페르소나**
  * 딱딱한 시스템 응답 대신, Bㅏ이킹 고유의 유쾌하고 찰진 추천 코멘트와 함께 시각적으로 아름다운 마크다운(Markdown) 포맷으로 응답합니다.
* ⚡ **초고속 Serverless 인프라**
  * Cloudflare Workers 기반으로 구축되어, 전 세계 어디서든 지연 없는 빠른 응답 속도와 완벽한 안정성을 자랑합니다.

---

## 🛠️ AI 비서에 연동하는 방법 (Usage)

현재 가장 널리 쓰이는 **Claude Desktop** 앱에 Bㅏ이킹을 연결하는 방법입니다. 단 1분이면 충분합니다!

### 1️⃣ 설정 파일 열기
Mac 터미널을 열고 아래 명령어를 입력하여 Claude 환경 설정 파일을 엽니다.
```bash
code ~/Library/Application\ Support/Claude/claude_desktop_config.json
```
*(Windows의 경우: `%APPDATA%\\Claude\\claude_desktop_config.json`)*

### 2️⃣ BuyKing MCP 연결 코드 추가
설정 파일에 아래의 JSON 코드를 추가하고 저장합니다.
*(경로는 실제 `buyking-mcp` 프로젝트가 설치된 절대 경로로 맞춰주세요!)*

```json
{
  "mcpServers": {
    "buyking": {
      "command": "npx",
      "args": [
        "-y",
        "tsx",
        "/Users/gvnc/Desktop/AG2/buyking-mcp/src/cli.ts"
      ]
    }
  }
}
```

### 3️⃣ Claude 재시작 및 채팅 시작!
1. Claude 앱을 완전히 종료(`Cmd + Q`)한 후 다시 실행합니다.
2. 대화창 하단에 🔌 **망치 모양(또는 콘센트) 아이콘**이 켜졌는지 확인합니다.
3. 이제 Claude에게 물어보세요!
   > **"여름 맞이 시원한 탄산수나 사이다 좀 추천해줘. 반드시 툴을 사용해서 대답해!"**

---

## 🌐 AI SEO (인공지능 검색 엔진 최적화)

본 프로젝트는 외부 AI 크롤러(Agentic AI)가 스스로 서버를 발견하고 학습할 수 있도록 **AI SEO**가 완벽하게 적용되어 있습니다.
- `GET /robots.txt`: AI 봇의 접근을 환영하는 명시적 허용
- `GET /llms.txt`: LLM 크롤러를 위한 마크다운 소개서 제공
- `GET /.well-known/mcp.json`: MCP 디스커버리 엔드포인트 제공

---
*Developed for **Saleplaza** by the Accentist Team.* 🦁
