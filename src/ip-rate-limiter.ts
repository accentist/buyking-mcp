import { DurableObject } from "cloudflare:workers";
import { consumeLimit, emptyLimitState, type LimitState } from "./ip-rate-limit.js";

type BucketRow = { day: string; n: number; hits: string };

export class IpRateLimiter extends DurableObject {
  constructor(ctx: DurableObjectState, env: Cloudflare.Env) {
    super(ctx, env);
    this.ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS bucket (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      day TEXT NOT NULL,
      n INTEGER NOT NULL,
      hits TEXT NOT NULL
    )`);
  }

  async consume(countDaily: boolean): Promise<
    | { ok: true; dailyRemaining: number }
    | { ok: false; scope: "minute" | "day"; retryAfter: number }
  > {
    const now = Date.now();
    const rows = this.ctx.storage.sql.exec<BucketRow>(
      "SELECT day, n, hits FROM bucket WHERE id = 1"
    ).toArray();

    const current: LimitState = rows.length
      ? { day: String(rows[0].day), count: Number(rows[0].n), hits: JSON.parse(String(rows[0].hits)) as number[] }
      : emptyLimitState();

    const decision = consumeLimit(current, now, countDaily);
    const next = decision.state;
    this.ctx.storage.sql.exec(
      `INSERT INTO bucket (id, day, n, hits) VALUES (1, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET day = excluded.day, n = excluded.n, hits = excluded.hits`,
      next.day,
      next.count,
      JSON.stringify(next.hits),
    );

    if (!decision.ok) {
      return { ok: false, scope: decision.scope, retryAfter: decision.retryAfter };
    }
    return { ok: true, dailyRemaining: decision.dailyRemaining };
  }
}
