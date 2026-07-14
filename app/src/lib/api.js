// Em produção/desktop o frontend é servido pelo próprio backend (mesma origem).
// Em dev (`vite`), aponta para o servidor separado via VITE_API_URL (ver .env.development).
const BASE = import.meta.env.VITE_API_URL || '';

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
  clearDias: (start, end) => request('/api/dias/clear', { method: 'POST', body: JSON.stringify({ start, end }) }),

  listFeriados: () => request('/api/feriados'),
  createFeriado: (f) => request('/api/feriados', { method: 'POST', body: JSON.stringify(f) }),
  deleteFeriado: (id) => request(`/api/feriados/${id}`, { method: 'DELETE' }),

  getBackup: () => request('/api/backup'),
  restoreBackup: (backup) => request('/api/backup/restore', { method: 'POST', body: JSON.stringify(backup) })
};
