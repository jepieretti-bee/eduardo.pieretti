export function feriadoDoDia(feriados, iso) {
  return (feriados || []).find((f) => f.data === iso) || null;
}

export function fmtDataBR(iso) {
  const [y, mo, d] = iso.split('-');
  return `${d}/${mo}/${y}`;
}

// "01/07/2026 – 31/07/2026" — data completa dos dois lados.
export function fmtRangeBR(inicioIso, fimIso) {
  return `${fmtDataBR(inicioIso)} – ${fmtDataBR(fimIso)}`;
}
