import { compute, fmtMinutos, parseHora } from '../lib/time';
import { fmtDataBR } from '../lib/feriados';
import { IconAlert } from '../components/Icons';

export default function Painel({ th, rows, cargaPadrao, jornada, saldoPeriodo: totais, diasForaDePeriodo = [] }) {
  const computed = rows.map((r) => compute(r, jornada ?? cargaPadrao));
  let maxV = parseHora(cargaPadrao) || 480;
  computed.forEach((c) => { if (c.have && c.worked > maxV) maxV = c.worked; });

  const kpis = [
    { label: 'Horas trabalhadas', value: fmtMinutos(totais.sumWorked), color: th.text, accent: th.accent, sub: fmtMinutos(totais.sumCarga) + ' de carga' },
    { label: 'Horas extras', value: fmtMinutos(totais.sumExtras), color: th.credit, accent: th.credit, sub: totais.daysDone + ' dias registrados' },
    { label: 'Atraso / Falta', value: fmtMinutos(totais.sumDebit), color: th.debit, accent: th.debit, sub: 'a compensar' },
    { label: 'Saldo', value: totais.saldoTxt, color: totais.saldoColor, accent: totais.saldo < 0 ? th.debit : th.credit, sub: 'banco de horas' }
  ];

  const chart = rows.map((r, idx) => {
    const c = computed[idx];
    const w = c.have ? c.worked : 0;
    let color = th.border;
    if (c.have) color = c.diff >= 0 ? th.accent : th.debit;
    return { h: Math.round((w / maxV) * 100) + '%', color, title: r.label + '  •  ' + (c.have ? fmtMinutos(w) : '—') };
  });

  const card = { background: th.panel, border: `1px solid ${th.border}`, borderRadius: 14 };
  const resultadoTitulo = totais.escopoLabel ? `Resultado — ${totais.escopoLabel}` : 'Resultado do mês';

  return (
    <div>
      {diasForaDePeriodo.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, background: th.focus, border: `1px solid ${th.accent}`, borderRadius: 11, padding: '13px 18px', marginBottom: 20, color: th.accent, fontSize: '13.5px', fontWeight: 700 }}>
          <IconAlert />
          <span>
            {diasForaDePeriodo.length} dia(s) com marcação fora de qualquer período cadastrado — não entram nos totais acima:{' '}
            {diasForaDePeriodo.slice(0, 6).map(fmtDataBR).join(', ')}
            {diasForaDePeriodo.length > 6 ? ` e mais ${diasForaDePeriodo.length - 6}` : ''}.
          </span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        {kpis.map((k) => (
          <div key={k.label} style={{ ...card, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: k.accent }} />
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.6px', textTransform: 'uppercase', color: th.muted, marginBottom: 10 }}>{k.label}</div>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 30, fontWeight: 600, lineHeight: 1, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 12, color: th.muted, marginTop: 7 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 16 }}>
        <div style={{ ...card, padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 16, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' }}>Horas por dia</div>
            <div style={{ fontSize: 12, color: th.muted }}>meta {cargaPadrao}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 170, paddingTop: 14, borderBottom: `1px solid ${th.border}` }}>
            {chart.map((b, i) => (
              <div key={i} title={b.title} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', height: '100%', gap: 5 }}>
                <div style={{ width: '100%', maxWidth: 22, borderRadius: '4px 4px 0 0', background: b.color, height: b.h, minHeight: 2, transition: 'height .2s' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 9, fontSize: '10.5px', color: th.muted }}>
            <span>{rows.length ? rows[0].label.slice(0, 5) : ''}</span>
            <span>{rows.length ? rows[rows.length - 1].label.slice(0, 5) : ''}</span>
          </div>
        </div>

        <div style={{ ...card, padding: '20px 22px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 16, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 16 }}>{resultadoTitulo}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: `1px solid ${th.border}` }}>
              <span style={{ fontSize: 13, color: th.muted }}>Horas extras</span>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 16, fontWeight: 600, color: th.credit }}>{fmtMinutos(totais.sumExtras)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: `1px solid ${th.border}` }}>
              <span style={{ fontSize: 13, color: th.muted }}>Atraso / Falta</span>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 16, fontWeight: 600, color: th.debit }}>{fmtMinutos(totais.sumDebit)}</span>
            </div>
          </div>
          <div style={{ marginTop: 'auto', paddingTop: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: th.muted }}>Saldo do banco de horas</div>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 40, fontWeight: 600, lineHeight: 1.1, color: totais.saldoColor }}>{totais.saldoTxt}</div>
            <div style={{ fontSize: 12, color: th.muted, marginTop: 2 }}>{totais.saldoNote}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
