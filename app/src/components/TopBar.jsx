const TITLES = {
  painel: ['Visão geral', 'Painel'],
  registrar: ['Marcação', 'Registrar Ponto'],
  espelho: ['Folha de ponto', 'Espelho do Mês'],
  config: ['Ajustes', 'Configurações']
};

export default function TopBar({ th, view, navCaption, navLabel, onPrev, onNext, prevDisabled, nextDisabled }) {
  const [kicker, title] = TITLES[view];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 24 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: th.muted }}>{kicker}</div>
        <h1 style={{ margin: '2px 0 0', fontFamily: "'Oswald',sans-serif", fontSize: 30, fontWeight: 600, letterSpacing: '.3px', textTransform: 'uppercase', color: th.text }}>
          {title}
        </h1>
      </div>
      <div className="no-print" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        {navCaption && (
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: th.muted, paddingRight: 4 }}>
            {navCaption}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: th.panel, border: `1px solid ${th.border}`, borderRadius: 11, padding: 5 }}>
          <button onClick={onPrev} disabled={prevDisabled} style={navBtnStyle(th, prevDisabled)}>‹</button>
          <div style={{ minWidth: 158, textAlign: 'center', fontWeight: 700, fontSize: 14.5, fontFamily: "'Oswald',sans-serif", letterSpacing: '.5px', whiteSpace: 'nowrap' }}>
            {navLabel}
          </div>
          <button onClick={onNext} disabled={nextDisabled} style={navBtnStyle(th, nextDisabled)}>›</button>
        </div>
      </div>
    </div>
  );
}

function navBtnStyle(th, disabled) {
  return {
    cursor: disabled ? 'not-allowed' : 'pointer', border: 'none', background: 'transparent',
    color: disabled ? th.border : th.text, opacity: disabled ? 0.6 : 1,
    width: 36, height: 36, borderRadius: 8, fontSize: 19, lineHeight: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  };
}
