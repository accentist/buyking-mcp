export const DAILY_LIMIT = 500;
export const BURST_LIMIT = 30;
export const BURST_WINDOW_MS = 60_000;

export type LimitState = {
  day: string;
  count: number;
  hits: number[];
};

export type LimitDecision =
  | { ok: true; state: LimitState; dailyRemaining: number }
  | { ok: false; state: LimitState; scope: "minute" | "day"; retryAfter: number };

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function kstDay(now: number): string {
  const shifted = new Date(now + KST_OFFSET_MS);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function secondsUntilNextKstMidnight(now: number): number {
  const shifted = now + KST_OFFSET_MS;
  const nextMidnight = (Math.floor(shifted / DAY_MS) + 1) * DAY_MS;
  return Math.max(1, Math.ceil((nextMidnight - shifted) / 1000));
}

export function emptyLimitState(): LimitState {
  return { day: "", count: 0, hits: [] };
}

// POST /message 는 항상 1분 창에 남긴다.
// countDaily 가 true 일 때만 한국시간 하루 상품 조회 횟수를 올린다.
export function consumeLimit(state: LimitState, now: number, countDaily: boolean): LimitDecision {
  const day = kstDay(now);
  const hits = state.hits.filter((ts) => now - ts < BURST_WINDOW_MS);
  const count = state.day === day ? state.count : 0;

  if (hits.length >= BURST_LIMIT) {
    const oldest = hits[0];
    const retryAfter = Math.max(1, Math.ceil((oldest + BURST_WINDOW_MS - now) / 1000));
    return { ok: false, scope: "minute", retryAfter, state: { day, count, hits } };
  }

  const nextHits = [...hits, now];
  if (countDaily && count >= DAILY_LIMIT) {
    return {
      ok: false,
      scope: "day",
      retryAfter: secondsUntilNextKstMidnight(now),
      state: { day, count, hits: nextHits },
    };
  }

  const nextCount = countDaily ? count + 1 : count;
  return {
    ok: true,
    dailyRemaining: DAILY_LIMIT - nextCount,
    state: { day, count: nextCount, hits: nextHits },
  };
}
