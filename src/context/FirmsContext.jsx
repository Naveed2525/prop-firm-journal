import { createContext, useContext, useState, useEffect } from 'react';
import { PROP_FIRMS, buildMergedFirms } from '../data/propFirms';

const FirmsContext = createContext({
  firms: PROP_FIRMS,
  customFirms: [],
  overrides: {},
  loading: false,
  addFirm: async () => {},
  deleteFirm: async () => {},
  updateFirm: async () => {},
});

export function useFirms() {
  return useContext(FirmsContext);
}

async function apiFetch(url, opts = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return res.json();
}

export function FirmsProvider({ children }) {
  const [customFirms, setCustomFirms] = useState([]);
  const [overrides, setOverrides] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/firms')
      .then((data) => {
        setCustomFirms(data.customFirms ?? []);
        setOverrides(data.overrides ?? {});
      })
      .catch((e) => console.error('Failed to load firms', e))
      .finally(() => setLoading(false));
  }, []);

  const firms = buildMergedFirms(customFirms, overrides);

  const addFirm = async (data) => {
    const newFirm = await apiFetch('/api/firms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setCustomFirms((prev) => [...prev, newFirm]);
    return newFirm;
  };

  const deleteFirm = async (key) => {
    await apiFetch(`/api/firms?key=${encodeURIComponent(key)}`, { method: 'DELETE' });
    setCustomFirms((prev) => prev.filter((f) => f.key !== key));
  };

  const updateFirm = async (key, updates) => {
    await apiFetch(`/api/firms?key=${encodeURIComponent(key)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    if (key in PROP_FIRMS) {
      setOverrides((prev) => ({ ...prev, [key]: { ...(prev[key] ?? {}), ...updates } }));
    } else {
      setCustomFirms((prev) => prev.map((f) => f.key === key ? { ...f, ...updates } : f));
    }
  };

  return (
    <FirmsContext.Provider value={{ firms, customFirms, overrides, loading, addFirm, deleteFirm, updateFirm }}>
      {children}
    </FirmsContext.Provider>
  );
}
