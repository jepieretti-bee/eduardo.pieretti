import { compute, fmtMinutos } from '../lib/time';
import { IconLock } from '../components/Icons';

const PUNCH_FIELDS = [
  { field: 'entrada', label: 'Entrada' },
  { field: 'saidaAlmoco', label: 'Saída Almoço' },
  { field: 'voltaAlmoco', label: 'Volta Almoço' },
  { field: 'saida', label: 'Saída' }
];

export default function Registrar({ th, rows, selectedIso, onPrevDay, onNextDay, onToday, updateDia, locked }) {
  const srow = rows.find((r) => r.iso === selectedIso) || rows[0];
  const sc = srow ? compute(srow) : { have: false, worked: 0, diff: 0, filled: 0 };

  let statusText = 'Não registrado', statusColor = th.muted, statusBg = th.stripe;
  if (sc.filled === 4) { statusText = 'Completo'; statusColor = th.credit; statusBg = th.focus; }
  else if (sc.filled > 0) { statusText = 'Incompleto'; statusColor = th.accent; statusBg = th.focus; }

  function setNow(field) {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    updateDia(srow.iso, field, hh);
  }

  const inputStyle = {
    width: '100%', textAlign: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: 24, fontWeight: 600,
    color: th.text, border: `1.5px solid ${th.border}`, borderRadius: 10, padding: '10px 4px',
    background: th.bg, outline: 'none'
  };

  const resultCard = { background: th.panel, border: `1px solid ${th.border}`, borderRadius: 12, padding: '15px 18px' };
  const resultLabel = { fontSize: 11, fontWeight: 700, letterSpacing: '.5px', textTransform: 'uppercase', color: th.muted, marginBottom: 7 };

  if (!srow) return null;

  return (
    <div style={{ maxWidth: 860 }}>
      {locked && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, background: th.focus, border: `1px solid ${th.debit}`, borderRadius: 11, padding: '13px 18px', marginBottom: 18, color: th.debit, fontSize: '13.5px', fontWeight: 700 }}>
          <IconLock />
          Período encerrado — edição bloqueada. Reabra em Configurações para lançar.
        </div>
      )}

      <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: th.panel, border: `1px solid ${th.border}`, borderRadius: 11, padding: 5 }}>
          <button onClick={onPrevDay} style={dayNavBtn(th)}>‹</button>
          <div style={{ minWidth: 150, textAlign: 'center', fontWeight: 700, fontFamily: "'IBM Plex Mono',monospace", fontSize: 14 }}>{srow.label}</div>
          <button onClick={onNextDay} style={dayNavBtn(th)}>›</button>
        </div>
        <button onClick={onToday} style={{ cursor: 'pointer', background: th.panel, border: `1px solid ${th.border}`, color: th.muted, borderRadius: 9, padding: '9px 15px', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>
          Hoje
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 20, background: statusBg, color: statusColor, fontSize: '12.5px', fontWeight: 700 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor }} />
          {statusText}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 16 }}>
        {PUNCH_FIELDS.map((p) => (
          <div key={p.field} style={{ background: th.panel, border: `1px solid ${th.border}`, borderRadius: 14, padding: '16px 15px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.6px', textTransform: 'uppercase', color: th.muted, textAlign: 'center' }}>{p.label}</div>
            <input
              type="text" inputMode="numeric" maxLength={5} placeholder="--:--"
              value={srow[p.field]}
              onChange={(e) => updateDia(srow.iso, p.field, e.target.value)}
              disabled={locked}
              style={inputStyle}
            />
            <button onClick={() => setNow(p.field)} disabled={locked} style={{ cursor: 'pointer', background: 'transparent', border: `1px solid ${th.border}`, color: th.accent, borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', width: '100%', transition: '.12s' }}>
              Agora
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        <div style={resultCard}>
          <div style={resultLabel}>Carga do dia</div>
          <input
            value={srow.carga}
            onChange={(e) => updateDia(srow.iso, 'carga', e.target.value)}
            disabled={locked}
            placeholder="08:00"
            style={{ width: '100%', fontFamily: "'IBM Plex Mono',monospace", fontSize: 20, fontWeight: 600, color: th.text, border: 'none', borderBottom: `1.5px solid ${th.border}`, padding: '2px 0', background: 'transparent', outline: 'none' }}
          />
        </div>
        <div style={resultCard}>
          <div style={resultLabel}>Trabalhadas</div>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 24, fontWeight: 600 }}>{sc.have ? fmtMinutos(sc.worked) : '—'}</div>
        </div>
        <div style={resultCard}>
          <div style={resultLabel}>Extras</div>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 24, fontWeight: 600, color: th.credit }}>{sc.have && sc.diff > 0 ? fmtMinutos(sc.diff) : '0:00'}</div>
        </div>
        <div style={resultCard}>
          <div style={resultLabel}>BH / Atr / Falta</div>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 24, fontWeight: 600, color: th.debit }}>{sc.have && sc.diff < 0 ? fmtMinutos(-sc.diff) : '0:00'}</div>
        </div>
      </div>

      <p style={{ fontSize: '12.5px', color: th.muted, lineHeight: 1.6, margin: '20px 0 0' }}>
        Preencha os horários em qualquer ordem — use <strong style={{ color: th.text }}>Agora</strong> para carregar o horário atual. O cálculo é instantâneo e salvo automaticamente.
      </p>
    </div>
  );
}

function dayNavBtn(th) {
  return { cursor: 'pointer', border: 'none', background: 'transparent', color: th.text, width: 34, height: 34, borderRadius: 8, fontSize: 18 };
}
