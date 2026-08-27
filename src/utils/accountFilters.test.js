import { describe, it, expect } from 'vitest';
import {
  categorizeAccounts, matchesSearch, sortAccounts,
  getAccountType, matchesAccountType, matchesFirmFilter, isValidAccountType,
} from './accountFilters';

const firms = {
  topstep: { name: 'Topstep' },
  mff: { name: 'MyFundedFutures' },
  lucid: { name: 'Lucid Trading' },
};

function acc(overrides) {
  return {
    id: overrides.id,
    firm: 'topstep',
    size: 50000,
    phase: 'evaluation',
    blown: false,
    status: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('categorizeAccounts — section placement', () => {
  it('puts a plain evaluation account in Eval, not Passed', () => {
    const { evalAccounts, passedEvalAccounts } = categorizeAccounts([acc({ id: 'a1' })]);
    expect(evalAccounts.map((a) => a.id)).toEqual(['a1']);
    expect(passedEvalAccounts).toEqual([]);
  });

  it('NEVER puts a status:"passed" account in the active Eval section', () => {
    const passed = acc({ id: 'a2', status: 'passed' });
    const { evalAccounts, passedEvalAccounts } = categorizeAccounts([passed]);
    expect(evalAccounts).toEqual([]);
    expect(passedEvalAccounts.map((a) => a.id)).toEqual(['a2']);
  });

  it('is tolerant of casing/whitespace on status (defensive against bad/legacy data)', () => {
    const variants = ['Passed', ' passed ', 'PASSED'];
    for (const status of variants) {
      const { evalAccounts, passedEvalAccounts } = categorizeAccounts([acc({ id: 'x', status })]);
      expect(evalAccounts, `status=${JSON.stringify(status)} leaked into Eval`).toEqual([]);
      expect(passedEvalAccounts.map((a) => a.id)).toEqual(['x']);
    }
  });

  it('routes funded accounts to Funded regardless of status field', () => {
    const funded = acc({ id: 'f1', phase: 'funded', status: 'passed' });
    const { evalAccounts, passedEvalAccounts, fundedAccounts } = categorizeAccounts([funded]);
    expect(evalAccounts).toEqual([]);
    expect(passedEvalAccounts).toEqual([]);
    expect(fundedAccounts.map((a) => a.id)).toEqual(['f1']);
  });

  it('routes blown accounts out of the active sections entirely', () => {
    const blownEvalAcc = acc({ id: 'be1', blown: true });
    const blownFundedAcc = acc({ id: 'bf1', phase: 'funded', blown: true });
    const { evalAccounts, fundedAccounts, blownEval, blownFunded } = categorizeAccounts([blownEvalAcc, blownFundedAcc]);
    expect(evalAccounts).toEqual([]);
    expect(fundedAccounts).toEqual([]);
    expect(blownEval.map((a) => a.id)).toEqual(['be1']);
    expect(blownFunded.map((a) => a.id)).toEqual(['bf1']);
  });

  it('every account lands in exactly one bucket', () => {
    const accounts = [
      acc({ id: 1 }),
      acc({ id: 2, status: 'passed' }),
      acc({ id: 3, phase: 'funded' }),
      acc({ id: 4, blown: true }),
      acc({ id: 5, phase: 'funded', blown: true }),
      acc({ id: 6, phase: 'funded', status: 'passed', blown: true }),
    ];
    const buckets = categorizeAccounts(accounts);
    const seen = Object.values(buckets).flat().map((a) => a.id).sort();
    expect(seen).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe('sortAccounts — date field uses purchaseDateTime, falls back to createdAt', () => {
  const withPurchase = acc({ id: 'p', createdAt: '2026-06-01T00:00:00.000Z', purchaseDateTime: '2026-01-15T09:00' });
  const withoutPurchase = acc({ id: 'np', createdAt: '2026-03-01T00:00:00.000Z' });

  it('ascending: earlier purchase date sorts first even though it was created later', () => {
    const result = sortAccounts([withoutPurchase, withPurchase], 'date', 'asc', {}, firms);
    expect(result.map((a) => a.id)).toEqual(['p', 'np']); // Jan 15 before Mar 1
  });

  it('descending reverses it', () => {
    const result = sortAccounts([withoutPurchase, withPurchase], 'date', 'desc', {}, firms);
    expect(result.map((a) => a.id)).toEqual(['np', 'p']);
  });

  it('falls back to createdAt when purchaseDateTime is absent', () => {
    const older = acc({ id: 'o', createdAt: '2026-01-01T00:00:00.000Z' });
    const newer = acc({ id: 'n', createdAt: '2026-02-01T00:00:00.000Z' });
    expect(sortAccounts([newer, older], 'date', 'asc', {}, firms).map((a) => a.id)).toEqual(['o', 'n']);
    expect(sortAccounts([newer, older], 'date', 'desc', {}, firms).map((a) => a.id)).toEqual(['n', 'o']);
  });
});

describe('sortAccounts — toggle correctly reverses order for every field', () => {
  const list = [
    acc({ id: 'low', size: 25000, firm: 'lucid', createdAt: '2026-01-01T00:00:00.000Z' }),
    acc({ id: 'mid', size: 50000, firm: 'mff', createdAt: '2026-02-01T00:00:00.000Z' }),
    acc({ id: 'high', size: 150000, firm: 'topstep', createdAt: '2026-03-01T00:00:00.000Z' }),
  ];
  const pnlMap = { low: -200, mid: 0, high: 900 };

  it.each(['date', 'pnl', 'firm', 'size'])('%s: desc is exactly the reverse of asc', (field) => {
    const asc = sortAccounts(list, field, 'asc', pnlMap, firms).map((a) => a.id);
    const desc = sortAccounts(list, field, 'desc', pnlMap, firms).map((a) => a.id);
    expect(desc).toEqual([...asc].reverse());
  });

  it('pnl asc is lowest-first, desc is highest-first', () => {
    expect(sortAccounts(list, 'pnl', 'asc', pnlMap, firms).map((a) => a.id)).toEqual(['low', 'mid', 'high']);
    expect(sortAccounts(list, 'pnl', 'desc', pnlMap, firms).map((a) => a.id)).toEqual(['high', 'mid', 'low']);
  });

  it('size asc is smallest-first, desc is largest-first', () => {
    expect(sortAccounts(list, 'size', 'asc', pnlMap, firms).map((a) => a.id)).toEqual(['low', 'mid', 'high']);
    expect(sortAccounts(list, 'size', 'desc', pnlMap, firms).map((a) => a.id)).toEqual(['high', 'mid', 'low']);
  });

  it('does not mutate the input array', () => {
    const copy = [...list];
    sortAccounts(list, 'size', 'desc', pnlMap, firms);
    expect(list).toEqual(copy);
  });
});

describe('getAccountType / isValidAccountType', () => {
  it.each([
    [acc({ id: 1 }), 'eval'],
    [acc({ id: 2, status: 'passed' }), 'passed'],
    [acc({ id: 3, phase: 'funded' }), 'funded'],
    [acc({ id: 4, blown: true }), 'blown-eval'],
    [acc({ id: 5, phase: 'funded', blown: true }), 'blown-funded'],
    // blown always wins, even over passed/funded
    [acc({ id: 6, phase: 'funded', status: 'passed', blown: true }), 'blown-funded'],
  ])('classifies %#', (account, expected) => {
    expect(getAccountType(account)).toBe(expected);
  });

  it('rejects unknown type values', () => {
    expect(isValidAccountType('eval')).toBe(true);
    expect(isValidAccountType('archived')).toBe(false);
    expect(isValidAccountType(undefined)).toBe(false);
  });
});

describe('matchesAccountType — multi-select', () => {
  const evalAcc = acc({ id: 'e' });
  const fundedAcc = acc({ id: 'f', phase: 'funded' });
  const blownAcc = acc({ id: 'b', blown: true });

  it('empty selection ("All") matches everything', () => {
    for (const a of [evalAcc, fundedAcc, blownAcc]) {
      expect(matchesAccountType(a, [])).toBe(true);
    }
  });

  it('single selection matches only that type', () => {
    expect(matchesAccountType(evalAcc, ['eval'])).toBe(true);
    expect(matchesAccountType(fundedAcc, ['eval'])).toBe(false);
  });

  it('multiple selections are OR\'d together', () => {
    const selected = ['eval', 'blown-eval'];
    expect(matchesAccountType(evalAcc, selected)).toBe(true);
    expect(matchesAccountType(blownAcc, selected)).toBe(true);
    expect(matchesAccountType(fundedAcc, selected)).toBe(false);
  });
});

describe('matchesFirmFilter — multi-select', () => {
  it('empty selection ("All firms") matches everything', () => {
    expect(matchesFirmFilter(acc({ id: 1, firm: 'lucid' }), [])).toBe(true);
  });

  it('matches any firm in the selection', () => {
    expect(matchesFirmFilter(acc({ id: 1, firm: 'lucid' }), ['topstep', 'lucid'])).toBe(true);
    expect(matchesFirmFilter(acc({ id: 1, firm: 'mff' }), ['topstep', 'lucid'])).toBe(false);
  });
});

describe('account type + firm filter + search compose correctly with sort', () => {
  const accounts = [
    acc({ id: 'a', firm: 'topstep', label: 'Main eval', size: 50000, createdAt: '2026-01-01T00:00:00.000Z' }),
    acc({ id: 'b', firm: 'topstep', label: 'Backup', size: 100000, createdAt: '2026-02-01T00:00:00.000Z' }),
    acc({ id: 'c', firm: 'mff', label: 'Main funded', phase: 'funded', size: 50000, createdAt: '2026-03-01T00:00:00.000Z' }),
    acc({ id: 'd', firm: 'lucid', label: 'Blown one', blown: true, size: 50000, createdAt: '2026-04-01T00:00:00.000Z' }),
    acc({ id: 'e', firm: 'mff', label: 'Passed one', status: 'passed', size: 100000, createdAt: '2026-05-01T00:00:00.000Z' }),
  ];

  // Mirrors Dashboard.jsx's applyFilters exactly: type, then firm, then
  // search, then sort — the real production composition, not a re-derivation.
  function applyFilters(list, { types = [], firmFilter = [], search = '', sortField = 'date', sortDirection = 'asc' } = {}) {
    return sortAccounts(
      list.filter((a) => matchesAccountType(a, types) && matchesFirmFilter(a, firmFilter) && matchesSearch(a, firms[a.firm], search)),
      sortField,
      sortDirection,
      {},
      firms
    );
  }

  it('no filters (all defaults) returns everything, sorted', () => {
    const result = applyFilters(accounts, { sortDirection: 'asc' });
    expect(result.map((a) => a.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('single firm filter narrows the set before sorting', () => {
    const result = applyFilters(accounts, { firmFilter: ['topstep'], sortDirection: 'desc' });
    expect(result.map((a) => a.id)).toEqual(['b', 'a']);
  });

  it('multi-select firm filter is OR\'d (topstep OR lucid)', () => {
    const result = applyFilters(accounts, { firmFilter: ['topstep', 'lucid'] });
    expect(result.map((a) => a.id).sort()).toEqual(['a', 'b', 'd']);
  });

  it('single account-type filter narrows to just that bucket', () => {
    expect(applyFilters(accounts, { types: ['funded'] }).map((a) => a.id)).toEqual(['c']);
    expect(applyFilters(accounts, { types: ['blown-eval'] }).map((a) => a.id)).toEqual(['d']);
    expect(applyFilters(accounts, { types: ['passed'] }).map((a) => a.id)).toEqual(['e']);
  });

  it('multi-select account-type filter is OR\'d (eval OR passed)', () => {
    const result = applyFilters(accounts, { types: ['eval', 'passed'] });
    expect(result.map((a) => a.id).sort()).toEqual(['a', 'b', 'e']);
  });

  it('account type + firm filter combine as AND', () => {
    // mff accounts that are either funded or passed -> both c and e
    const result = applyFilters(accounts, { types: ['funded', 'passed'], firmFilter: ['mff'] });
    expect(result.map((a) => a.id).sort()).toEqual(['c', 'e']);
  });

  it('search by label narrows the set, independent of type/firm filter', () => {
    const result = applyFilters(accounts, { search: 'main' });
    expect(result.map((a) => a.id).sort()).toEqual(['a', 'c']);
  });

  it('search by size (raw and "Nk" shorthand) matches', () => {
    expect(applyFilters(accounts, { search: '100000' }).map((a) => a.id).sort()).toEqual(['b', 'e']);
    expect(applyFilters(accounts, { search: '50k' }).map((a) => a.id).sort()).toEqual(['a', 'c', 'd']);
  });

  it('search by firm name matches', () => {
    expect(applyFilters(accounts, { search: 'myfundedfutures' }).map((a) => a.id).sort()).toEqual(['c', 'e']);
  });

  it('type + firm + search all combine (AND, not OR)', () => {
    const result = applyFilters(accounts, { types: ['eval'], firmFilter: ['topstep'], search: 'main' });
    expect(result.map((a) => a.id)).toEqual(['a']);
  });

  it('sort still applies to the filtered+searched subset, both directions', () => {
    const asc = applyFilters(accounts, { firmFilter: ['topstep'], sortField: 'size', sortDirection: 'asc' });
    const desc = applyFilters(accounts, { firmFilter: ['topstep'], sortField: 'size', sortDirection: 'desc' });
    expect(asc.map((a) => a.id)).toEqual(['a', 'b']);
    expect(desc.map((a) => a.id)).toEqual(['b', 'a']);
  });

  it('no matches returns an empty list, not an error', () => {
    expect(applyFilters(accounts, { search: 'zzz-no-such-account' })).toEqual([]);
    expect(applyFilters(accounts, { types: ['funded'], firmFilter: ['lucid'] })).toEqual([]);
  });
});
