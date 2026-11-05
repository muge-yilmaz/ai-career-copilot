import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Upstash Redis istemcisi
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

// Dakikada maksimum 10 isteğe izin veren Rate Limiter konfigürasyonu
export const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 1 dakikalık pencerede 10 istek
  analytics: true,
});

export async function enforceRateLimit(identifier: string): Promise<Response | null> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return Response.json(
      { error: "Rate limiting is unavailable." },
      { status: 503 }
    );
  }

  const { success, reset } = await ratelimit.limit(identifier);
  if (!success) {
    return Response.json(
      {
        error: "Too many requests. Please try again later.",
        code: "rate_limited",
        reset,
      },
      { status: 429 }
    );
  }
  return null;
}