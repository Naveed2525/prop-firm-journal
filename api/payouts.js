import { getRedis, rGet, rSet } from './_redis.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
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
      const payouts = (await rGet(redis, `pfj:payouts:${accountId}`)) ?? [];
      return res.status(200).json(payouts);
    }

    if (req.method === 'POST') {
      const { accountId, date, amountRequested, amountReceived, balanceAfter, notes, status } = req.body;
      if (!accountId) return res.status(400).json({ error: 'accountId required' });
      const key = `pfj:payouts:${accountId}`;
      const payouts = (await rGet(redis, key)) ?? [];
      const number = payouts.length > 0 ? Math.max(...payouts.map((p) => p.number)) + 1 : 1;
      const payout = {
        id: crypto.randomUUID(),
        accountId,
        number,
        date,
        amountRequested: Number(amountRequested) || 0,
        amountReceived: Number(amountReceived) || 0,
        balanceAfter: Number(balanceAfter) || 0,
        notes: notes ?? '',
        status: status ?? 'pending',
        createdAt: new Date().toISOString(),
      };
      payouts.push(payout);
      await rSet(redis, key, payouts);
      return res.status(201).json(payout);
    }

    if (req.method === 'PATCH') {
      const { id, accountId } = req.query;
      if (!id || !accountId) return res.status(400).json({ error: 'id and accountId required' });
      const key = `pfj:payouts:${accountId}`;
      const payouts = (await rGet(redis, key)) ?? [];
      const idx = payouts.findIndex((p) => p.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Payout not found' });
      const { date, amountRequested, amountReceived, balanceAfter, notes, status } = req.body;
      payouts[idx] = {
        ...payouts[idx],
        ...(date !== undefined && { date }),
        ...(amountRequested !== undefined && { amountRequested: Number(amountRequested) }),
        ...(amountReceived !== undefined && { amountReceived: Number(amountReceived) }),
        ...(balanceAfter !== undefined && { balanceAfter: Number(balanceAfter) }),
        ...(notes !== undefined && { notes }),
        ...(status !== undefined && { status }),
      };
      await rSet(redis, key, payouts);
      return res.status(200).json(payouts[idx]);
    }

    if (req.method === 'DELETE') {
      const { id, accountId } = req.query;
      if (!id || !accountId) return res.status(400).json({ error: 'id and accountId required' });
      const key = `pfj:payouts:${accountId}`;
      const payouts = (await rGet(redis, key)) ?? [];
      await rSet(redis, key, payouts.filter((p) => p.id !== id));
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[payouts]', err);
    return res.status(500).json({ error: err.message });
  }
}
