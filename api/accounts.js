import { getRedis, rGet, rSet, rDel } from './_redis.js';

const KEY = 'pfj:accounts';

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
      const accounts = (await rGet(redis, KEY)) ?? [];
      return res.status(200).json(accounts);
    }

    if (req.method === 'POST') {
      const accounts = (await rGet(redis, KEY)) ?? [];
      const account = { id: crypto.randomUUID(), ...req.body, createdAt: new Date().toISOString() };
      accounts.push(account);
      await rSet(redis, KEY, accounts);
      return res.status(201).json(account);
    }

    if (req.method === 'DELETE') {
      const { id: accountId } = req.query;
      if (!accountId) return res.status(400).json({ error: 'id required' });
      const accounts = (await rGet(redis, KEY)) ?? [];
      await rSet(redis, KEY, accounts.filter((a) => a.id !== accountId));
      await rDel(redis, `pfj:trades:${accountId}`);
      await rDel(redis, `pfj:payouts:${accountId}`);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[accounts]', err);
    return res.status(500).json({ error: err.message });
  }
}
