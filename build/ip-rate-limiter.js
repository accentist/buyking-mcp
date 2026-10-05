"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpRateLimiter = void 0;
const cloudflare_workers_1 = require("cloudflare:workers");
const ip_rate_limit_js_1 = require("./ip-rate-limit.js");
class IpRateLimiter extends cloudflare_workers_1.DurableObject {
    constructor(ctx, env) {
        super(ctx, env);
        this.ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS bucket (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      day TEXT NOT NULL,
      n INTEGER NOT NULL,
      hits TEXT NOT NULL
    )`);
    }
    async consume(countDaily) {
        const now = Date.now();
        const rows = this.ctx.storage.sql.exec("SELECT day, n, hits FROM bucket WHERE id = 1").toArray();
        const current = rows.length
            ? { day: String(rows[0].day), count: Number(rows[0].n), hits: JSON.parse(String(rows[0].hits)) }
            : (0, ip_rate_limit_js_1.emptyLimitState)();
        const decision = (0, ip_rate_limit_js_1.consumeLimit)(current, now, countDaily);
        const next = decision.state;
        this.ctx.storage.sql.exec(`INSERT INTO bucket (id, day, n, hits) VALUES (1, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET day = excluded.day, n = excluded.n, hits = excluded.hits`, next.day, next.count, JSON.stringify(next.hits));
        if (!decision.ok) {
            return { ok: false, scope: decision.scope, retryAfter: decision.retryAfter };
        }
        return { ok: true, dailyRemaining: decision.dailyRemaining };
    }
}
exports.IpRateLimiter = IpRateLimiter;
