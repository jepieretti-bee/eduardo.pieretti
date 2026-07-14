import { useRef, useState } from 'react';
import { maskHora } from '../lib/time';
import { fmtDataBR } from '../lib/feriados';
import { api } from '../lib/api';

const TEMA_OPTS = [
  ['sistema', 'Sistema'],
  ['claro', 'Claro'],
  ['escuro', 'Escuro']
];

export default function Configuracoes({
  th, config, saveConfig, periodos, createPeriodo, updatePeriodo, togglePeriodo, deletePeriodo,
  feriados, createFeriado, deleteFeriado
}) {
  const [nome, setNome] = useState(config.funcionario);
  const [jEntrada, setJEntrada] = useState(config.jornadaEntrada || '08:00');
  const [jSaidaAlmoco, setJSaidaAlmoco] = useState(config.jornadaSaidaAlmoco || '11:00');
  const [jVoltaAlmoco, setJVoltaAlmoco] = useState(config.jornadaVoltaAlmoco || '12:00');
  const [jSaida, setJSaida] = useState(config.jornadaSaida || '17:00');
  const [tolerancia, setTolerancia] = useState(String(Number.isFinite(config.tolerancia) ? config.tolerancia : 15));
  const [showNovo, setShowNovo] = useState(false);
  const [showNovoFeriado, setShowNovoFeriado] = useState(false);

  const card = { background: th.panel, border: `1px solid ${th.border}`, borderRadius: 14, padding: '22px 24px' };
  const sectionTitle = { fontFamily: "'Oswald',sans-serif", fontSize: 16, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' };
  const label = { fontSize: 11, fontWeight: 700, letterSpacing: '.6px', textTransform: 'uppercase', color: th.muted };
  const textInput = { width: '100%', boxSizing: 'border-box', fontFamily: 'Lato', fontSize: 15, fontWeight: 600, color: th.text, border: `1.5px solid ${th.border}`, borderRadius: 9, padding: '11px 13px', background: th.bg, outline: 'none' };
  const monoInput = { ...textInput, fontFamily: "'IBM Plex Mono',monospace", textAlign: 'center' };

  return (
    <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Colaborador */}
      <div style={card}>
        <div style={{ ...sectionTitle, marginBottom: 18 }}>Dados do colaborador</div>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <span style={label}>Nome</span>
          <input
            value={nome} onChange={(e) => setNome(e.target.value)}
            onBlur={() => saveConfig({ funcionario: nome })}
            placeholder="Nome do colaborador" style={textInput}
          />
        </label>
      </div>

      {/* Jornada por intervalos */}
      <div style={card}>
        <div style={{ ...sectionTitle, marginBottom: 18 }}>Jornada de trabalho</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 18 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 }}>
            <span style={label}>Entrada</span>
            <input
              value={jEntrada} onChange={(e) => setJEntrada(maskHora(e.target.value))}
              onBlur={() => saveConfig({ jornadaEntrada: jEntrada })}
              inputMode="numeric" maxLength={5} placeholder="08:00" style={monoInput}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 }}>
            <span style={label}>Saída almoço</span>
            <input
              value={jSaidaAlmoco} onChange={(e) => setJSaidaAlmoco(maskHora(e.target.value))}
              onBlur={() => saveConfig({ jornadaSaidaAlmoco: jSaidaAlmoco })}
              inputMode="numeric" maxLength={5} placeholder="11:00" style={monoInput}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 }}>
            <span style={label}>Volta almoço</span>
            <input
              value={jVoltaAlmoco} onChange={(e) => setJVoltaAlmoco(maskHora(e.target.value))}
              onBlur={() => saveConfig({ jornadaVoltaAlmoco: jVoltaAlmoco })}
              inputMode="numeric" maxLength={5} placeholder="12:00" style={monoInput}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 }}>
            <span style={label}>Saída</span>
            <input
              value={jSaida} onChange={(e) => setJSaida(maskHora(e.target.value))}
              onBlur={() => saveConfig({ jornadaSaida: jSaida })}
              inputMode="numeric" maxLength={5} placeholder="17:00" style={monoInput}
            />
          </label>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 7, maxWidth: 200 }}>
          <span style={label}>Tolerância (minutos)</span>
          <input
            value={tolerancia}
            onChange={(e) => setTolerancia(e.target.value.replace(/\D/g, '').slice(0, 3))}
            onBlur={() => saveConfig({ tolerancia: parseInt(tolerancia, 10) || 0 })}
            inputMode="numeric" placeholder="15" style={monoInput}
          />
        </label>

        <p style={{ fontSize: 12, color: th.muted, lineHeight: 1.5, margin: '16px 0 0' }}>
          Chegar até a tolerância antes da entrada (ou sair até a tolerância depois da saída) não gera hora
          extra — só o que passar disso conta. Chegar atrasado ou sair antes do horário conta 100% como atraso,
          sem tolerância. No intervalo de almoço, um retorno mais cedo que o esperado não gera extra; um retorno
          mais tarde conta como atraso.
        </p>
      </div>

      {/* Períodos */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={sectionTitle}>Períodos</div>
          <button
            onClick={() => setShowNovo((v) => !v)}
            style={{ cursor: 'pointer', background: showNovo ? th.stripe : th.accent, color: showNovo ? th.text : '#fff', border: 'none', borderRadius: 9, padding: '9px 15px', fontSize: 13, fontWeight: 700, fontFamily: 'Lato' }}
          >
            {showNovo ? 'Cancelar' : '+ Novo período'}
          </button>
        </div>

        {showNovo && (
          <NovoPeriodo th={th} textInput={textInput} label={label}
            onCreate={async (p) => { await createPeriodo(p); setShowNovo(false); }} />
        )}

        {periodos.length === 0 && !showNovo && (
          <p style={{ fontSize: 13, color: th.muted, margin: 0 }}>Nenhum período cadastrado ainda.</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {periodos.map((p) => (
            <PeriodoCard
              key={p.id} th={th} periodo={p} textInput={textInput} label={label}
              onSave={(patch) => updatePeriodo(p.id, patch)}
              onToggle={() => togglePeriodo(p.id)}
              onDelete={() => deletePeriodo(p.id)}
            />
          ))}
        </div>

        <p style={{ fontSize: 12, color: th.muted, lineHeight: 1.5, margin: '16px 0 0' }}>
          Ao encerrar um período, os dias dentro do seu intervalo de datas ficam bloqueados para edição no Registrar e no Espelho. Reabra para ajustar.
        </p>
      </div>

      {/* Feriados */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={sectionTitle}>Feriados</div>
          <button
            onClick={() => setShowNovoFeriado((v) => !v)}
            style={{ cursor: 'pointer', background: showNovoFeriado ? th.stripe : th.accent, color: showNovoFeriado ? th.text : '#fff', border: 'none', borderRadius: 9, padding: '9px 15px', fontSize: 13, fontWeight: 700, fontFamily: 'Lato' }}
          >
            {showNovoFeriado ? 'Cancelar' : '+ Novo feriado'}
          </button>
        </div>

        {showNovoFeriado && (
          <NovoFeriado th={th} textInput={textInput} label={label}
            onCreate={async (f) => { await createFeriado(f); setShowNovoFeriado(false); }} />
        )}

        {feriados.length === 0 && !showNovoFeriado && (
          <p style={{ fontSize: 13, color: th.muted, margin: 0 }}>Nenhum feriado cadastrado ainda.</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {feriados.map((f) => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: `1px solid ${th.border}`, borderRadius: 9, padding: '10px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, fontWeight: 700, color: th.text }}>{fmtDataBR(f.data)}</span>
                <span style={{ fontSize: 13, color: th.muted }}>{f.nome || '—'}</span>
              </div>
              <button onClick={() => deleteFeriado(f.id)} style={{ cursor: 'pointer', background: 'transparent', border: 'none', color: th.muted, fontSize: 12, fontWeight: 700, fontFamily: 'Lato' }}>
                Excluir
              </button>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 12, color: th.muted, lineHeight: 1.5, margin: '16px 0 0' }}>
          Dias marcados como feriado não contam carga (nada a compensar), mesmo sem lançamento. Se houver horas trabalhadas nesse dia, entram como extra.
        </p>
      </div>

      {/* Tema */}
      <div style={card}>
        <div style={{ ...sectionTitle, marginBottom: 16 }}>Tema</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {TEMA_OPTS.map(([k, txt]) => {
            const active = (config.tema || 'claro') === k;
            return (
              <button
                key={k}
                onClick={() => saveConfig({ tema: k })}
                style={{
                  flex: 1, cursor: 'pointer', borderRadius: 10, padding: '13px 10px', fontSize: '13.5px',
                  fontWeight: 700, fontFamily: 'Lato', transition: '.12s',
                  border: `1.5px solid ${active ? th.accent : th.border}`,
                  background: active ? th.accent : 'transparent',
                  color: active ? '#fff' : th.muted
                }}
              >
                {txt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Backup */}
      <BackupSection th={th} card={card} sectionTitle={sectionTitle} />
    </div>
  );
}

function BackupSection({ th, card, sectionTitle }) {
  const fileInputRef = useRef(null);
  const [status, setStatus] = useState(null); // null | { kind:'confirm', backup } | { kind:'restoring' } | { kind:'done' } | { kind:'error', message }

  async function baixar() {
    const backup = await api.getBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `controle-ponto-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function onFileChosen(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const backup = JSON.parse(reader.result);
        if (!backup || typeof backup !== 'object' || !Array.isArray(backup.dias)) {
          throw new Error('formato inválido');
        }
        setStatus({ kind: 'confirm', backup });
      } catch {
        setStatus({ kind: 'error', message: 'Esse arquivo não parece ser um backup válido.' });
      }
    };
    reader.readAsText(file);
  }

  async function confirmarRestaurar() {
    if (status?.kind !== 'confirm') return;
    setStatus({ kind: 'restoring' });
    try {
      await api.restoreBackup(status.backup);
      window.location.reload();
    } catch {
      setStatus({ kind: 'error', message: 'Não foi possível restaurar esse backup.' });
    }
  }

  const btn = { cursor: 'pointer', background: th.panel, border: `1px solid ${th.border}`, color: th.text, borderRadius: 9, padding: '11px 18px', fontSize: 13.5, fontWeight: 700, fontFamily: 'Lato' };

  return (
    <div style={card}>
      <div style={{ ...sectionTitle, marginBottom: 18 }}>Backup</div>
      <div style={{ display: 'flex', gap: 10, marginBottom: status ? 14 : 0 }}>
        <button onClick={baixar} style={{ ...btn, background: th.accent, color: '#fff', border: 'none' }}>Baixar backup</button>
        <button onClick={() => fileInputRef.current?.click()} style={btn}>Restaurar backup</button>
        <input ref={fileInputRef} type="file" accept="application/json" onChange={onFileChosen} style={{ display: 'none' }} />
      </div>

      {status?.kind === 'confirm' && (
        <div style={{ background: th.focus, border: `1px solid ${th.debit}`, borderRadius: 10, padding: '14px 16px' }}>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: th.debit, fontWeight: 700, lineHeight: 1.5 }}>
            Isso vai substituir TODOS os dados atuais (colaborador, períodos, feriados e marcações) pelos do arquivo
            {' '}"{status.backup.exportedAt ? fmtDataBR(status.backup.exportedAt.slice(0, 10)) : 'selecionado'}". Essa ação não pode ser desfeita.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={confirmarRestaurar} style={{ ...btn, background: th.debit, color: '#fff', border: 'none' }}>Confirmar restauração</button>
            <button onClick={() => setStatus(null)} style={btn}>Cancelar</button>
          </div>
        </div>
      )}
      {status?.kind === 'restoring' && <span style={{ fontSize: 13.5, color: th.muted }}>Restaurando…</span>}
      {status?.kind === 'error' && (
        <div>
          <p style={{ fontSize: 13.5, fontWeight: 700, color: th.debit, margin: '0 0 8px' }}>{status.message}</p>
          <button onClick={() => setStatus(null)} style={btn}>Fechar</button>
        </div>
      )}

      <p style={{ fontSize: 12, color: th.muted, lineHeight: 1.5, margin: '16px 0 0' }}>
        O backup é um arquivo .json com todos os seus dados (colaborador, períodos, feriados e marcações). Guarde-o num
        lugar seguro (nuvem, pendrive) — sem ele, formatar ou trocar de computador apaga tudo.
      </p>
    </div>
  );
}

function NovoPeriodo({ th, textInput, label, onCreate }) {
  const [nome, setNome] = useState('');
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');

  const podeCriar = inicio && fim;

  return (
    <div style={{ border: `1.5px dashed ${th.border}`, borderRadius: 12, padding: 18, marginBottom: 16 }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14 }}>
        <span style={label}>Nome do período</span>
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Competência Junho/Julho 2026" style={textInput} />
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 }}>
          <span style={label}>Data de início</span>
          <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} style={{ ...textInput, fontFamily: "'IBM Plex Mono',monospace" }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 }}>
          <span style={label}>Data de fim</span>
          <input type="date" value={fim} onChange={(e) => setFim(e.target.value)} style={{ ...textInput, fontFamily: "'IBM Plex Mono',monospace" }} />
        </label>
      </div>
      <button
        disabled={!podeCriar}
        onClick={() => onCreate({ nome, dataInicio: inicio, dataFim: fim })}
        style={{ cursor: podeCriar ? 'pointer' : 'not-allowed', background: th.accent, color: '#fff', border: 'none', borderRadius: 9, padding: '11px 20px', fontSize: '13.5px', fontWeight: 700, fontFamily: 'Lato' }}
      >
        Criar período
      </button>
    </div>
  );
}

function NovoFeriado({ th, textInput, label, onCreate }) {
  const [data, setData] = useState('');
  const [nome, setNome] = useState('');

  const podeCriar = !!data;

  return (
    <div style={{ border: `1.5px dashed ${th.border}`, borderRadius: 12, padding: 18, marginBottom: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 16 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 }}>
          <span style={label}>Data</span>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} style={{ ...textInput, fontFamily: "'IBM Plex Mono',monospace" }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 }}>
          <span style={label}>Nome (opcional)</span>
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Independência" style={textInput} />
        </label>
      </div>
      <button
        disabled={!podeCriar}
        onClick={() => onCreate({ data, nome })}
        style={{ cursor: podeCriar ? 'pointer' : 'not-allowed', background: th.accent, color: '#fff', border: 'none', borderRadius: 9, padding: '11px 20px', fontSize: '13.5px', fontWeight: 700, fontFamily: 'Lato' }}
      >
        Adicionar feriado
      </button>
    </div>
  );
}

function PeriodoCard({ th, periodo, textInput, label, onSave, onToggle, onDelete }) {
  const [nome, setNome] = useState(periodo.nome);
  const [inicio, setInicio] = useState(periodo.dataInicio);
  const [fim, setFim] = useState(periodo.dataFim);
  const locked = !!periodo.encerrado;

  const statusColor = locked ? th.debit : th.credit;
  const statusBg = locked ? th.focus : th.stripe;

  return (
    <div style={{ border: `1px solid ${th.border}`, borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 13px', borderRadius: 20, background: statusBg, color: statusColor, fontSize: 12, fontWeight: 700 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor }} />
          {locked ? 'Encerrado' : 'Aberto'}
        </div>
        <button onClick={onDelete} style={{ cursor: 'pointer', background: 'transparent', border: 'none', color: th.muted, fontSize: 12, fontWeight: 700, fontFamily: 'Lato' }}>
          Excluir
        </button>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14 }}>
        <span style={label}>Nome do período</span>
        <input
          value={nome} onChange={(e) => setNome(e.target.value)}
          onBlur={() => onSave({ nome })}
          disabled={locked}
          placeholder="Ex.: Competência Junho/Julho 2026" style={textInput}
        />
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 }}>
          <span style={label}>Data de início</span>
          <input
            type="date" value={inicio} disabled={locked}
            onChange={(e) => { setInicio(e.target.value); onSave({ dataInicio: e.target.value }); }}
            style={{ ...textInput, fontFamily: "'IBM Plex Mono',monospace" }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 }}>
          <span style={label}>Data de fim</span>
          <input
            type="date" value={fim} disabled={locked}
            onChange={(e) => { setFim(e.target.value); onSave({ dataFim: e.target.value }); }}
            style={{ ...textInput, fontFamily: "'IBM Plex Mono',monospace" }}
          />
        </label>
      </div>

      <button
        onClick={onToggle}
        style={{
          cursor: 'pointer', borderRadius: 9, padding: '11px 20px', fontSize: '13.5px', fontWeight: 700, fontFamily: 'Lato',
          background: locked ? th.credit : 'transparent',
          color: locked ? '#fff' : th.debit,
          border: `1.5px solid ${locked ? th.credit : th.debit}`
        }}
      >
        {locked ? 'Reabrir período' : 'Encerrar período'}
      </button>
    </div>
  );
}
