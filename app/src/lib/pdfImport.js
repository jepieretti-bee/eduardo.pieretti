function toIso(dataBR) {
  const [d, m, y] = dataBR.split('/');
  return `${y}-${m}-${d}`;
}

// Lê um relatório de ponto em PDF (ex.: Dimep Kairos — "Relatório de Ponto") e
// extrai as marcações de horário, agrupadas por dia e mapeadas para os campos
// entrada/saída almoço/volta almoço/saída usados pelo app.
// pdfjs-dist é carregado sob demanda (dynamic import) para não engordar o bundle
// inicial de quem nunca usa essa tela.
export async function extrairMarcacoesPdf(file) {
  const [pdfjsLib, { default: pdfjsWorkerUrl }] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  ]);
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;

  let texto = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    texto += content.items.map((it) => it.str).join(' ') + '\n';
  }

  // Cada linha do relatório traz "... DD/MM/AAAA HH:MM:SS ..." — captura todas em ordem.
  const regex = /(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2}):\d{2}/g;
  const porDiaHoras = {};
  let m;
  let total = 0;
  while ((m = regex.exec(texto))) {
    const iso = toIso(m[1]);
    (porDiaHoras[iso] ||= []).push(m[2]);
    total++;
  }

  if (total === 0) {
    throw new Error('Nenhuma marcação de horário foi encontrada nesse PDF.');
  }

  const porDia = {};
  for (const [iso, horasRaw] of Object.entries(porDiaHoras)) {
    const horas = [...horasRaw].sort();
    const p = {};
    if (horas.length === 2) {
      // Duas marcações no dia: assume entrada + saída direta (sem almoço registrado).
      p.entrada = horas[0];
      p.saida = horas[1];
    } else {
      if (horas[0]) p.entrada = horas[0];
      if (horas[1]) p.saidaAlmoco = horas[1];
      if (horas[2]) p.voltaAlmoco = horas[2];
      if (horas[3]) p.saida = horas[3];
    }
    porDia[iso] = p;
  }

  return { porDia, totalMarcacoes: total, totalDias: Object.keys(porDia).length };
}
