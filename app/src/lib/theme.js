// Paletas fiéis ao protótipo Claude Design (SiPlanControl.M — Bordô/Borgonha/Carmesim/Urucum).

export const THEMES = {
  classico: {
    bg: '#f2efef', panel: '#ffffff', border: '#e4dede', rowBorder: '#efeaea',
    text: '#2a2020', muted: '#999999', headerBg: '#7f0101', headerText: '#ffffff',
    headerBrand: '#7f0101', accent: '#ad0505', focus: '#fbeded', credit: '#2f7d5b',
    debit: '#d52d2d', stripe: '#faf6f6'
  },
  escuro: {
    bg: '#1a1414', panel: '#241c1c', border: '#3a2c2c', rowBorder: '#2e2323',
    text: '#f0e8e8', muted: '#a79999', headerBg: '#5a0000', headerText: '#ffffff',
    headerBrand: '#f0e8e8', accent: '#d52d2d', focus: '#3a2020', credit: '#4bbf85',
    debit: '#e0736b', stripe: '#201818'
  }
};

export function resolveTheme(modo) {
  let mode = modo || 'claro';
  if (mode === 'sistema') {
    let dark = false;
    try {
      dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {}
    mode = dark ? 'escuro' : 'claro';
  }
  const key = mode === 'escuro' ? 'escuro' : 'classico';
  return THEMES[key];
}

export function cssVars(th) {
  return {
    '--bg': th.bg, '--panel': th.panel, '--border': th.border, '--rowBorder': th.rowBorder,
    '--text': th.text, '--muted': th.muted, '--headerBg': th.headerBg, '--headerText': th.headerText,
    '--headerBrand': th.headerBrand, '--accent': th.accent, '--focus': th.focus,
    '--credit': th.credit, '--debit': th.debit, '--stripe': th.stripe
  };
}
