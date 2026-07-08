export const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
export const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export function pad2(n) {
  return String(n).padStart(2, '0');
}

export function monthKeyOf(date) {
  return date.getFullYear() + '-' + pad2(date.getMonth() + 1);
}

export function isoOf(y, mo, d) {
  return `${y}-${pad2(mo)}-${pad2(d)}`;
}

export function dayLabel(y, mo, d) {
  const dt = new Date(y, mo - 1, d);
  const wd = dt.getDay();
  return `${pad2(d)}/${pad2(mo)}/${String(y).slice(2)} - ${DIAS[wd]}`;
}

// Dias úteis (seg-sex) do mês, no formato usado pelas telas.
export function businessDaysOfMonth(monthKey) {
  const [y, mo] = monthKey.split('-').map(Number);
  const days = new Date(y, mo, 0).getDate();
  const out = [];
  for (let d = 1; d <= days; d++) {
    const dt = new Date(y, mo - 1, d);
    const wd = dt.getDay();
    if (wd >= 1 && wd <= 5) {
      out.push({ iso: isoOf(y, mo, d), day: d, label: dayLabel(y, mo, d) });
    }
  }
  return out;
}

export function shiftMonthKey(monthKey, delta) {
  let [y, mo] = monthKey.split('-').map(Number);
  mo += delta;
  if (mo < 1) { mo = 12; y--; }
  if (mo > 12) { mo = 1; y++; }
  return y + '-' + pad2(mo);
}

export function monthLabel(monthKey) {
  const [y, mo] = monthKey.split('-').map(Number);
  return MESES[mo - 1] + ' ' + y;
}

export function monthRange(monthKey) {
  const [y, mo] = monthKey.split('-').map(Number);
  const days = new Date(y, mo, 0).getDate();
  return { start: isoOf(y, mo, 1), end: isoOf(y, mo, days) };
}
