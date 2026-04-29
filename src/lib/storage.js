const A_KEY = 'pfj:accounts';
const tKey = (id) => `pfj:trades:${id}`;

function read(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function write(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

export const db = {
  getAccounts: ()              => read(A_KEY) ?? [],
  setAccounts: (arr)           => write(A_KEY, arr),
  getTrades:   (accountId)     => read(tKey(accountId)) ?? [],
  setTrades:   (accountId, arr)=> write(tKey(accountId), arr),
  deleteAccount(id) {
    write(A_KEY, (read(A_KEY) ?? []).filter(a => a.id !== id));
    localStorage.removeItem(tKey(id));
  },
};
