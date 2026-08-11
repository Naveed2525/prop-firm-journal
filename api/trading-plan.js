import { getRedis, rGet, rSet } from './_redis.js';

const KEY = 'pfj:trading-plan';

// Seeded once on first load so existing users get the Core Sizing Rule as an
// editable/deletable personal rule instead of losing it in the migration.
const DEFAULT_RULES = [
  {
    id: 'core-sizing-rule',
    text: 'I NEVER SIZE MY TRADE BASED ON HOW MUCH I WANT TO MAKE.\nI SIZE MY TRADE BASED ON WHERE MY TRADE IDEA IS WRONG.',
    createdAt: '2026-08-07T00:00:00.000Z',
    updatedAt: '2026-08-07T00:00:00.000Z',
  },
];

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function defaultDay() {
  return {
    before: { affirmation: false, positionSize: false, marketConditions: false },
    trades: [],
    endOfDay: { noRevenge: false, positionSizeRules: false, maxTrades: false },
  };
}

function defaultDoc() {
  return {
    days: {},
    progress: { consecutiveCleanTrades: 0, bestStreak: 0, resetLog: [] },
    personalRules: DEFAULT_RULES.map((r) => ({ ...r })),
  };
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const redis = await getRedis();

    if (req.method === 'GET') {
      let doc = await rGet(redis, KEY);
      let dirty = false;
      if (!doc) { doc = defaultDoc(); dirty = true; }
      if (!doc.days) { doc.days = {}; }
      if (!doc.progress) { doc.progress = { consecutiveCleanTrades: 0, bestStreak: 0, resetLog: [] }; }
      if (!doc.personalRules) { doc.personalRules = DEFAULT_RULES.map((r) => ({ ...r })); dirty = true; }
      if (dirty) await rSet(redis, KEY, doc);
      return res.status(200).json(doc);
    }

    // Add a new personal rule (e.g. "Add Personal Rule")
    if (req.method === 'POST' && req.query.resource === 'rule') {
      const { text } = req.body ?? {};
      if (!text || !text.trim()) return res.status(400).json({ error: 'text is required' });

      const doc = (await rGet(redis, KEY)) ?? defaultDoc();
      doc.personalRules ??= [];
      const now = new Date().toISOString();
      const rule = { id: crypto.randomUUID(), text: text.trim().slice(0, 1000), createdAt: now, updatedAt: now };
      doc.personalRules.push(rule);
      await rSet(redis, KEY, doc);
      return res.status(201).json(rule);
    }

    // Edit an existing personal rule's text
    if (req.method === 'PATCH' && req.query.resource === 'rule') {
      const { id } = req.query;
      const { text } = req.body ?? {};
      if (!id) return res.status(400).json({ error: 'id is required' });
      if (!text || !text.trim()) return res.status(400).json({ error: 'text is required' });

      const doc = (await rGet(redis, KEY)) ?? defaultDoc();
      doc.personalRules ??= [];
      const idx = doc.personalRules.findIndex((r) => r.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Rule not found' });
      doc.personalRules[idx] = { ...doc.personalRules[idx], text: text.trim().slice(0, 1000), updatedAt: new Date().toISOString() };
      await rSet(redis, KEY, doc);
      return res.status(200).json(doc.personalRules[idx]);
    }

    // Delete a personal rule entirely
    if (req.method === 'DELETE' && req.query.resource === 'rule') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'id is required' });

      const doc = (await rGet(redis, KEY)) ?? defaultDoc();
      const before = doc.personalRules?.length ?? 0;
      doc.personalRules = (doc.personalRules ?? []).filter((r) => r.id !== id);
      if (doc.personalRules.length === before) return res.status(404).json({ error: 'Rule not found' });
      await rSet(redis, KEY, doc);
      return res.status(200).json({ ok: true });
    }

    // Toggle one of the daily checklist sections (before / endOfDay) for a given date
    if (req.method === 'PATCH') {
      const { date, section } = req.query;
      if (!date || !['before', 'endOfDay'].includes(section)) {
        return res.status(400).json({ error: 'date and a valid section (before|endOfDay) are required' });
      }
      const doc = (await rGet(redis, KEY)) ?? defaultDoc();
      doc.days ??= {};
      const day = doc.days[date] ?? defaultDay();
      day[section] = { ...day[section], ...(req.body ?? {}) };
      doc.days[date] = day;
      await rSet(redis, KEY, doc);
      return res.status(200).json(day);
    }

    // Log a per-trade rule check ("Before every trade" + "After every trade")
    if (req.method === 'POST') {
      const { date, setupConfirmed, exitKnown, riskConsistent, followedRules, whyEntered, emotion } = req.body ?? {};
      if (!date) return res.status(400).json({ error: 'date is required' });

      const doc = (await rGet(redis, KEY)) ?? defaultDoc();
      doc.days ??= {};
      doc.progress ??= { consecutiveCleanTrades: 0, bestStreak: 0, resetLog: [] };
      const day = doc.days[date] ?? defaultDay();

      const clean = !!setupConfirmed && !!exitKnown && !!riskConsistent && followedRules === true;
      const trade = {
        id: crypto.randomUUID(),
        setupConfirmed: !!setupConfirmed,
        exitKnown: !!exitKnown,
        riskConsistent: !!riskConsistent,
        followedRules: followedRules === true,
        whyEntered: String(whyEntered ?? '').slice(0, 500),
        emotion: String(emotion ?? '').slice(0, 200),
        clean,
        createdAt: new Date().toISOString(),
      };
      day.trades = [...(day.trades ?? []), trade];
      doc.days[date] = day;

      if (clean) {
        doc.progress.consecutiveCleanTrades = (doc.progress.consecutiveCleanTrades ?? 0) + 1;
        doc.progress.bestStreak = Math.max(doc.progress.bestStreak ?? 0, doc.progress.consecutiveCleanTrades);
      } else {
        const broken = [];
        if (!setupConfirmed) broken.push('Traded outside my defined setups');
        if (!exitKnown) broken.push('Entered without knowing my exit');
        if (!riskConsistent) broken.push("Didn't risk my usual size");
        if (followedRules !== true) broken.push('Did not follow my rules');
        doc.progress.consecutiveCleanTrades = 0;
        doc.progress.resetLog = [
          { date, at: trade.createdAt, note: broken.join('; ') || 'Rule broken' },
          ...(doc.progress.resetLog ?? []),
        ].slice(0, 50);
      }

      await rSet(redis, KEY, doc);
      return res.status(201).json({ trade, day, progress: doc.progress });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[trading-plan]', err);
    return res.status(500).json({ error: err.message });
  }
}
