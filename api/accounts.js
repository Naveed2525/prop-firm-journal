import { kv } from '@vercel/kv';

const KEY = 'pfj:accounts';

function id() {
  return crypto.randomUUID();
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const accounts = (await kv.get(KEY)) ?? [];
      return res.status(200).json(accounts);
    }

    if (req.method === 'POST') {
      const accounts = (await kv.get(KEY)) ?? [];
      const account = { id: id(), ...req.body, createdAt: new Date().toISOString() };
      accounts.push(account);
      await kv.set(KEY, accounts);
      return res.status(201).json(account);
    }

    if (req.method === 'DELETE') {
      const { id: accountId } = req.query;
      if (!accountId) return res.status(400).json({ error: 'id required' });
      const accounts = (await kv.get(KEY)) ?? [];
      await kv.set(KEY, accounts.filter((a) => a.id !== accountId));
      await kv.del(`pfj:trades:${accountId}`);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[accounts]', err);
    return res.status(500).json({ error: err.message });
  }
}
