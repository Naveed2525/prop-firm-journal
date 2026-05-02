import { PROP_FIRMS } from '../data/propFirms';

export async function exportAllToCsv(accounts) {
  const rows = [
    ['Account Label', 'Firm', 'Size ($)', 'Phase', 'Plan', 'Date', 'Instrument', 'P&L ($)', 'Notes'],
  ];

  for (const acc of accounts) {
    const firmName = PROP_FIRMS[acc.firm]?.name ?? acc.firm;
    const label = acc.label || firmName;
    const res = await fetch(`/api/trades?accountId=${acc.id}`);
    const trades = res.ok ? await res.json() : [];
    if (trades.length === 0) {
      rows.push([label, firmName, acc.size, acc.phase, acc.plan ?? 'standard', '', '', '', '']);
    } else {
      for (const t of trades) {
        rows.push([
          label,
          firmName,
          acc.size,
          acc.phase,
          acc.plan ?? 'standard',
          t.date.slice(0, 10),
          t.instrument ?? '',
          t.pnl,
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
