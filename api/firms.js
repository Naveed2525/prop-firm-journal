import { getRedis, rGet, rSet } from './_redis.js';

const BUILTIN_KEYS = ['topstep', 'mff', 'tradeify', 'lucid'];

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
      const [customFirms, overrides] = await Promise.all([
        rGet(redis, 'pfj:custom-firms'),
        rGet(redis, 'pfj:firm-overrides'),
      ]);
      return res.status(200).json({
        customFirms: customFirms ?? [],
        overrides: overrides ?? {},
      });
    }

    if (req.method === 'POST') {
      const { name, shortName, color } = req.body ?? {};
      if (!name?.trim() || !shortName?.trim() || !color) {
        return res.status(400).json({ error: 'name, shortName, and color are required' });
      }
      const key = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (BUILTIN_KEYS.includes(key)) {
        return res.status(409).json({ error: 'Name conflicts with a built-in firm' });
      }
      const customFirms = (await rGet(redis, 'pfj:custom-firms')) ?? [];
      if (customFirms.some((f) => f.key === key)) {
        return res.status(409).json({ error: 'A firm with this name already exists' });
      }
      const newFirm = {
        key,
        name: name.trim(),
        shortName: shortName.trim().toUpperCase().slice(0, 4),
        color,
        sizes: [50000, 100000],
        plans: [{ id: 'standard', name: 'Standard', hasDLL: true }],
        split: 0.80,
        drawdownType: 'trailing-eod',
        minPayoutDays: 5,
        notes: '',
        isCustom: true,
        createdAt: new Date().toISOString(),
      };
      customFirms.push(newFirm);
      await rSet(redis, 'pfj:custom-firms', customFirms);
      return res.status(201).json(newFirm);
    }

    if (req.method === 'PATCH') {
      const { key } = req.query;
      if (!key) return res.status(400).json({ error: 'key is required' });

      if (BUILTIN_KEYS.includes(key)) {
        const overrides = (await rGet(redis, 'pfj:firm-overrides')) ?? {};
        overrides[key] = { ...(overrides[key] ?? {}), ...req.body };
        await rSet(redis, 'pfj:firm-overrides', overrides);
        return res.status(200).json({ key, ...overrides[key] });
      }

      const customFirms = (await rGet(redis, 'pfj:custom-firms')) ?? [];
      const idx = customFirms.findIndex((f) => f.key === key);
      if (idx === -1) return res.status(404).json({ error: 'Firm not found' });
      customFirms[idx] = { ...customFirms[idx], ...req.body };
      await rSet(redis, 'pfj:custom-firms', customFirms);
      return res.status(200).json(customFirms[idx]);
    }

    if (req.method === 'DELETE') {
      const { key } = req.query;
      if (!key) return res.status(400).json({ error: 'key is required' });
      if (BUILTIN_KEYS.includes(key)) {
        return res.status(403).json({ error: 'Cannot delete built-in firms' });
      }
      const customFirms = (await rGet(redis, 'pfj:custom-firms')) ?? [];
      const filtered = customFirms.filter((f) => f.key !== key);
      if (filtered.length === customFirms.length) {
        return res.status(404).json({ error: 'Firm not found' });
      }
      await rSet(redis, 'pfj:custom-firms', filtered);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[firms]', err);
    return res.status(500).json({ error: err.message });
  }
}
