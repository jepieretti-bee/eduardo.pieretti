export function feriadoDoDia(feriados, iso) {
  return (feriados || []).find((f) => f.data === iso) || null;
}

export function fmtDataBR(iso) {
  const [y, mo, d] = iso.split('-');
  return `${d}/${mo}/${y}`;
}
