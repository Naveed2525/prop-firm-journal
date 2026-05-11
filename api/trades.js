import { getRedis, rGet, rSet } from './_redis.js';

function key(accountId) { return `pfj:trades:${accountId}`; }

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const redis = await getRedis();

    if (req.method === 'GET') {
      const { accountId } = req.query;
      if (!accountId) return res.status(400).json({ error: 'accountId required' });
      const trades = (await rGet(redis, key(accountId))) ?? [];
      return res.status(200).json(trades);
    }

    if (req.method === 'POST') {
      const { accountId, ...rest } = req.body;
      if (!accountId) return res.status(400).json({ error: 'accountId required' });
      const trades = (await rGet(redis, key(accountId))) ?? [];
      const tradeNumber = trades.length > 0 ? Math.max(...trades.map((t) => t.tradeNumber ?? 0)) + 1 : 1;
      const trade = { id: crypto.randomUUID(), accountId, ...rest, tradeNumber, createdAt: new Date().toISOString() };
      trades.push(trade);
      await rSet(redis, key(accountId), trades);
      return res.status(201).json(trade);
    }

    if (req.method === 'DELETE') {
      const { id, accountId } = req.query;
      if (!accountId) return res.status(400).json({ error: 'accountId required' });
      const trades = (await rGet(redis, key(accountId))) ?? [];
      await rSet(redis, key(accountId), trades.filter((t) => t.id !== id));
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[trades]', err);
    return res.status(500).json({ error: err.message });
  }
}
