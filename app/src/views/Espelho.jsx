import { useRef, useState } from 'react';
import { compute, fmtMinutos } from '../lib/time';
import { IconLock, IconAlert } from '../components/Icons';
import { extrairMarcacoesPdf } from '../lib/pdfImport';
import { fmtDataBR } from '../lib/feriados';

export default function Espelho({
  th, rows, cargaPadrao, jornada, updateDia, toggleFalta, isLocked, anyLocked, clearMonth, importDias,
  diasForaDePeriodo = [], foraDePeriodoFn
}) {
  const computed = rows.map((r) => compute(r, jornada ?? cargaPadrao));
  const fileInputRef = useRef(null);
  const [importState, setImportState] = useState(null);

  let sumWorked = 0, sumExtras = 0, sumAtraso = 0;
  let saldoAcumulado = 0;
  const saldos = computed.map((c) => {
    if (c.have) {
      sumWorked += c.worked;
      sumExtras += c.extra;
      sumAtraso += c.atraso;
      saldoAcumulado += c.diff;
    }
    return saldoAcumulado;
  });

  async function handleFileChosen(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImportState({ status: 'parsing' });
    try {
      const { porDia, totalMarcacoes, totalDias } = await extrairMarcacoesPdf(file);
      setImportState({ status: 'preview', porDia, totalMarcacoes, totalDias });
    } catch (err) {
      setImportState({ status: 'error', message: err.message || 'Não foi possível ler esse PDF.' });
    }
  }

  async function confirmarImport() {
    if (importState?.status !== 'preview') return;
    const { porDia } = importState;
    setImportState({ status: 'importando' });
    const { importados, bloqueados } = await importDias(porDia);
    setImportState({ status: 'done', importados, bloqueados });
  }

  const cellInput = (locked) => ({
    width: '100%', border: 'none', background: 'transparent', textAlign: 'center', padding: '11px 4px',
    fontFamily: "'IBM Plex Mono',monospace", fontSize: '13.5px', color: th.text, outline: 'none',
    opacity: locked ? 0.65 : 1
  });

  function handleClear() {
    if (window.confirm('Limpar todos os lançamentos deste mês? Esta ação não pode ser desfeita.')) {
      clearMonth();
    }
  }

  return (
    <div>
      {anyLocked && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, background: th.focus, border: `1px solid ${th.debit}`, borderRadius: 11, padding: '13px 18px', marginBottom: 16, color: th.debit, fontSize: '13.5px', fontWeight: 700 }}>
          <IconLock />
          Período encerrado — edição bloqueada.
        </div>
      )}

      {diasForaDePeriodo.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, background: th.focus, border: `1px solid ${th.accent}`, borderRadius: 11, padding: '13px 18px', marginBottom: 16, color: th.accent, fontSize: '13.5px', fontWeight: 700 }}>
          <IconAlert />
          {diasForaDePeriodo.length} dia(s) deste mês não pertencem a nenhum período cadastrado ({diasForaDePeriodo.map(fmtDataBR).join(', ')}) — não entram nos totais do Painel.
        </div>
      )}

      <div className="no-print" style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button onClick={() => window.print()} style={toolBtn(th)}>Imprimir</button>
        <button onClick={handleClear} style={toolBtn(th)}>Limpar mês</button>
        <button onClick={() => fileInputRef.current?.click()} style={toolBtn(th)}>Importar PDF</button>
        <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleFileChosen} style={{ display: 'none' }} />
      </div>

      {importState && (
        <div className="no-print" style={{ background: th.panel, border: `1px solid ${th.border}`, borderRadius: 12, padding: '16px 18px', marginBottom: 16 }}>
          {importState.status === 'parsing' && (
            <span style={{ fontSize: 13.5, color: th.muted }}>Lendo PDF…</span>
          )}
          {importState.status === 'error' && (
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: th.debit, marginBottom: 8 }}>{importState.message}</div>
              <button onClick={() => setImportState(null)} style={toolBtn(th)}>Fechar</button>
            </div>
          )}
          {importState.status === 'preview' && (
            <div>
              <div style={{ fontSize: 13.5, color: th.text, marginBottom: 4 }}>
                Encontramos <strong>{importState.totalMarcacoes}</strong> marcações em <strong>{importState.totalDias}</strong> dias
                {' '}({fmtDataBR(Object.keys(importState.porDia).sort()[0])} – {fmtDataBR(Object.keys(importState.porDia).sort().slice(-1)[0])}).
              </div>
              <div style={{ fontSize: 12.5, color: th.muted, marginBottom: 12 }}>
                Isso vai sobrescrever entrada/saída dos dias listados (mesmo em outros meses) e remover a marcação de falta desses dias. Dias em períodos encerrados são pulados.
              </div>
              {foraDePeriodoFn && (() => {
                const fora = Object.keys(importState.porDia).filter(foraDePeriodoFn).sort();
                return fora.length > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: th.focus, border: `1px solid ${th.accent}`, borderRadius: 9, padding: '10px 12px', marginBottom: 12, color: th.accent, fontSize: '12.5px', fontWeight: 700 }}>
                    <IconAlert width={15} height={15} />
                    {fora.length} dia(s) importado(s) ficam fora de qualquer período cadastrado: {fora.map(fmtDataBR).join(', ')}. Ajuste o período em Configurações se quiser que entrem nos totais do Painel.
                  </div>
                ) : null;
              })()}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={confirmarImport} style={{ ...toolBtn(th), background: th.accent, color: '#fff', border: 'none' }}>
                  Confirmar importação
                </button>
                <button onClick={() => setImportState(null)} style={toolBtn(th)}>Cancelar</button>
              </div>
            </div>
          )}
          {importState.status === 'importando' && (
            <span style={{ fontSize: 13.5, color: th.muted }}>Importando…</span>
          )}
          {importState.status === 'done' && (
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: th.credit, marginBottom: 8 }}>
                {importState.importados} dia(s) importado(s){importState.bloqueados > 0 ? `, ${importState.bloqueados} pulado(s) por período encerrado` : ''}.
              </div>
              <button onClick={() => setImportState(null)} style={toolBtn(th)}>Fechar</button>
            </div>
          )}
        </div>
      )}

      <div style={{ background: th.panel, border: `1px solid ${th.border}`, borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ background: th.headerBg, color: th.headerText }}>
              <th style={thStyle('left', '13px 16px')}>Dia</th>
              <th style={thStyle('center', '13px 8px')}>Falta</th>
              <th style={thStyle('center', '13px 8px')}>Carga</th>
              <th style={thStyle('center', '13px 8px')}>Entrada</th>
              <th style={thStyle('center', '13px 8px')}>Saída almoço</th>
              <th style={thStyle('center', '13px 8px')}>Volta almoço</th>
              <th style={thStyle('center', '13px 8px')}>Saída</th>
              <th style={thStyle('center', '13px 8px')}>Trabalhadas</th>
              <th style={thStyle('center', '13px 8px')}>Extras</th>
              <th style={thStyle('center', '13px 8px')}>Atraso</th>
              <th style={thStyle('center', '13px 16px')}>Saldo</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const c = computed[idx];
              const locked = isLocked(row.iso);
              let horasTrab = '', extras = '', bh = '', extrasColor = th.muted, bhColor = th.muted;
              if (c.have) {
                horasTrab = fmtMinutos(c.worked);
                extras = fmtMinutos(c.extra);
                bh = fmtMinutos(c.atraso);
                extrasColor = c.extra > 0 ? th.credit : th.muted;
                bhColor = c.atraso > 0 ? th.debit : th.muted;
              }
              const saldo = saldos[idx];
              const saldoTxt = (saldo > 0 ? '+' : '') + fmtMinutos(saldo);
              const saldoColor = saldo > 0 ? th.credit : saldo < 0 ? th.debit : th.muted;
              const punchesDisabled = locked || row.falta;
              const rowBg = row.falta ? th.focus : (row.isFeriado ? th.stripe : (idx % 2 ? 'transparent' : th.stripe));
              return (
                <tr key={row.iso} style={{ borderTop: `1px solid ${th.rowBorder}`, background: rowBg }}>
                  <td style={{ padding: '0 16px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {row.label}
                    {row.isFeriado && (
                      <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: th.muted, textTransform: 'uppercase' }}>
                        · Feriado{row.feriadoNome ? ` (${row.feriadoNome})` : ''}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '0 8px', textAlign: 'center' }}>
                    <input
                      type="checkbox" checked={row.falta}
                      onChange={() => toggleFalta(row.iso)}
                      disabled={locked || row.isFeriado}
                      style={{ width: 16, height: 16, accentColor: th.debit, cursor: locked || row.isFeriado ? 'not-allowed' : 'pointer' }}
                    />
                  </td>
                  <td style={{ padding: 0, textAlign: 'center' }}>
                    <input value={row.carga} onChange={(e) => updateDia(row.iso, 'carga', e.target.value)} disabled={locked || row.isFeriado} placeholder="08:00" style={{ ...cellInput(locked), color: th.muted }} />
                  </td>
                  <td style={{ padding: 0, textAlign: 'center', borderLeft: `1px solid ${th.rowBorder}` }}>
                    <input type="text" inputMode="numeric" maxLength={5} placeholder="--:--" value={row.entrada} onChange={(e) => updateDia(row.iso, 'entrada', e.target.value)} disabled={punchesDisabled} style={cellInput(punchesDisabled)} />
                  </td>
                  <td style={{ padding: 0, textAlign: 'center' }}>
                    <input type="text" inputMode="numeric" maxLength={5} placeholder="--:--" value={row.saidaAlmoco} onChange={(e) => updateDia(row.iso, 'saidaAlmoco', e.target.value)} disabled={punchesDisabled} style={cellInput(punchesDisabled)} />
                  </td>
                  <td style={{ padding: 0, textAlign: 'center' }}>
                    <input type="text" inputMode="numeric" maxLength={5} placeholder="--:--" value={row.voltaAlmoco} onChange={(e) => updateDia(row.iso, 'voltaAlmoco', e.target.value)} disabled={punchesDisabled} style={cellInput(punchesDisabled)} />
                  </td>
                  <td style={{ padding: 0, textAlign: 'center', borderRight: `1px solid ${th.rowBorder}` }}>
                    <input type="text" inputMode="numeric" maxLength={5} placeholder="--:--" value={row.saida} onChange={(e) => updateDia(row.iso, 'saida', e.target.value)} disabled={punchesDisabled} style={cellInput(punchesDisabled)} />
                  </td>
                  <td style={{ padding: '11px 8px', textAlign: 'center', fontFamily: "'IBM Plex Mono',monospace", fontWeight: 600 }}>{row.falta ? 'Falta' : horasTrab}</td>
                  <td style={{ padding: '11px 8px', textAlign: 'center', fontFamily: "'IBM Plex Mono',monospace", fontWeight: 500, color: extrasColor }}>{extras}</td>
                  <td style={{ padding: '11px 8px', textAlign: 'center', fontFamily: "'IBM Plex Mono',monospace", fontWeight: 500, color: bhColor }}>{bh}</td>
                  <td style={{ padding: '11px 16px', textAlign: 'center', fontFamily: "'IBM Plex Mono',monospace", fontWeight: 600, color: saldoColor }}>{saldoTxt}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `2px solid ${th.headerBg}`, background: th.stripe, fontWeight: 700 }}>
              <td style={{ padding: '13px 16px', fontFamily: "'Oswald',sans-serif", textTransform: 'uppercase', letterSpacing: '.5px' }} colSpan={7}>Resultado do mês</td>
              <td style={{ padding: '13px 8px', textAlign: 'center', fontFamily: "'IBM Plex Mono',monospace", fontWeight: 600 }}>{fmtMinutos(sumWorked)}</td>
              <td style={{ padding: '13px 8px', textAlign: 'center', fontFamily: "'IBM Plex Mono',monospace", color: th.credit }}>{fmtMinutos(sumExtras)}</td>
              <td style={{ padding: '13px 8px', textAlign: 'center', fontFamily: "'IBM Plex Mono',monospace", color: sumAtraso > 0 ? th.debit : th.muted }}>{fmtMinutos(sumAtraso)}</td>
              <td style={{ padding: '13px 16px', textAlign: 'center', fontFamily: "'IBM Plex Mono',monospace", color: saldoAcumulado > 0 ? th.credit : saldoAcumulado < 0 ? th.debit : th.muted }}>
                {(saldoAcumulado > 0 ? '+' : '') + fmtMinutos(saldoAcumulado)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function thStyle(align, padding) {
  return { textAlign: align, padding, fontFamily: "'Oswald',sans-serif", fontSize: 12, fontWeight: 500, letterSpacing: '.8px', textTransform: 'uppercase', whiteSpace: align === 'left' ? 'nowrap' : undefined };
}

function toolBtn(th) {
  return { cursor: 'pointer', background: th.panel, border: `1px solid ${th.border}`, color: th.muted, borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' };
}
