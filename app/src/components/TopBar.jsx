const TITLES = {
  painel: ['Visão geral', 'Painel'],
  registrar: ['Marcação', 'Registrar Ponto'],
  espelho: ['Folha de ponto', 'Espelho do Mês'],
  config: ['Ajustes', 'Configurações']
};

export default function TopBar({ th, view, monthLabel, onPrevMonth, onNextMonth }) {
  const [kicker, title] = TITLES[view];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 24 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: th.muted }}>{kicker}</div>
        <h1 style={{ margin: '2px 0 0', fontFamily: "'Oswald',sans-serif", fontSize: 30, fontWeight: 600, letterSpacing: '.3px', textTransform: 'uppercase', color: th.text }}>
          {title}
        </h1>
      </div>
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 6, background: th.panel, border: `1px solid ${th.border}`, borderRadius: 11, padding: 5 }}>
        <button onClick={onPrevMonth} style={navBtnStyle(th)}>‹</button>
        <div style={{ minWidth: 158, textAlign: 'center', fontWeight: 700, fontSize: 14.5, textTransform: 'capitalize', fontFamily: "'Oswald',sans-serif", letterSpacing: '.5px' }}>
          {monthLabel}
        </div>
        <button onClick={onNextMonth} style={navBtnStyle(th)}>›</button>
      </div>
    </div>
  );
}

function navBtnStyle(th) {
  return {
    cursor: 'pointer', border: 'none', background: 'transparent', color: th.text,
    width: 36, height: 36, borderRadius: 8, fontSize: 19, lineHeight: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  };
}
