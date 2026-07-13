import { useEffect, useMemo, useState, useCallback } from 'react';
import { api } from './lib/api';
import { resolveTheme, cssVars } from './lib/theme';
import { businessDaysOfMonth, businessDaysInRange, monthLabel, monthRange, shiftMonthKey, monthKeyOf } from './lib/dates';
import { maskHora, compute, fmtMinutos } from './lib/time';
import { isLocked, periodoForRange } from './lib/periodos';
import { feriadoDoDia } from './lib/feriados';

import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Painel from './views/Painel';
import Registrar from './views/Registrar';
import Espelho from './views/Espelho';
import Configuracoes from './views/Configuracoes';

const today = new Date();
const TODAY_ISO = today.toISOString().slice(0, 10);

export default function App() {
  const [ready, setReady] = useState(false);
  const [config, setConfig] = useState(null);
  const [periodos, setPeriodos] = useState([]);
  const [feriados, setFeriados] = useState([]);
  const [view, setView] = useState('painel');
  const [monthKey, setMonthKey] = useState(monthKeyOf(today));
  const [selectedIso, setSelectedIso] = useState(TODAY_ISO);
  const [diasMap, setDiasMap] = useState({});

  // Carga inicial: configuração, períodos e feriados.
  useEffect(() => {
    (async () => {
      const [cfg, per, fer] = await Promise.all([api.getConfig(), api.listPeriodos(), api.listFeriados()]);
      setConfig(cfg);
      setPeriodos(per);
      setFeriados(fer);
      setReady(true);
    })();
  }, []);

  // Carrega lançamentos do mês exibido sempre que o mês mudar.
  const loadMonth = useCallback(async (key) => {
    const { start, end } = monthRange(key);
    const rows = await api.listDias(start, end);
    setDiasMap((prev) => {
      const next = { ...prev };
      rows.forEach((r) => { next[r.data] = r; });
      return next;
    });
  }, []);

  useEffect(() => { if (ready) loadMonth(monthKey); }, [ready, monthKey, loadMonth]);

  // Período que cobre o mês em exibição (por sobreposição de intervalo — o período
  // não precisa começar no dia 1º). O saldo do banco de horas acumula dentro dele.
  const periodoAtual = useMemo(() => {
    const { start, end } = monthRange(monthKey);
    return periodoForRange(periodos, start, end);
  }, [periodos, monthKey]);

  // Carrega todos os lançamentos do período ativo (pode abranger vários meses),
  // para o saldo do banco de horas acumular corretamente, zerando só noutro período.
  const loadRange = useCallback(async (start, end) => {
    const rows = await api.listDias(start, end);
    setDiasMap((prev) => {
      const next = { ...prev };
      rows.forEach((r) => { next[r.data] = r; });
      return next;
    });
  }, []);

  useEffect(() => {
    if (ready && periodoAtual) loadRange(periodoAtual.dataInicio, periodoAtual.dataFim);
  }, [ready, periodoAtual, loadRange]);

  // Tema: recalcula quando preferência do SO muda (modo "Sistema").
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (!config || config.tema !== 'sistema') return undefined;
    let mq;
    try {
      mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => forceTick((n) => n + 1);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } catch { return undefined; }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só recalcular quando o modo de tema mudar
  }, [config?.tema]);

  const th = useMemo(() => resolveTheme(config?.tema), [config?.tema]);

  if (!ready || !config) {
    return <div style={{ padding: 40, fontFamily: 'Lato, sans-serif', color: '#999' }}>Carregando…</div>;
  }

  const cargaPadrao = config.cargaPadrao || '08:00';
  const funcionario = config.funcionario || 'Colaborador';

  function rowFor(iso, day, label) {
    const stored = diasMap[iso];
    const feriado = feriadoDoDia(feriados, iso);
    return {
      iso, day, label,
      carga: feriado ? '0:00' : (stored?.carga ?? cargaPadrao),
      entrada: stored?.entrada ?? '',
      saidaAlmoco: stored?.saidaAlmoco ?? '',
      voltaAlmoco: stored?.voltaAlmoco ?? '',
      saida: stored?.saida ?? '',
      falta: !!stored?.falta,
      isFeriado: !!feriado,
      feriadoNome: feriado?.nome || ''
    };
  }

  const rawRows = businessDaysOfMonth(monthKey).map((d) => rowFor(d.iso, d.day, d.label));

  // Saldo do banco de horas: acumulado nos dias do período ativo (não só no mês em
  // exibição), zerando apenas quando o período em questão muda. Sem período cadastrado
  // cobrindo o mês, cai de volta ao saldo do próprio mês (comportamento anterior).
  const periodoRows = periodoAtual
    ? businessDaysInRange(periodoAtual.dataInicio, periodoAtual.dataFim).map((d) => rowFor(d.iso, d.day, d.label))
    : rawRows;
  const saldoPeriodo = periodoRows.reduce((acc, r) => {
    const c = compute(r, cargaPadrao);
    return acc + (c.have ? c.diff : 0);
  }, 0);
  const saldoPeriodoInfo = {
    saldo: saldoPeriodo,
    saldoTxt: (saldoPeriodo >= 0 ? '+' : '') + fmtMinutos(saldoPeriodo),
    saldoColor: saldoPeriodo > 0 ? th.credit : saldoPeriodo < 0 ? th.debit : th.muted,
    saldoNote: periodoAtual
      ? `acumulado em ${periodoAtual.nome || 'período'} (${periodoAtual.dataInicio.split('-').reverse().join('/')} – ${periodoAtual.dataFim.split('-').reverse().join('/')})`
      : (saldoPeriodo >= 0 ? 'horas a favor no mês' : 'horas devidas no mês')
  };

  async function updateDia(iso, field, val) {
    const current = diasMap[iso] || {
      carga: cargaPadrao, entrada: '', saidaAlmoco: '', voltaAlmoco: '', saida: '', falta: false
    };
    const next = { ...current, [field]: maskHora(val) };
    setDiasMap((prev) => ({ ...prev, [iso]: next }));
    await api.putDia(iso, next);
  }

  async function toggleFalta(iso) {
    const current = diasMap[iso] || {
      carga: cargaPadrao, entrada: '', saidaAlmoco: '', voltaAlmoco: '', saida: '', falta: false
    };
    const next = { ...current, falta: !current.falta };
    setDiasMap((prev) => ({ ...prev, [iso]: next }));
    await api.putDia(iso, next);
  }

  // Importação em massa (PDF do relógio de ponto): grava um dia por vez, pulando
  // os que estiverem num período encerrado. Marcações importadas removem "falta".
  async function importDias(porDia) {
    let importados = 0;
    let bloqueados = 0;
    for (const [iso, punches] of Object.entries(porDia)) {
      if (isLocked(periodos, iso)) { bloqueados++; continue; }
      const current = diasMap[iso] || {
        carga: cargaPadrao, entrada: '', saidaAlmoco: '', voltaAlmoco: '', saida: '', falta: false
      };
      const next = { ...current, ...punches, falta: false };
      // eslint-disable-next-line no-await-in-loop -- grava um dia por vez para não perder atualizações concorrentes
      await api.putDia(iso, next);
      setDiasMap((prev) => ({ ...prev, [iso]: next }));
      importados++;
    }
    return { importados, bloqueados };
  }

  async function saveConfig(patch) {
    const cfg = await api.putConfig(patch);
    setConfig(cfg);
  }

  async function clearMonth() {
    const { start, end } = monthRange(monthKey);
    await api.clearDias(start, end);
    setDiasMap((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((iso) => { if (iso >= start && iso <= end) delete next[iso]; });
      return next;
    });
  }

  function changeMonth(delta) {
    setMonthKey((k) => shiftMonthKey(k, delta));
  }

  function goToday() {
    setMonthKey(monthKeyOf(today));
    setSelectedIso(TODAY_ISO);
  }

  function changeDay(delta) {
    const idx = rawRows.findIndex((r) => r.iso === selectedIso);
    let next = (idx < 0 ? 0 : idx) + delta;
    if (next < 0) next = 0;
    if (next > rawRows.length - 1) next = rawRows.length - 1;
    if (rawRows[next]) setSelectedIso(rawRows[next].iso);
  }

  // Períodos CRUD
  async function createPeriodo(p) {
    const created = await api.createPeriodo(p);
    setPeriodos((prev) => [...prev, created]);
  }
  async function updatePeriodo(id, p) {
    const updated = await api.updatePeriodo(id, p);
    setPeriodos((prev) => prev.map((x) => (x.id === id ? updated : x)));
  }
  async function togglePeriodo(id) {
    const updated = await api.togglePeriodo(id);
    setPeriodos((prev) => prev.map((x) => (x.id === id ? updated : x)));
  }
  async function deletePeriodo(id) {
    await api.deletePeriodo(id);
    setPeriodos((prev) => prev.filter((x) => x.id !== id));
  }

  // Feriados CRUD
  async function createFeriado(f) {
    const created = await api.createFeriado(f);
    setFeriados((prev) => [...prev, created].sort((a, b) => (a.data > b.data ? 1 : -1)));
  }
  async function deleteFeriado(id) {
    await api.deleteFeriado(id);
    setFeriados((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <div
      style={{
        ...cssVars(th),
        display: 'flex', minHeight: '100vh', background: th.bg, color: th.text,
        fontFamily: "'Lato', system-ui, sans-serif"
      }}
    >
      <Sidebar th={th} view={view} setView={setView} funcionario={funcionario} cargaPadrao={cargaPadrao} />

      <main style={{ flex: 1, minWidth: 0, padding: '26px 34px 44px' }}>
        <TopBar
          th={th}
          view={view}
          monthLabel={monthLabel(monthKey)}
          onPrevMonth={() => changeMonth(-1)}
          onNextMonth={() => changeMonth(1)}
        />

        {view === 'painel' && (
          <Painel th={th} rows={rawRows} cargaPadrao={cargaPadrao} saldoPeriodo={saldoPeriodoInfo} />
        )}

        {view === 'registrar' && (
          <Registrar
            th={th}
            rows={rawRows}
            selectedIso={selectedIso}
            onPrevDay={() => changeDay(-1)}
            onNextDay={() => changeDay(1)}
            onToday={goToday}
            updateDia={updateDia}
            toggleFalta={toggleFalta}
            locked={isLocked(periodos, selectedIso)}
          />
        )}

        {view === 'espelho' && (
          <Espelho
            th={th}
            rows={rawRows}
            cargaPadrao={cargaPadrao}
            updateDia={updateDia}
            toggleFalta={toggleFalta}
            isLocked={(iso) => isLocked(periodos, iso)}
            anyLocked={rawRows.some((r) => isLocked(periodos, r.iso))}
            clearMonth={clearMonth}
            saldoPeriodo={saldoPeriodoInfo}
            importDias={importDias}
          />
        )}

        {view === 'config' && (
          <Configuracoes
            th={th}
            config={config}
            saveConfig={saveConfig}
            periodos={periodos}
            createPeriodo={createPeriodo}
            updatePeriodo={updatePeriodo}
            togglePeriodo={togglePeriodo}
            deletePeriodo={deletePeriodo}
            feriados={feriados}
            createFeriado={createFeriado}
            deleteFeriado={deleteFeriado}
          />
        )}
      </main>
    </div>
  );
}
