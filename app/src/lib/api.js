const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function request(path, options) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${options?.method || 'GET'} ${path} falhou: ${res.status} ${body}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  getConfig: () => request('/api/config'),
  putConfig: (cfg) => request('/api/config', { method: 'PUT', body: JSON.stringify(cfg) }),

  listPeriodos: () => request('/api/periodos'),
  createPeriodo: (p) => request('/api/periodos', { method: 'POST', body: JSON.stringify(p) }),
  updatePeriodo: (id, p) => request(`/api/periodos/${id}`, { method: 'PUT', body: JSON.stringify(p) }),
  togglePeriodo: (id) => request(`/api/periodos/${id}/toggle`, { method: 'POST' }),
  deletePeriodo: (id) => request(`/api/periodos/${id}`, { method: 'DELETE' }),

  listDias: (start, end) => request(`/api/dias?start=${start}&end=${end}`),
  putDia: (data, dia) => request(`/api/dias/${data}`, { method: 'PUT', body: JSON.stringify(dia) }),
  clearDias: (start, end) => request('/api/dias/clear', { method: 'POST', body: JSON.stringify({ start, end }) })
};
