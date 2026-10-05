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

// ─── 검색어 언어 자동 감지 ───────────────────────────────────────────────────────
function detectLanguage(text: string): 'ko' | 'en' | 'ja' {
  // 1. 한국어 (가-힣)
  if (/[가-힣]/.test(text)) return 'ko';
  
  // 2. 일본어 (히라가나, 가타카나, 기본 한자)
  if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)) return 'ja';
  
  // 3. 알파벳 (영어)
  if (/[a-zA-Z]/.test(text)) return 'en';
  
  // 4. 기본값
  return 'ko';
}

// ─── 국가코드 플래그 (GLOBAL 모드용, currency 기반) ────────────────────────────
function getRegionFlag(currency?: string): string {
  if (currency === 'USD') return '🇺🇸US';
  if (currency === 'JPY') return '🇯🇵JP';
  return '🇰🇷KR';
}

// ─── 제목 선택 ────────────────────────────────────────────────────────────────
// title_en, title_ja는 미사용 컬럼이다. 모든 국가는 title만 반환한다.
function getTitle(item: any): string {
  return item.title || item.TITLE || '';
}

// ─── 핵심 검색 함수 (region/lang/currency 인식형) ────────────────────────────────
export const searchBuykingSemantic = async ({
  keyword,
  category,
  platform,
  sort,
  region,
  lang: defaultLang = 'ko',
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
  const isGlobal = !region || region === 'GLOBAL';
  // GLOBAL 검색일 경우 키워드의 언어를 감지하여 페르소나 언어 덮어쓰기
  const finalLang = isGlobal ? detectLanguage(keyword) : defaultLang;
  
  const persona = PERSONA[finalLang] || PERSONA.ko;

  try {
    let products: any[];
    const isCountry = region === 'KR' || region === 'US' || region === 'JP';

    if (isCountry) {
      // 사이트 전체 탭과 동일. keywords에 입력어만 넣어 동의어 확장을 막는다.
      // region은 PRODUCT_SHIPPING_REGIONS.region_code로 그 국가 배송 상품만 남긴다.
      const resp = await fetch('https://api.saleplaza.com/api/public/products/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          search: keyword,
          keywords: [keyword],
          region,
          platform: platform || 'all_rank',
          category: category || 'all',
          date: 'all',
          sort: sort || 'newest',
          page: 1,
          per_page: 20,
          include_today: true,
        }),
      });
      const json = (await resp.json()) as any;
      products = json.products || json.data || [];
    } else {
      const targetUrl = new URL("https://saleplaza.com/api/products");
      targetUrl.searchParams.set("search", keyword);
      targetUrl.searchParams.set("per_page", "20");
      targetUrl.searchParams.set("region", region || "GLOBAL");

      if (category) targetUrl.searchParams.set("category", category);
      if (platform) targetUrl.searchParams.set("platform", platform);
      if (sort) targetUrl.searchParams.set("sort", sort);

      const resp = await fetch(targetUrl.toString());
      const json = (await resp.json()) as any;
      products = json.products || json.data || [];
    }

    if (products.length === 0) {
      return {
        content: [{ type: "text" as const, text: persona.noResult }]
      };
    }

    // ── [언어별 우선순위 정렬 로직] ──
    // 영어(en) -> USD 우선, 일본어(ja) -> JPY 우선, 한국어(ko) -> KRW 우선
    if (isGlobal && products.length > 0) {
      products.sort((a: any, b: any) => {
        const aCur = a.currency || a.CURRENCY || 'KRW';
        const bCur = b.currency || b.CURRENCY || 'KRW';
        
        let aScore = 0;
        let bScore = 0;
        
        if (finalLang === 'en') {
          aScore = aCur === 'USD' ? 2 : (aCur === 'KRW' ? 1 : 0);
          bScore = bCur === 'USD' ? 2 : (bCur === 'KRW' ? 1 : 0);
        } else if (finalLang === 'ja') {
          aScore = aCur === 'JPY' ? 2 : (aCur === 'KRW' ? 1 : 0);
          bScore = bCur === 'JPY' ? 2 : (bCur === 'KRW' ? 1 : 0);
        } else {
          aScore = aCur === 'KRW' ? 2 : (aCur === 'USD' ? 1 : 0);
          bScore = bCur === 'KRW' ? 2 : (bCur === 'USD' ? 1 : 0);
        }
        
        return bScore - aScore; // 점수 내림차순 정렬
      });
    }

    // 상위 5개만 추출
    products = products.slice(0, 5);

    let markdown = persona.intro(keyword);

    for (const item of products) {
      const originalPrice = item.original_price || item.ORIGINAL_PRICE || item.price || item.PRICE;
      const currentPrice = item.price || item.PRICE;
      const title = getTitle(item);
      const currency = item.currency || item.CURRENCY || 'KRW';
      const productId = item.id || item.ID;

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
      markdown += `- 상품 ID: ${productId}\n`;

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

      markdown += `- [${persona.cta}](https://saleplaza.com/${productId})\n\n`;
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

// ─── 단건 상세 (result_detail_GLOBAL) ───────────────────────────────────────────
type DetailLang = 'ko' | 'en' | 'ja';

const DETAIL_LABELS: Record<DetailLang, {
  intro: (id: string) => string;
  id: string;
  title: string;
  country: string;
  platform: string;
  category: string;
  image: string;
  saleplaza: string;
  buyLink: string;
  originalPrice: string;
  currentPrice: string;
  discount: string;
  targetPrice: string;
  history: string;
  noHistory: string;
  lowest: string;
  highest: string;
  vsFirst: string;
  dealStatus: string;
  dealCheckedAt: string;
  spScore: string;
  dealchelin: string;
  customerGrade: string;
  buykingComment: string;
  recommendReason: string;
  clicks: string;
  likes: string;
  dislikes: string;
  opinions: string;
  createdAt: string;
  none: string;
  star: (n: number) => string;
}> = {
  ko: {
    intro: (id) => `크하하! 짐은 세일프라자의 쇼핑 지배자, 사자왕 Bㅏ이킹이다!\n상품 ID ${id}의 상세 전리품을 펼쳐 보이노라!\n\n`,
    id: '상품 ID',
    title: '제목',
    country: '배송가능국가',
    platform: '플랫폼',
    category: '카테고리',
    image: '이미지',
    saleplaza: '세일프라자',
    buyLink: '구매 링크',
    originalPrice: '원래 가격',
    currentPrice: '지금 혜택가',
    discount: '할인',
    targetPrice: '목표가',
    history: '가격 히스토리',
    noHistory: '아직 기록된 가격 히스토리가 없다',
    lowest: '기간 내 최저가',
    highest: '기간 내 최고가',
    vsFirst: '첫 기록 대비 현재가',
    dealStatus: '딜 상태',
    dealCheckedAt: '딜 확인 시각',
    spScore: 'SP Score',
    dealchelin: '딜슐랭',
    customerGrade: '고객 등급',
    buykingComment: 'Bㅏ이킹 曰',
    recommendReason: '추천 이유',
    clicks: '클릭 수',
    likes: '좋아요',
    dislikes: '싫어요',
    opinions: '의견 수',
    createdAt: '등록 시각',
    none: '없음',
    star: (n) => `${n}성`,
  },
  en: {
    intro: (id) => `Roar! I am BuyKing, the Shopping Conqueror of Saleplaza!\nHere is the full loot for product ID ${id}!\n\n`,
    id: 'Product ID',
    title: 'Title',
    country: 'Ships to',
    platform: 'Platform',
    category: 'Category',
    image: 'Image',
    saleplaza: 'Saleplaza',
    buyLink: 'Buy link',
    originalPrice: 'Original',
    currentPrice: 'Deal Price',
    discount: 'Discount',
    targetPrice: 'Target price',
    history: 'Price history',
    noHistory: 'No price history recorded yet',
    lowest: 'Lowest in range',
    highest: 'Highest in range',
    vsFirst: 'Current vs first record',
    dealStatus: 'Deal status',
    dealCheckedAt: 'Deal checked at',
    spScore: 'SP Score',
    dealchelin: 'Dealchelin',
    customerGrade: 'Customer grade',
    buykingComment: 'BuyKing says',
    recommendReason: 'Recommend reason',
    clicks: 'Clicks',
    likes: 'Likes',
    dislikes: 'Dislikes',
    opinions: 'Opinions',
    createdAt: 'Listed at',
    none: 'none',
    star: (n) => `${n}-star`,
  },
  ja: {
    intro: (id) => `ガハハ！余はセールプラザのショッピング支配者、獅子王バイキングである！\n商品ID ${id}の詳細な戦利品を見よ！\n\n`,
    id: '商品ID',
    title: 'タイトル',
    country: '配送可能国',
    platform: 'プラットフォーム',
    category: 'カテゴリ',
    image: '画像',
    saleplaza: 'セールプラザ',
    buyLink: '購入リンク',
    originalPrice: '元の価格',
    currentPrice: '特価',
    discount: '割引',
    targetPrice: '目標価格',
    history: '価格履歴',
    noHistory: 'まだ価格履歴の記録はない',
    lowest: '期間内最安値',
    highest: '期間内最高値',
    vsFirst: '最初の記録と比べた現在価格',
    dealStatus: 'ディール状態',
    dealCheckedAt: 'ディール確認時刻',
    spScore: 'SP Score',
    dealchelin: 'ディールシュラン',
    customerGrade: '顧客グレード',
    buykingComment: 'バイキング曰く',
    recommendReason: 'おすすめ理由',
    clicks: 'クリック数',
    likes: 'いいね',
    dislikes: 'よくない',
    opinions: '意見数',
    createdAt: '登録日時',
    none: 'なし',
    star: (n) => `${n}つ星`,
  },
};

// PRODUCT_SHIPPING_REGIONS.region_code 와 같은 값. 지금은 currency로만 분류한다.
function shippingRegionCode(currency: string): string {
  if (currency === 'KRW') return 'KR';
  if (currency === 'USD') return 'US';
  if (currency === 'JPY') return 'JP';
  return '';
}

function langFromCurrency(currency: string): DetailLang {
  if (currency === 'USD') return 'en';
  if (currency === 'JPY') return 'ja';
  return 'ko';
}

function isPubliclyVisible(product: any): boolean {
  const value = product?.is_visible ?? product?.IS_VISIBLE;
  return value === 1 || value === true || value === '1';
}

function pickDetailImage(product: any): string {
  const origin = product.origin_img_url || product.ORIGIN_IMG_URL || '';
  return origin ? String(origin) : '';
}

function saleplazaProductUrl(id: string, currency: string): string {
  if (currency === 'USD') return `https://saleplaza.com/en/${id}`;
  if (currency === 'JPY') return `https://saleplaza.com/ja/${id}`;
  return `https://saleplaza.com/${id}`;
}

function formatMoney(amount: unknown, currency: string): string | null {
  const n = Number(amount);
  if (!Number.isFinite(n)) return null;
  return `${currency} ${n.toLocaleString('en-US')}`;
}

function displayValue(value: unknown, none: string): string {
  if (value === null || value === undefined || value === '') return none;
  return String(value);
}

function parsePriceHistory(raw: unknown): Array<{ date: string; price: number }> {
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((row) => row && row.date && Number.isFinite(Number(row.price)))
      .map((row) => ({ date: String(row.date), price: Number(row.price) }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return [];
  }
}

function dealchelinStar(spScore: unknown): number {
  const score = Number(spScore);
  if (!Number.isFinite(score)) return 1;
  if (score >= 85) return 3;
  if (score >= 70) return 2;
  return 1;
}

function formatProductDetail(product: any, id: string): string {
  const currency = String(product.currency || product.CURRENCY || 'KRW');
  const lang = langFromCurrency(currency);
  const label = DETAIL_LABELS[lang];
  const country = shippingRegionCode(currency);
  const title = getTitle(product);
  const image = pickDetailImage(product);
  const history = parsePriceHistory(product.price_history || product.PRICE_HISTORY);
  const currentPrice = Number(product.price ?? product.PRICE);
  const originalPrice = product.original_price ?? product.ORIGINAL_PRICE;
  const lines: string[] = [label.intro(id)];

  const push = (name: string, value: string) => {
    lines.push(`- ${name}: ${value}`);
  };

  push(label.id, id);
  push(label.title, title || label.none);
  push(label.country, country || label.none);
  push(label.platform, displayValue(product.platform || product.PLATFORM, label.none));
  push(label.category, displayValue(product.category || product.CATEGORY, label.none));
  push(label.image, image || label.none);
  push(label.saleplaza, saleplazaProductUrl(id, currency));
  push(label.buyLink, displayValue(product.link || product.LINK, label.none));
  push(label.originalPrice, formatMoney(originalPrice, currency) || label.none);
  push(label.currentPrice, formatMoney(currentPrice, currency) || label.none);

  const discountRaw = product.discount ?? product.DISCOUNT;
  const discountNum = Number(discountRaw);
  push(label.discount, Number.isFinite(discountNum) ? `${discountNum}%` : label.none);
  push(label.targetPrice, formatMoney(product.target_price ?? product.TARGET_PRICE, currency) || label.none);

  if (history.length === 0) {
    push(label.history, label.noHistory);
  } else {
    const historyLines = history.map((row) => `  - ${row.date}: ${formatMoney(row.price, currency)}`).join('\n');
    lines.push(`- ${label.history}:\n${historyLines}`);
    const prices = history.map((row) => row.price);
    push(label.lowest, formatMoney(Math.min(...prices), currency) || label.none);
    push(label.highest, formatMoney(Math.max(...prices), currency) || label.none);
    if (Number.isFinite(currentPrice)) {
      const diff = currentPrice - history[0].price;
      const sign = diff > 0 ? '+' : '';
      push(label.vsFirst, `${currency} ${sign}${diff.toLocaleString('en-US')}`);
    }
  }

  push(label.dealStatus, displayValue(product.deal_status || product.DEAL_STATUS, label.none));
  push(label.dealCheckedAt, displayValue(product.deal_checked_at || product.DEAL_CHECKED_AT, label.none));
  push(label.spScore, displayValue(product.sp_score ?? product.SP_SCORE, label.none));
  push(label.dealchelin, label.star(dealchelinStar(product.sp_score ?? product.SP_SCORE)));
  push(label.customerGrade, displayValue(product.customer_grade || product.CUSTOMER_GRADE, label.none));
  push(label.buykingComment, displayValue(product.buyking_comment || product.BUYKING_COMMENT, label.none));
  push(label.recommendReason, displayValue(product.recommend_reason || product.RECOMMEND_REASON, label.none));
  push(label.clicks, displayValue(product.click_count ?? product.CLICK_COUNT, label.none));
  push(label.likes, displayValue(product.likes_count ?? product.LIKES_COUNT, label.none));
  push(label.dislikes, displayValue(product.dislikes_count ?? product.DISLIKES_COUNT, label.none));
  push(label.opinions, displayValue(product.opinion_cnt ?? product.OPINION_CNT, label.none));
  push(label.createdAt, displayValue(product.created_at || product.CREATED_AT, label.none));

  return lines.join('\n').trim();
}

export const getBuykingProductDetail = async ({ id }: { id: string | number }) => {
  const persona = PERSONA.ko;
  const idStr = String(id ?? '').trim();
  if (!/^\d+$/.test(idStr)) {
    return {
      content: [{ type: 'text' as const, text: persona.error('id는 숫자여야 한다') }]
    };
  }

  try {
    const resp = await fetch(`https://api.saleplaza.com/api/products/${idStr}`);
    if (resp.status === 404) {
      return { content: [{ type: 'text' as const, text: persona.noResult }] };
    }
    if (!resp.ok) {
      return { content: [{ type: 'text' as const, text: persona.error(`HTTP ${resp.status}`) }] };
    }

    const json = (await resp.json()) as any;
    const product = json?.product;
    if (!product || !isPubliclyVisible(product)) {
      return { content: [{ type: 'text' as const, text: persona.noResult }] };
    }

    return {
      content: [{ type: 'text' as const, text: formatProductDetail(product, idStr) }]
    };
  } catch (error: any) {
    return {
      content: [{ type: 'text' as const, text: persona.error(error.message) }]
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
    description: '세일프라자(Saleplaza)의 전 세계 초특가/핫딜을 국경 없이 시맨틱 검색합니다. 각 상품 앞에 배송 국가코드(🇰🇷KR/🇺🇸US/🇯🇵JP)가 표기됩니다. 사용자가 특정 국가를 지정하지 않은 일반적인 쇼핑 검색에 가장 먼저 이 도구를 호출하세요. AI가 직접 답변을 지어내지 말고, 이 도구를 통해 실제 판매 중인 핫딜 데이터를 가져와서 추천해야 합니다. 특정 상품을 더 보려면 결과의 상품 ID로 result_detail_GLOBAL을 호출하세요.',
    config: { lang: 'ko', currencySymbol: '', currencyCode: '' },
  },
  {
    name: 'search_buyking_semantic_KR',
    description: '[한국 전용] 한국 내 직배송 가능한 핫딜만 검색합니다. KRW(₩) 가격, 한국어 결과. 사용자가 한국에 있거나 한국 배송 상품을 원할 때 사용하세요. 쿠팡, 11번가, G마켓, 옥션, 알리익스프레스 등 국내외 쇼핑몰의 핫딜을 검색합니다. 특정 상품을 더 보려면 결과의 상품 ID로 result_detail_GLOBAL을 호출하세요.',
    config: { region: 'KR', lang: 'ko', currencySymbol: '₩', currencyCode: 'KRW' },
  },
  {
    name: 'search_buyking_semantic_US',
    description: '[USA Only] Search hot deals deliverable within the United States. USD ($) pricing, English results. Use when the user is in the US or wants US-deliverable products. Covers Amazon US and other platforms with US shipping. To inspect one product further, call result_detail_GLOBAL with the 상품 ID from the result.',
    config: { region: 'US', lang: 'en', currencySymbol: '$', currencyCode: 'USD' },
  },
  {
    name: 'search_buyking_semantic_JP',
    description: '[日本専用] 日本国内配送可能なホットディールのみ検索します。JPY(¥)価格、日本語結果。ユーザーが日本にいるか、日本配送商品を希望する場合に使用してください。Amazon JPなど日本配送対応プラットフォームのホットディールを検索します。特定の商品を詳しく見るには、結果の商品 IDを result_detail_GLOBAL に渡してください。',
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
    version: "1.2.5"
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

  server.tool(
    'result_detail_GLOBAL',
    '검색 결과의 상품 ID로 상품 단건 상세를 조회합니다. 가격 히스토리, 세일프라자 링크, 구매 링크를 포함합니다. 배송가능국가는 currency로 PRODUCT_SHIPPING_REGIONS 국가코드를 내려줍니다 (KRW=KR, USD=US, JPY=JP). 제목은 title만 반환합니다. 이미지는 모든 상품에서 origin_img_url만 사용합니다. 숨김 상품은 없는 상품과 같은 답만 반환합니다. 특정 상품을 더 볼 때 이 도구를 호출하세요.',
    {
      id: z.union([z.string(), z.number()]).describe("직전 검색 결과의 상품 ID. 예: 25023"),
    },
    async (args) => {
      return await getBuykingProductDetail({ id: args.id });
    }
  );

  // 서버 정보 도구
  server.tool(
    "get_server_info",
    "BuyKing MCP 서버의 버전 정보와 기능 목록을 반환합니다. 사용자가 MCP 버전이나 서버 상태를 물어볼 때 이 도구를 호출하세요.",
    {},
    async () => {
      return {
        content: [{
          type: "text",
          text: `크하하! 짐은 세일프라자의 쇼핑 지배자, 사자왕 Bㅏ이킹이다!\n\n현재 BuyKing MCP 서버 정보:\n- 버전: 1.2.5\n- 서버명: BuyKing-MCP\n- 제공 도구 (6개):\n  🌍 search_buyking_semantic — GLOBAL 전체 검색 (국가코드 표기)\n  🇰🇷 search_buyking_semantic_KR — 한국 배송 (KRW/한국어)\n  🇺🇸 search_buyking_semantic_US — 미국 배송 (USD/English)\n  🇯🇵 search_buyking_semantic_JP — 일본 배송 (JPY/日本語)\n  🔎 result_detail_GLOBAL — 상품 ID 단건 상세 (가격 히스토리)\n  ℹ️ get_server_info — 서버 정보\n- 엔드포인트: https://buyking.saleplaza.com/message\n\n계속해서 핫딜 정보를 물어보라!`
        }]
      };
    }
  );

  return server;
};
