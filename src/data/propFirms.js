export const PROP_FIRMS = {
  topstep: {
    name: 'Topstep',
    shortName: 'TS',
    color: '#00D4FF',
    split: 0.90,
    drawdownType: 'trailing-eod',
    minPayoutDays: 5,
    sizes: [50000, 100000, 150000],
    plans: [{ id: 'standard', name: 'Standard', hasDLL: true }],
    accounts: {
      50000:  { profitTarget: 3000, maxDrawdown: 2000, dailyLossLimit: 1000, consistencyRule: 0.40, hasDLL: true },
      100000: { profitTarget: 6000, maxDrawdown: 3000, dailyLossLimit: 2000, consistencyRule: 0.40, hasDLL: true },
      150000: { profitTarget: 9000, maxDrawdown: 4500, dailyLossLimit: 3000, consistencyRule: 0.40, hasDLL: true },
    },
    notes: 'EOD trailing drawdown. Consistency rule: no single day > 40% of total profit.',
  },

  mff: {
    name: 'MyFundedFutures',
    shortName: 'MFF',
    color: '#FF6B35',
    split: 0.85,
    drawdownType: 'trailing-eod',
    minPayoutDays: 5,
    sizes: [50000, 100000, 150000],
    plans: [
      { id: 'standard',     name: 'Standard (80%)',     split: 0.80, hasDLL: true },
      { id: 'accelerated',  name: 'Accelerated (90%)',  split: 0.90, hasDLL: true },
    ],
    accounts: {
      50000:  { profitTarget: 3000, maxDrawdown: 2000, dailyLossLimit: 1000, consistencyRule: 0.40, hasDLL: true },
      100000: { profitTarget: 6000, maxDrawdown: 3000, dailyLossLimit: 2000, consistencyRule: 0.40, hasDLL: true },
      150000: { profitTarget: 9000, maxDrawdown: 4500, dailyLossLimit: 3000, consistencyRule: 0.40, hasDLL: true },
    },
    notes: 'EOD trailing drawdown. 80% split (Standard) or 90% (Accelerated). 40% consistency rule.',
  },

  tradeify: {
    name: 'Tradeify',
    shortName: 'TFY',
    color: '#7B61FF',
    split: 0.90,
    drawdownType: 'trailing-eod',
    minPayoutDays: 5,
    sizes: [25000, 50000, 100000, 150000],
    plans: [
      { id: 'select',      name: 'Select',      hasDLL: true  },
      { id: 'select-flex', name: 'Select Flex', hasDLL: false },
    ],
    accounts: {
      25000:  { profitTarget: 1500, maxDrawdown: 1500, dailyLossLimit: 500,  consistencyRule: 0.35, hasDLL: true },
      50000:  { profitTarget: 3000, maxDrawdown: 2000, dailyLossLimit: 1000, consistencyRule: 0.35, hasDLL: true },
      100000: { profitTarget: 6000, maxDrawdown: 3000, dailyLossLimit: 2000, consistencyRule: 0.35, hasDLL: true },
      150000: { profitTarget: 9000, maxDrawdown: 4500, dailyLossLimit: 3000, consistencyRule: 0.35, hasDLL: true },
    },
    notes: 'EOD trailing drawdown. Select Flex plan has NO daily loss limit. 35% consistency rule.',
  },

  lucid: {
    name: 'Lucid',
    shortName: 'LCD',
    color: '#22C55E',
    split: 0.90,
    drawdownType: 'trailing-eod',
    minPayoutDays: 5,
    sizes: [25000, 50000, 100000, 150000],
    plans: [
      { id: 'standard',   name: 'Standard',  hasDLL: true  },
      { id: 'lucid-flex', name: 'LucidFlex', hasDLL: false },
    ],
    accounts: {
      25000:  { profitTarget: 1500, maxDrawdown: 1500, dailyLossLimit: 500,  consistencyRule: 0.50, hasDLL: true },
      50000:  { profitTarget: 3000, maxDrawdown: 2000, dailyLossLimit: 1000, consistencyRule: 0.50, hasDLL: true },
      100000: { profitTarget: 6000, maxDrawdown: 3000, dailyLossLimit: 2000, consistencyRule: 0.50, hasDLL: true },
      150000: { profitTarget: 9000, maxDrawdown: 4500, dailyLossLimit: 3000, consistencyRule: 0.50, hasDLL: true },
    },
    notes: 'EOD trailing drawdown. LucidFlex has NO daily loss limit. 50% consistency rule applies during evaluation only.',
  },
};

export function getRules(firmKey, size, planId) {
  const firm = PROP_FIRMS[firmKey];
  if (!firm) return null;
  const base = firm.accounts[size];
  if (!base) return null;
  const plan = firm.plans?.find((p) => p.id === planId);
  return {
    ...base,
    hasDLL: plan?.hasDLL ?? base.hasDLL,
    split: plan?.split ?? firm.split,
    firmName: firm.name,
    firmColor: firm.color,
    planName: plan?.name ?? 'Standard',
    notes: firm.notes,
    minPayoutDays: firm.minPayoutDays ?? 5,
  };
}

export function getFirmColor(firmKey) {
  return PROP_FIRMS[firmKey]?.color ?? '#888';
}
