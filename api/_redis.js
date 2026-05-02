import { createClient } from 'redis';

let _client;

export async function getRedis() {
  if (_client?.isOpen) return _client;
  _client = createClient({ url: process.env.REDIS_URL });
  await _client.connect();
  return _client;
}

export async function rGet(redis, key) {
  const raw = await redis.get(key);
  return raw ? JSON.parse(raw) : null;
}

export async function rSet(redis, key, value) {
  await redis.set(key, JSON.stringify(value));
}

export async function rDel(redis, key) {
  await redis.del(key);
}
