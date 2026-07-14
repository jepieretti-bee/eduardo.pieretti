export function feriadoDoDia(feriados, iso) {
  return (feriados || []).find((f) => f.data === iso) || null;
}

export function fmtDataBR(iso) {
  const [y, mo, d] = iso.split('-');
  return `${d}/${mo}/${y}`;
}

// "01/07 – 31/07/2026" (mesmo ano) ou "28/12/2026 – 03/01/2027" (anos diferentes).
export function fmtRangeBR(inicioIso, fimIso) {
  const [yi, moi, di] = inicioIso.split('-');
  const [yf, mof, df] = fimIso.split('-');
  const inicio = yi === yf ? `${di}/${moi}` : `${di}/${moi}/${yi}`;
  return `${inicio} – ${df}/${mof}/${yf}`;
}
