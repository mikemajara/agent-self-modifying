import { Redis } from "@upstash/redis";

let client: Redis | undefined;

export function hasRedisConfig(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

export function getRedis(): Redis {
  if (client) return client;
  if (!hasRedisConfig()) {
    throw new Error(
      "Upstash Redis is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (run npm run setup).",
    );
  }
  client = Redis.fromEnv();
  return client;
}
