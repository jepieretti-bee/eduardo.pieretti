// Retorna o período (dentre vários cadastrados) que contém a data informada.
// Se mais de um período cobrir a mesma data, o criado mais recentemente prevalece.
export function periodoForDate(periodos, iso) {
  const candidatos = (periodos || []).filter((p) => p.dataInicio <= iso && iso <= p.dataFim);
  if (!candidatos.length) return null;
  return candidatos.reduce((a, b) => (b.id > a.id ? b : a));
}

export function isLocked(periodos, iso) {
  const p = periodoForDate(periodos, iso);
  return !!(p && p.encerrado);
}
