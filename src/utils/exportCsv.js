import { PROP_FIRMS, getAccountCode } from '../data/propFirms';

export async function exportAllToCsv(accounts) {
  const rows = [
    [
      'Account Label', 'Prop Firm', 'Account Code', 'Size ($)', 'Phase', 'Plan',
      'Trade #', 'Trade Name', 'Date', 'Instrument', 'P&L ($)', 'Outcome', 'R Value', 'Notes',
    ],
  ];

  for (const acc of accounts) {
    const firmName = PROP_FIRMS[acc.firm]?.name ?? acc.firm;
    const label = acc.label || firmName;
    const accountCode = getAccountCode(acc);
    const res = await fetch(`/api/trades?accountId=${acc.id}`);
    const trades = res.ok ? await res.json() : [];

    if (trades.length === 0) {
      rows.push([label, firmName, accountCode, acc.size, acc.phase, acc.plan ?? 'standard', '', '', '', '', '', '', '', '']);
    } else {
      for (const t of trades) {
        const outcome = t.pnl > 0 ? 'Win' : t.pnl < 0 ? 'Loss' : 'Breakeven';
        const rValue =
          t.stopLoss != null && t.stopLoss !== '' && Number(t.stopLoss) !== 0
            ? `${(t.pnl / Math.abs(Number(t.stopLoss))).toFixed(2)}R`
            : '—';
        rows.push([
          label,
          firmName,
          accountCode,
          acc.size,
          acc.phase,
          acc.plan ?? 'standard',
          t.tradeNumber ?? '',
          t.tradeName ?? '',
          t.date.slice(0, 10),
          t.instrument ?? '',
          t.pnl,
          outcome,
          rValue,
          (t.notes ?? '').replace(/\n/g, ' '),
        ]);
      }
    }
  }

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `futures-journal-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
