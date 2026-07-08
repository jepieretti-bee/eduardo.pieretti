// Utilitários de horário: parse "HH:MM" <-> minutos, máscara de digitação e cálculo de jornada.

export function parseHora(s) {
  if (!s || typeof s !== 'string') return null;
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

export function fmtMinutos(mins) {
  const neg = mins < 0;
  mins = Math.abs(Math.round(mins));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return (neg ? '-' : '') + h + ':' + String(m).padStart(2, '0');
}

export function maskHora(v) {
  const d = (v || '').replace(/\D/g, '').slice(0, 4);
  if (d.length <= 2) return d;
  return d.slice(0, 2) + ':' + d.slice(2);
}

// r: { carga, entrada, saidaAlmoco, voltaAlmoco, saida }, jornadaPadrao: "HH:MM"
export function compute(r, jornadaPadrao) {
  const e = parseHora(r.entrada);
  const sa = parseHora(r.saidaAlmoco);
  const va = parseHora(r.voltaAlmoco);
  const s = parseHora(r.saida);
  const carga = parseHora(r.carga) ?? parseHora(jornadaPadrao);
  let worked = 0;
  let have = false;
  let filled = 0;
  [r.entrada, r.saidaAlmoco, r.voltaAlmoco, r.saida].forEach((v) => {
    if (parseHora(v) != null) filled++;
  });
  if (e != null && sa != null) {
    worked += sa - e;
    have = true;
  }
  if (va != null && s != null) {
    worked += s - va;
    have = true;
  }
  if (!have && e != null && s != null && sa == null && va == null) {
    worked = s - e;
    have = true;
  }
  if (!have) return { have: false, worked: 0, diff: 0, filled, carga };
  const diff = worked - (carga ?? 0);
  return { have: true, worked, diff, carga, filled };
}
