import { useState } from 'react';
import { maskHora } from '../lib/time';

const TEMA_OPTS = [
  ['sistema', 'Sistema'],
  ['claro', 'Claro'],
  ['escuro', 'Escuro']
];

export default function Configuracoes({ th, config, saveConfig, periodos, createPeriodo, updatePeriodo, togglePeriodo, deletePeriodo }) {
  const [nome, setNome] = useState(config.funcionario);
  const [jornada, setJornada] = useState(config.cargaPadrao);
  const [showNovo, setShowNovo] = useState(false);

  const card = { background: th.panel, border: `1px solid ${th.border}`, borderRadius: 14, padding: '22px 24px' };
  const sectionTitle = { fontFamily: "'Oswald',sans-serif", fontSize: 16, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' };
  const label = { fontSize: 11, fontWeight: 700, letterSpacing: '.6px', textTransform: 'uppercase', color: th.muted };
  const textInput = { fontFamily: 'Lato', fontSize: 15, fontWeight: 600, color: th.text, border: `1.5px solid ${th.border}`, borderRadius: 9, padding: '11px 13px', background: th.bg, outline: 'none' };
  const monoInput = { ...textInput, fontFamily: "'IBM Plex Mono',monospace", textAlign: 'center' };

  return (
    <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Colaborador */}
      <div style={card}>
        <div style={{ ...sectionTitle, marginBottom: 18 }}>Dados do colaborador</div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <span style={label}>Nome</span>
            <input
              value={nome} onChange={(e) => setNome(e.target.value)}
              onBlur={() => saveConfig({ funcionario: nome })}
              placeholder="Nome do colaborador" style={textInput}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <span style={label}>Jornada / dia</span>
            <input
              value={jornada} onChange={(e) => setJornada(maskHora(e.target.value))}
              onBlur={() => saveConfig({ cargaPadrao: jornada })}
              inputMode="numeric" maxLength={5} placeholder="08:00" style={monoInput}
            />
          </label>
        </div>
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
        <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <span style={label}>Data de início</span>
          <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} style={{ ...textInput, fontFamily: "'IBM Plex Mono',monospace" }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
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
        <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <span style={label}>Data de início</span>
          <input
            type="date" value={inicio} disabled={locked}
            onChange={(e) => { setInicio(e.target.value); onSave({ dataInicio: e.target.value }); }}
            style={{ ...textInput, fontFamily: "'IBM Plex Mono',monospace" }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
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
