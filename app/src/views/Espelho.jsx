import { compute, fmtMinutos } from '../lib/time';
import { IconLock } from '../components/Icons';

export default function Espelho({ th, rows, cargaPadrao, updateDia, isLocked, anyLocked, clearMonth }) {
  const computed = rows.map((r) => compute(r, cargaPadrao));

  let sumWorked = 0, sumExtras = 0, saldo = 0;
  computed.forEach((c) => {
    if (c.have) {
      sumWorked += c.worked;
      if (c.diff > 0) sumExtras += c.diff;
      saldo += c.diff;
    }
  });
  const saldoTxt = (saldo >= 0 ? '+' : '') + fmtMinutos(saldo);
  const saldoColor = saldo > 0 ? th.credit : saldo < 0 ? th.debit : th.muted;

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

      <div className="no-print" style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button onClick={() => window.print()} style={toolBtn(th)}>Imprimir</button>
        <button onClick={handleClear} style={toolBtn(th)}>Limpar mês</button>
      </div>

      <div style={{ background: th.panel, border: `1px solid ${th.border}`, borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ background: th.headerBg, color: th.headerText }}>
              <th style={thStyle('left', '13px 16px')}>Dia</th>
              <th style={thStyle('center', '13px 8px')}>Carga</th>
              <th style={thStyle('center', '13px 8px')}>Entrada</th>
              <th style={thStyle('center', '13px 8px')}>Saída almoço</th>
              <th style={thStyle('center', '13px 8px')}>Volta almoço</th>
              <th style={thStyle('center', '13px 8px')}>Saída</th>
              <th style={thStyle('center', '13px 8px')}>Trabalhadas</th>
              <th style={thStyle('center', '13px 8px')}>Extras</th>
              <th style={thStyle('center', '13px 16px')}>Atraso</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const c = computed[idx];
              const locked = isLocked(row.iso);
              let horasTrab = '', extras = '', bh = '', extrasColor = th.muted, bhColor = th.muted;
              if (c.have) {
                horasTrab = fmtMinutos(c.worked);
                extras = c.diff > 0 ? fmtMinutos(c.diff) : '0:00';
                bh = c.diff < 0 ? fmtMinutos(-c.diff) : '0:00';
                extrasColor = c.diff > 0 ? th.credit : th.muted;
                bhColor = c.diff < 0 ? th.debit : th.muted;
              }
              return (
                <tr key={row.iso} style={{ borderTop: `1px solid ${th.rowBorder}`, background: idx % 2 ? 'transparent' : th.stripe }}>
                  <td style={{ padding: '0 16px', fontWeight: 700, whiteSpace: 'nowrap' }}>{row.label}</td>
                  <td style={{ padding: 0, textAlign: 'center' }}>
                    <input value={row.carga} onChange={(e) => updateDia(row.iso, 'carga', e.target.value)} disabled={locked} placeholder="08:00" style={{ ...cellInput(locked), color: th.muted }} />
                  </td>
                  <td style={{ padding: 0, textAlign: 'center', borderLeft: `1px solid ${th.rowBorder}` }}>
                    <input type="text" inputMode="numeric" maxLength={5} placeholder="--:--" value={row.entrada} onChange={(e) => updateDia(row.iso, 'entrada', e.target.value)} disabled={locked} style={cellInput(locked)} />
                  </td>
                  <td style={{ padding: 0, textAlign: 'center' }}>
                    <input type="text" inputMode="numeric" maxLength={5} placeholder="--:--" value={row.saidaAlmoco} onChange={(e) => updateDia(row.iso, 'saidaAlmoco', e.target.value)} disabled={locked} style={cellInput(locked)} />
                  </td>
                  <td style={{ padding: 0, textAlign: 'center' }}>
                    <input type="text" inputMode="numeric" maxLength={5} placeholder="--:--" value={row.voltaAlmoco} onChange={(e) => updateDia(row.iso, 'voltaAlmoco', e.target.value)} disabled={locked} style={cellInput(locked)} />
                  </td>
                  <td style={{ padding: 0, textAlign: 'center', borderRight: `1px solid ${th.rowBorder}` }}>
                    <input type="text" inputMode="numeric" maxLength={5} placeholder="--:--" value={row.saida} onChange={(e) => updateDia(row.iso, 'saida', e.target.value)} disabled={locked} style={cellInput(locked)} />
                  </td>
                  <td style={{ padding: '11px 8px', textAlign: 'center', fontFamily: "'IBM Plex Mono',monospace", fontWeight: 600 }}>{horasTrab}</td>
                  <td style={{ padding: '11px 8px', textAlign: 'center', fontFamily: "'IBM Plex Mono',monospace", fontWeight: 500, color: extrasColor }}>{extras}</td>
                  <td style={{ padding: '11px 16px', textAlign: 'center', fontFamily: "'IBM Plex Mono',monospace", fontWeight: 500, color: bhColor }}>{bh}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `2px solid ${th.headerBg}`, background: th.stripe, fontWeight: 700 }}>
              <td style={{ padding: '13px 16px', fontFamily: "'Oswald',sans-serif", textTransform: 'uppercase', letterSpacing: '.5px' }} colSpan={6}>Resultado do mês</td>
              <td style={{ padding: '13px 8px', textAlign: 'center', fontFamily: "'IBM Plex Mono',monospace", fontWeight: 600 }}>{fmtMinutos(sumWorked)}</td>
              <td style={{ padding: '13px 8px', textAlign: 'center', fontFamily: "'IBM Plex Mono',monospace", color: th.credit }}>{fmtMinutos(sumExtras)}</td>
              <td style={{ padding: '13px 16px', textAlign: 'center', fontFamily: "'IBM Plex Mono',monospace", color: saldoColor }}>{saldoTxt}</td>
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
