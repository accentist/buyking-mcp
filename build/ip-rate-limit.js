"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BURST_WINDOW_MS = exports.BURST_LIMIT = exports.DAILY_LIMIT = void 0;
exports.kstDay = kstDay;
exports.secondsUntilNextKstMidnight = secondsUntilNextKstMidnight;
exports.emptyLimitState = emptyLimitState;
exports.consumeLimit = consumeLimit;
exports.DAILY_LIMIT = 500;
exports.BURST_LIMIT = 30;
exports.BURST_WINDOW_MS = 60_000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
function kstDay(now) {
    const shifted = new Date(now + KST_OFFSET_MS);
    const y = shifted.getUTCFullYear();
    const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
    const d = String(shifted.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}
function secondsUntilNextKstMidnight(now) {
    const shifted = now + KST_OFFSET_MS;
    const nextMidnight = (Math.floor(shifted / DAY_MS) + 1) * DAY_MS;
    return Math.max(1, Math.ceil((nextMidnight - shifted) / 1000));
}
function emptyLimitState() {
    return { day: "", count: 0, hits: [] };
}
// POST /message 는 항상 1분 창에 남긴다.
// countDaily 가 true 일 때만 한국시간 하루 상품 조회 횟수를 올린다.
function consumeLimit(state, now, countDaily) {
    const day = kstDay(now);
    const hits = state.hits.filter((ts) => now - ts < exports.BURST_WINDOW_MS);
    const count = state.day === day ? state.count : 0;
    if (hits.length >= exports.BURST_LIMIT) {
        const oldest = hits[0];
        const retryAfter = Math.max(1, Math.ceil((oldest + exports.BURST_WINDOW_MS - now) / 1000));
        return { ok: false, scope: "minute", retryAfter, state: { day, count, hits } };
    }
    const nextHits = [...hits, now];
    if (countDaily && count >= exports.DAILY_LIMIT) {
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
        dailyRemaining: exports.DAILY_LIMIT - nextCount,
        state: { day, count: nextCount, hits: nextHits },
    };
}
