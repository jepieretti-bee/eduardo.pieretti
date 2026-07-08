import { IconPainel, IconRegistrar, IconEspelho, IconConfig } from './Icons';

const NAV = [
  { id: 'painel', label: 'Painel', Icon: IconPainel },
  { id: 'registrar', label: 'Registrar Ponto', Icon: IconRegistrar },
  { id: 'espelho', label: 'Espelho do Mês', Icon: IconEspelho },
  { id: 'config', label: 'Configurações', Icon: IconConfig }
];

export default function Sidebar({ th, view, setView, funcionario, cargaPadrao }) {
  return (
    <aside
      className="no-print"
      style={{
        width: 248, flex: 'none', background: th.panel, borderRight: `1px solid ${th.border}`,
        display: 'flex', flexDirection: 'column', padding: '24px 18px', position: 'sticky', top: 0, height: '100vh'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11, padding: '0 6px 22px' }}>
        <div style={{ background: '#fff', border: `1px solid ${th.border}`, borderRadius: 9, padding: '9px 13px', display: 'inline-flex', alignItems: 'center', alignSelf: 'flex-start' }}>
          <img src="/siplan.png" alt="Siplan" style={{ height: 27, width: 'auto', display: 'block' }} />
        </div>
        <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 14, fontWeight: 600, letterSpacing: 1.2, lineHeight: 1.05, textTransform: 'uppercase', color: th.headerBrand }}>
          Controle de Ponto
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
        {NAV.map((item) => {
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              style={{
                background: active ? th.accent : 'transparent', color: active ? '#fff' : th.text,
                display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', border: 'none',
                cursor: 'pointer', padding: '11px 13px', borderRadius: 9, fontFamily: 'Lato', fontSize: 14,
                fontWeight: 700, transition: 'background .12s'
              }}
            >
              <span style={{ width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <item.Icon />
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', padding: '14px 13px', borderRadius: 11, background: th.stripe, border: `1px solid ${th.border}` }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: th.muted, marginBottom: 3 }}>
          Colaborador
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.25 }}>{funcionario}</div>
        <div style={{ marginTop: 9, display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: th.muted }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: th.credit, display: 'inline-block' }} />
          Jornada {cargaPadrao}/dia
        </div>
      </div>
    </aside>
  );
}
