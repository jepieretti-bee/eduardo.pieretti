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

// Ponto de entrada: nunca tem tolerância — todo minuto adiantado é extra, todo
// minuto atrasado é atraso, cheio, sem faixa livre.
function diffEntrada(realMin, esperadoMin) {
  if (realMin <= esperadoMin) return { extra: esperadoMin - realMin, atraso: 0 };
  return { extra: 0, atraso: realMin - esperadoMin };
}

// Ponto de saída: sair até `toleranciaMin` depois do esperado não gera extra (só o que
// passar da tolerância). Sair antes conta 100% como atraso, sem tolerância nenhuma.
function toleranciaSaida(realMin, esperadoMin, toleranciaMin) {
  if (realMin >= esperadoMin) {
    const tarde = realMin - esperadoMin;
    return { extra: Math.max(0, tarde - toleranciaMin), atraso: 0 };
  }
  return { extra: 0, atraso: esperadoMin - realMin };
}

// r: { carga, entrada, saidaAlmoco, voltaAlmoco, saida, falta }
// jornada: "HH:MM" (carga padrão, modo legado) ou objeto
//   { entrada, saidaAlmoco, voltaAlmoco, saida, tolerancia, cargaPadrao }
export function compute(r, jornada) {
  const j = typeof jornada === 'string' ? { cargaPadrao: jornada } : (jornada || {});
  const carga = parseHora(r.carga) ?? parseHora(j.cargaPadrao);

  // Falta: dia inteiro conta como débito (carga negativa), independente de marcações.
  if (r.falta) {
    return { have: true, worked: 0, diff: -(carga ?? 0), carga, filled: 0, falta: true };
  }

  const e = parseHora(r.entrada);
  const sa = parseHora(r.saidaAlmoco);
  const va = parseHora(r.voltaAlmoco);
  const s = parseHora(r.saida);
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

  const jE = parseHora(j.entrada);
  const jSA = parseHora(j.saidaAlmoco);
  const jVA = parseHora(j.voltaAlmoco);
  const jS = parseHora(j.saida);
  const tolerancia = Number.isFinite(j.tolerancia) ? j.tolerancia : 15;

  const jornadaCompleta = jE != null && jSA != null && jVA != null && jS != null;

  let diff;
  if (jornadaCompleta) {
    let extra = 0;
    let atraso = 0;

    if (e != null) {
      const cEntrada = diffEntrada(e, jE);
      extra += cEntrada.extra;
      atraso += cEntrada.atraso;
    }

    if (s != null) {
      const cSaida = toleranciaSaida(s, jS, tolerancia);
      extra += cSaida.extra;
      atraso += cSaida.atraso;
    }

    if (sa != null && va != null) {
      // Intervalo de almoço: só sobra atraso se o intervalo real for MAIOR que o esperado.
      // Um intervalo mais curto que o esperado não gera horas extras.
      const intervaloReal = va - sa;
      const intervaloEsperado = jVA - jSA;
      if (intervaloReal > intervaloEsperado) atraso += intervaloReal - intervaloEsperado;
    } else if (sa != null && va == null && s == null) {
      // Bateu entrada e saída pro almoço mas nunca voltou: a tarde inteira fica sem
      // marcação — debita a duração esperada do bloco da tarde por completo.
      atraso += jS - jVA;
    } else if (e == null && va != null && sa == null) {
      // Caso simétrico: só bateu volta do almoço e saída — a manhã inteira fica sem
      // marcação — debita a duração esperada do bloco da manhã por completo.
      atraso += jSA - jE;
    }

    diff = extra - atraso;
  } else {
    diff = worked - (carga ?? 0);
  }

  return { have: true, worked, diff, carga, filled };
}
