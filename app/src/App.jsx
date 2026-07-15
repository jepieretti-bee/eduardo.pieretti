import { useEffect, useMemo, useState, useCallback } from 'react';
import { api } from './lib/api';
import { resolveTheme, cssVars } from './lib/theme';
import { businessDaysOfMonth, businessDaysInRange, monthLabel, monthRange, shiftMonthKey, monthKeyOf } from './lib/dates';
import { maskHora, compute, fmtMinutos, parseHora } from './lib/time';
import { isLocked, foraDePeriodo } from './lib/periodos';
import { feriadoDoDia, fmtDataBR, fmtRangeBR } from './lib/feriados';

import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Painel from './views/Painel';
import Registrar from './views/Registrar';
import Espelho from './views/Espelho';
import Configuracoes from './views/Configuracoes';

const today = new Date();
const TODAY_ISO = today.toISOString().slice(0, 10);

function temDados(d) {
  return !!(d && (d.entrada || d.saidaAlmoco || d.voltaAlmoco || d.saida || d.falta));
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [config, setConfig] = useState(null);
  const [periodos, setPeriodos] = useState([]);
  const [feriados, setFeriados] = useState([]);
  const [view, setView] = useState('painel');
  const [monthKey, setMonthKey] = useState(monthKeyOf(today));
  const [selectedIso, setSelectedIso] = useState(TODAY_ISO);
  const [diasMap, setDiasMap] = useState({});
  const [periodoPainelId, setPeriodoPainelId] = useState(null);

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

  // Períodos ordenados por data de início — o Painel navega por essa lista (não por mês).
  const periodosOrdenados = useMemo(
    () => [...periodos].sort((a, b) => (a.dataInicio < b.dataInicio ? -1 : a.dataInicio > b.dataInicio ? 1 : 0)),
    [periodos]
  );

  // Índice do período selecionado no Painel: usa o escolhido via navegação, ou por
  // padrão o período que cobre hoje, ou o último cadastrado, ou nenhum (-1).
  const periodoPainelIndex = useMemo(() => {
    if (periodosOrdenados.length === 0) return -1;
    if (periodoPainelId != null) {
      const idx = periodosOrdenados.findIndex((p) => p.id === periodoPainelId);
      if (idx >= 0) return idx;
    }
    const idxHoje = periodosOrdenados.findIndex((p) => p.dataInicio <= TODAY_ISO && TODAY_ISO <= p.dataFim);
    return idxHoje >= 0 ? idxHoje : periodosOrdenados.length - 1;
  }, [periodosOrdenados, periodoPainelId]);

  // Carrega os lançamentos de um intervalo de datas (mescla no cache global).
  const loadRange = useCallback(async (start, end) => {
    const rows = await api.listDias(start, end);
    setDiasMap((prev) => {
      const next = { ...prev };
      rows.forEach((r) => { next[r.data] = r; });
      return next;
    });
  }, []);

  const periodoPainel = periodoPainelIndex >= 0 ? periodosOrdenados[periodoPainelIndex] : null;

  // Pré-carrega os lançamentos de TODOS os períodos cadastrados assim que a lista
  // muda — assim os totais do Painel já vêm completos ao navegar entre períodos,
  // sem uma janela em que o total apareça incompleto por ainda estar buscando.
  useEffect(() => {
    if (!ready) return;
    periodosOrdenados.forEach((p) => { loadRange(p.dataInicio, p.dataFim); });
  }, [ready, periodosOrdenados, loadRange]);

  // Dias com marcação (ou falta) que não pertencem a nenhum período cadastrado —
  // eles ficam de fora dos totais do Painel. Baseado só no que já está carregado em
  // diasMap (meses/períodos já visitados), não é uma varredura completa do histórico.
  const diasForaDePeriodo = useMemo(
    () => Object.entries(diasMap)
      .filter(([iso, d]) => temDados(d) && foraDePeriodo(periodos, iso))
      .map(([iso]) => iso)
      .sort(),
    [diasMap, periodos]
  );

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

  const funcionario = config.funcionario || 'Colaborador';

  // Jornada por intervalos: quando os 4 horários estão cadastrados, a carga padrão
  // passa a ser derivada deles ((saída almoço - entrada) + (saída - volta almoço)).
  const jE = parseHora(config.jornadaEntrada);
  const jSA = parseHora(config.jornadaSaidaAlmoco);
  const jVA = parseHora(config.jornadaVoltaAlmoco);
  const jS = parseHora(config.jornadaSaida);
  const jornadaCompleta = jE != null && jSA != null && jVA != null && jS != null;
  const cargaPadrao = jornadaCompleta ? fmtMinutos((jSA - jE) + (jS - jVA)) : (config.cargaPadrao || '08:00');

  const jornada = {
    entrada: config.jornadaEntrada,
    saidaAlmoco: config.jornadaSaidaAlmoco,
    voltaAlmoco: config.jornadaVoltaAlmoco,
    saida: config.jornadaSaida,
    tolerancia: Number.isFinite(config.tolerancia) ? config.tolerancia : 15,
    cargaPadrao
  };

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

  const { start: monthStart, end: monthEnd } = monthRange(monthKey);
  const diasForaDePeriodoMes = diasForaDePeriodo.filter((iso) => iso >= monthStart && iso <= monthEnd);

  // Painel: totais (trabalhadas/extras/atraso/saldo) acumulados em todos os dias do
  // período selecionado na navegação do Painel (pode abranger vários meses), zerando
  // só ao trocar de período. Sem nenhum período cadastrado, cai para o mês atual.
  const painelRows = periodoPainel
    ? businessDaysInRange(periodoPainel.dataInicio, periodoPainel.dataFim).map((d) => rowFor(d.iso, d.day, d.label))
    : rawRows;
  const painelTotais = painelRows.reduce((acc, r) => {
    const c = compute(r, jornada);
    if (c.have) {
      acc.sumWorked += c.worked;
      acc.sumCarga += c.carga ?? 0;
      acc.sumExtras += c.extra;
      acc.sumDebit += c.atraso;
      acc.saldo += c.diff;
      acc.daysDone++;
    }
    return acc;
  }, { sumWorked: 0, sumCarga: 0, sumExtras: 0, sumDebit: 0, saldo: 0, daysDone: 0 });

  const painelInfo = {
    ...painelTotais,
    escopoLabel: periodoPainel ? (periodoPainel.nome || 'Período') : null,
    saldoTxt: (painelTotais.saldo >= 0 ? '+' : '') + fmtMinutos(painelTotais.saldo),
    saldoColor: painelTotais.saldo > 0 ? th.credit : painelTotais.saldo < 0 ? th.debit : th.muted,
    saldoNote: periodoPainel
      ? `acumulado em ${periodoPainel.nome || 'período'} (${fmtDataBR(periodoPainel.dataInicio)} – ${fmtDataBR(periodoPainel.dataFim)})`
      : (painelTotais.saldo >= 0 ? 'horas a favor no mês' : 'horas devidas no mês')
  };

  function changePeriodoPainel(delta) {
    if (periodosOrdenados.length === 0) return;
    const next = Math.min(Math.max(periodoPainelIndex + delta, 0), periodosOrdenados.length - 1);
    setPeriodoPainelId(periodosOrdenados[next].id);
  }

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
          navCaption={view === 'painel' ? 'Período' : null}
          navLabel={
            view === 'painel'
              ? (periodoPainel ? fmtRangeBR(periodoPainel.dataInicio, periodoPainel.dataFim) : monthLabel(monthKey))
              : monthLabel(monthKey)
          }
          onPrev={view === 'painel' ? () => changePeriodoPainel(-1) : () => changeMonth(-1)}
          onNext={view === 'painel' ? () => changePeriodoPainel(1) : () => changeMonth(1)}
          prevDisabled={view === 'painel' && (periodosOrdenados.length === 0 || periodoPainelIndex <= 0)}
          nextDisabled={view === 'painel' && (periodosOrdenados.length === 0 || periodoPainelIndex >= periodosOrdenados.length - 1)}
        />

        {view === 'painel' && (
          <Painel th={th} rows={painelRows} cargaPadrao={cargaPadrao} jornada={jornada} saldoPeriodo={painelInfo} diasForaDePeriodo={diasForaDePeriodo} />
        )}

        {view === 'registrar' && (
          <Registrar
            th={th}
            rows={rawRows}
            jornada={jornada}
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
            jornada={jornada}
            updateDia={updateDia}
            toggleFalta={toggleFalta}
            isLocked={(iso) => isLocked(periodos, iso)}
            anyLocked={rawRows.some((r) => isLocked(periodos, r.iso))}
            clearMonth={clearMonth}
            importDias={importDias}
            diasForaDePeriodo={diasForaDePeriodoMes}
            foraDePeriodoFn={(iso) => foraDePeriodo(periodos, iso)}
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
