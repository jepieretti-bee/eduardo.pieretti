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

// Retorna o período cujo intervalo [dataInicio,dataFim] sobrepõe [rangeStart,rangeEnd]
// (ex.: o mês em exibição), mesmo que o período não comece no dia 1º do mês.
// Usado para acumular o saldo do banco de horas por período, não por mês.
export function periodoForRange(periodos, rangeStart, rangeEnd) {
  const candidatos = (periodos || []).filter(
    (p) => p.dataInicio <= rangeEnd && p.dataFim >= rangeStart
  );
  if (!candidatos.length) return null;
  return candidatos.reduce((a, b) => (b.dataInicio > a.dataInicio ? b : a));
}
