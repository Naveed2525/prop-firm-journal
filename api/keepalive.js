import { getRedis } from './_redis.js';

const KEY = 'pfj:keepalive';

// Called daily by the Vercel cron in vercel.json. Performs a real write so the
// free Redis database always registers activity and is never deleted as idle.
export default async function handler(req, res) {
  try {
    const redis = await getRedis();
    const at = new Date().toISOString();
    await redis.set(KEY, at);
    return res.status(200).json({ ok: true, at });
  } catch (err) {
    console.error('keepalive failed', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
