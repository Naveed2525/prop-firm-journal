import { getRedis, rGet } from './_redis.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const redis = await getRedis();
    // ALL accounts regardless of blown status — payouts from blown accounts still count
    const allAccounts = (await rGet(redis, 'pfj:accounts')) ?? [];

    const payoutLists = await Promise.all(
      allAccounts.map((a) => rGet(redis, `pfj:payouts:${a.id}`))
    );

    const payoutEvents = [];
    for (let i = 0; i < allAccounts.length; i++) {
      const acc = allAccounts[i];
      const payouts = payoutLists[i] ?? [];
      for (const p of payouts) {
        if (p.status?.toLowerCase() === 'received') {
          payoutEvents.push({
            accountId: acc.id,
            firm: acc.firm,
            amount: Number(p.amountReceived) || 0,
            date: p.date || p.receivedAt || p.createdAt?.slice(0, 10) || null,
          });
        }
      }
    }

    return res.status(200).json({ payoutEvents });
  } catch (err) {
    console.error('[expenses]', err);
    return res.status(500).json({ error: err.message });
  }
}
