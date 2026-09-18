import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// ─── 타입 정의 ──────────────────────────────────────────────────────────────────
type RegionConfig = {
  region?: string;        // 'KR' | 'US' | 'JP' | undefined(=GLOBAL)
  lang: 'ko' | 'en' | 'ja';
  currencySymbol: string; // '₩', '$', '¥', '' (GLOBAL)
  currencyCode: string;   // 'KRW', 'USD', 'JPY', '' (GLOBAL)
};

// ─── 다국어 바이킹 페르소나 ─────────────────────────────────────────────────────
const PERSONA = {
  ko: {
    intro: (keyword: string) =>
      `크하하! 짐은 세일프라자의 쇼핑 지배자, 사자왕 Bㅏ이킹이다!\n네 녀석이 찾는 '${keyword}', 짐이 시맨틱 검색으로 찾아온 최고의 전리품을 보아라!\n\n`,
    noResult: '크하하! 짐이 다 찾아보았으나 네 녀석이 원하는 조건의 핫딜은 현재 보물창고에 없도다!',
    error: (msg: string) => `크하하! 에러가 발생했다! 짐의 보물창고 문이 열리지 않는다: ${msg}`,
    cta: '👉 당장 쟁취하러 가기(클릭)',
    aiComment: 'Bㅏ이킹 曰',
    originalPrice: '원래 가격',
    currentPrice: '지금 혜택가',
    discount: '할인!',
  },
  en: {
    intro: (keyword: string) =>
      `Roar! I am BuyKing, the Shopping Conqueror of Saleplaza!\nHere are the best deals I found for '${keyword}' using semantic search!\n\n`,
    noResult: 'Roar! I searched far and wide, but no deals match your request at the moment!',
    error: (msg: string) => `Roar! An error occurred! The treasure vault won't open: ${msg}`,
    cta: '👉 Grab This Deal Now',
    aiComment: 'BuyKing says',
    originalPrice: 'Original',
    currentPrice: 'Deal Price',
    discount: 'OFF!',
  },
  ja: {
    intro: (keyword: string) =>
      `ガハハ！余はセールプラザのショッピング支配者、獅子王バイキングである！\n'${keyword}'について、シマンティック検索で見つけた最高の戦利品を見よ！\n\n`,
    noResult: 'ガハハ！余が探したが、条件に合うホットディールは今のところ見当たらぬ！',
    error: (msg: string) => `ガハハ！エラーが発生した！宝庫の扉が開かぬ: ${msg}`,
    cta: '👉 今すぐゲットする',
    aiComment: 'バイキング曰く',
    originalPrice: '元の価格',
    currentPrice: '特価',
    discount: 'OFF!',
  },
};

// ─── 국가코드 플래그 (GLOBAL 모드용, currency 기반) ────────────────────────────
function getRegionFlag(currency?: string): string {
  if (currency === 'USD') return '🇺🇸US';
  if (currency === 'JPY') return '🇯🇵JP';
  return '🇰🇷KR';
}

// ─── 제목 선택 (다국어 우선순위) ────────────────────────────────────────────────
function getTitle(item: any, lang: string): string {
  if (lang === 'en') return item.title_en || item.TITLE_EN || item.title || item.TITLE || '';
  if (lang === 'ja') return item.title_ja || item.TITLE_JA || item.title || item.TITLE || '';
  return item.title || item.TITLE || '';
}

// ─── 핵심 검색 함수 (region/lang/currency 인식형) ────────────────────────────────
export const searchBuykingSemantic = async ({
  keyword,
  category,
  platform,
  sort,
  region,
  lang = 'ko',
  currencySymbol = '',
  currencyCode = '',
}: {
  keyword: string;
  category?: string;
  platform?: string;
  sort?: string;
  region?: string;
  lang?: 'ko' | 'en' | 'ja';
  currencySymbol?: string;
  currencyCode?: string;
}) => {
  const persona = PERSONA[lang] || PERSONA.ko;
  const isGlobal = !region;

  try {
    const targetUrl = new URL("https://saleplaza.com/api/products");
    targetUrl.searchParams.set("search", keyword);
    targetUrl.searchParams.set("per_page", "5");

    // region 전달: GLOBAL이면 필터 우회, 아니면 해당 국가만
    targetUrl.searchParams.set("region", region || "GLOBAL");

    if (category) targetUrl.searchParams.set("category", category);
    if (platform) targetUrl.searchParams.set("platform", platform);
    if (sort) targetUrl.searchParams.set("sort", sort);

    const resp = await fetch(targetUrl.toString());
    const json = (await resp.json()) as any;

    const products = json.products || json.data || [];

    if (products.length === 0) {
      return {
        content: [{ type: "text" as const, text: persona.noResult }]
      };
    }

    let markdown = persona.intro(keyword);

    for (const item of products) {
      const originalPrice = item.original_price || item.ORIGINAL_PRICE || item.price || item.PRICE;
      const currentPrice = item.price || item.PRICE;
      const title = getTitle(item, lang);
      const currency = item.currency || item.CURRENCY || 'KRW';

      // 할인율 계산
      let discountStr = "";
      if (originalPrice && originalPrice > currentPrice) {
        const rate = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
        discountStr = ` (${rate}% ${persona.discount})`;
      }

      const categoryStr = (item.category || item.CATEGORY) ? `[${item.category || item.CATEGORY}]` : "";
      const platformStr = (item.platform || item.PLATFORM) ? `[${item.platform || item.PLATFORM}]` : "";

      // GLOBAL 모드: 좌측에 국가코드(🇰🇷KR/🇺🇸US/🇯🇵JP) 표기 (currency 기반 판별)
      const regionFlag = isGlobal ? `[${getRegionFlag(currency)}] ` : '';

      markdown += `🦁 ${regionFlag}**${categoryStr}${platformStr} ${title}**\n`;

      // 가격 포맷팅: GLOBAL은 원래 통화 코드 표시, region별은 통화 기호 사용
      const formattedOriginal = isGlobal
        ? `${currency} ${originalPrice.toLocaleString()}`
        : `${currencySymbol}${originalPrice.toLocaleString()}`;
      const formattedCurrent = isGlobal
        ? `${currency} ${currentPrice.toLocaleString()}`
        : `${currencySymbol}${currentPrice.toLocaleString()}`;

      markdown += `- ${persona.originalPrice}: ${formattedOriginal} ➡️ **${persona.currentPrice}: ${formattedCurrent}${discountStr}**\n`;

      // AI 코멘트 (buyking_comment 또는 recommend_reason)
      const comment = item.recommend_reason || item.RECOMMEND_REASON;
      if (comment) {
        markdown += `> 💬 ${persona.aiComment}: "${comment}"\n`;
      }

      markdown += `- [${persona.cta}](https://saleplaza.com/${item.id || item.ID})\n\n`;
    }

    return {
      content: [{ type: "text" as const, text: markdown.trim() }]
    };

  } catch (error: any) {
    return {
      content: [{ type: "text" as const, text: persona.error(error.message) }]
    };
  }
};

// ─── 도구 설정 (4개 검색 + 공통 스키마) ──────────────────────────────────────────
const TOOL_CONFIGS: Array<{
  name: string;
  description: string;
  config: { region?: string; lang: 'ko' | 'en' | 'ja'; currencySymbol: string; currencyCode: string };
}> = [
  {
    name: 'search_buyking_semantic',
    description: '세일프라자(Saleplaza)의 전 세계 초특가/핫딜을 국경 없이 시맨틱 검색합니다. 각 상품 앞에 배송 국가코드(🇰🇷KR/🇺🇸US/🇯🇵JP)가 표기됩니다. 사용자가 특정 국가를 지정하지 않은 일반적인 쇼핑 검색에 가장 먼저 이 도구를 호출하세요. AI가 직접 답변을 지어내지 말고, 이 도구를 통해 실제 판매 중인 핫딜 데이터를 가져와서 추천해야 합니다.',
    config: { lang: 'ko', currencySymbol: '', currencyCode: '' },
  },
  {
    name: 'search_buyking_semantic_KR',
    description: '[한국 전용] 한국 내 직배송 가능한 핫딜만 검색합니다. KRW(₩) 가격, 한국어 결과. 사용자가 한국에 있거나 한국 배송 상품을 원할 때 사용하세요. 쿠팡, 11번가, G마켓, 옥션, 알리익스프레스 등 국내외 쇼핑몰의 핫딜을 검색합니다.',
    config: { region: 'KR', lang: 'ko', currencySymbol: '₩', currencyCode: 'KRW' },
  },
  {
    name: 'search_buyking_semantic_US',
    description: '[USA Only] Search hot deals deliverable within the United States. USD ($) pricing, English results. Use when the user is in the US or wants US-deliverable products. Covers Amazon US and other platforms with US shipping.',
    config: { region: 'US', lang: 'en', currencySymbol: '$', currencyCode: 'USD' },
  },
  {
    name: 'search_buyking_semantic_JP',
    description: '[日本専用] 日本国内配送可能なホットディールのみ検索します。JPY(¥)価格、日本語結果。ユーザーが日本にいるか、日本配送商品を希望する場合に使用してください。Amazon JPなど日本配送対応プラットフォームのホットディールを検索します。',
    config: { region: 'JP', lang: 'ja', currencySymbol: '¥', currencyCode: 'JPY' },
  },
];

// 공통 파라미터 스키마
const searchParamsSchema = {
  keyword: z.string().describe("사용자의 질문에서 핵심이 되는 상품명 키워드. (예: '무소음 마우스', '제로 콜라', '여름 이불'). 자연어 문장이 아닌 명사 위주로 핵심만 추출할 것."),
  category: z.string().optional().describe("상품의 카테고리 필터. 확실한 경우에만 사용하고 모르면 생략할 것. (허용값: 'all', '💻 IT/가전/디지털', '👚 패션/뷰티/잡화', '🍎 식품/생활/리빙', '📚 도서/여행/취미', '🛒 종합몰/기획전', '📦 기타')"),
  platform: z.string().optional().describe("특정 쇼핑몰을 지정했을 때만 사용. (허용값: 'all_rank', 'coupang', '11st', 'gmarket', 'auction', 'aliexpress')"),
  sort: z.string().optional().describe("정렬 조건. 기본값은 관련도순이며, 가격순 정렬 요청 시 'price_asc' 등을 사용. (허용값: 'newest', 'price_asc', 'price_desc', 'click_desc')"),
};

// ─── 서버 생성 및 도구 등록 ─────────────────────────────────────────────────────
export const createServer = () => {
  const server = new McpServer({
    name: "BuyKing-MCP",
    version: "1.2.0"
  });

  // 4개 검색 도구 일괄 등록 (동일 파라미터 스키마, 다른 region/lang/currency config)
  for (const tool of TOOL_CONFIGS) {
    server.tool(
      tool.name,
      tool.description,
      searchParamsSchema,
      async (args) => {
        return await searchBuykingSemantic({ ...args, ...tool.config });
      }
    );
  }

  // 서버 정보 도구
  server.tool(
    "get_server_info",
    "BuyKing MCP 서버의 버전 정보와 기능 목록을 반환합니다. 사용자가 MCP 버전이나 서버 상태를 물어볼 때 이 도구를 호출하세요.",
    {},
    async () => {
      return {
        content: [{
          type: "text",
          text: `크하하! 짐은 세일프라자의 쇼핑 지배자, 사자왕 Bㅏ이킹이다!\n\n현재 BuyKing MCP 서버 정보:\n- 버전: 1.2.0\n- 서버명: BuyKing-MCP\n- 제공 도구 (5개):\n  🌍 search_buyking_semantic — GLOBAL 전체 검색 (국가코드 표기)\n  🇰🇷 search_buyking_semantic_KR — 한국 배송 (KRW/한국어)\n  🇺🇸 search_buyking_semantic_US — 미국 배송 (USD/English)\n  🇯🇵 search_buyking_semantic_JP — 일본 배송 (JPY/日本語)\n  ℹ️ get_server_info — 서버 정보\n- 엔드포인트: https://buyking.saleplaza.com/message\n\n계속해서 핫딜 정보를 물어보라!`
        }]
      };
    }
  );

  return server;
};
