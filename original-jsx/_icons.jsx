// Minimal inline SVG icons (Lucide-inspired)
const Icon = ({ children, size = 18, stroke = "currentColor", strokeWidth = 1.5, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
       style={style}>
    {children}
  </svg>
);

const IcHome     = (p) => <Icon {...p}><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></Icon>;
const IcImport   = (p) => <Icon {...p}><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/></Icon>;
const IcList     = (p) => <Icon {...p}><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></Icon>;
const IcPie      = (p) => <Icon {...p}><path d="M12 3v9h9a9 9 0 1 1-9-9z"/></Icon>;
const IcChart    = (p) => <Icon {...p}><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></Icon>;
const IcTag      = (p) => <Icon {...p}><path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="7.5" r="1"/></Icon>;
const IcBell     = (p) => <Icon {...p}><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8z"/><path d="M10 21a2 2 0 0 0 4 0"/></Icon>;
const IcSearch   = (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></Icon>;
const IcArrowUp  = (p) => <Icon {...p}><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></Icon>;
const IcArrowDn  = (p) => <Icon {...p}><path d="M12 5v14"/><path d="M5 12l7 7 7-7"/></Icon>;
const IcArrowR   = (p) => <Icon {...p}><path d="M5 12h14"/><path d="M13 5l7 7-7 7"/></Icon>;
const IcChevDn   = (p) => <Icon {...p}><path d="M6 9l6 6 6-6"/></Icon>;
const IcSun      = (p) => <Icon {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></Icon>;
const IcMoon     = (p) => <Icon {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></Icon>;
const IcPlus     = (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>;
const IcFilter   = (p) => <Icon {...p}><path d="M3 5h18l-7 9v6l-4-2v-4z"/></Icon>;
const IcSettings = (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9 1.65 1.65 0 0 0 4.27 7.18l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.36.2.7.43 1 .69"/></Icon>;
const IcUpload   = (p) => <Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></Icon>;
const IcDot      = (p) => <Icon {...p}><circle cx="12" cy="12" r="2" fill="currentColor"/></Icon>;
const IcCalendar = (p) => <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></Icon>;
const IcWallet   = (p) => <Icon {...p}><path d="M3 7a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M16 12h4"/><circle cx="17" cy="12" r="1"/></Icon>;
const IcLock     = (p) => <Icon {...p}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 1 1 8 0v4"/></Icon>;

Object.assign(window, {
  Icon, IcHome, IcImport, IcList, IcPie, IcChart, IcTag, IcBell, IcSearch,
  IcArrowUp, IcArrowDn, IcArrowR, IcChevDn, IcSun, IcMoon, IcPlus, IcFilter,
  IcSettings, IcUpload, IcDot, IcCalendar, IcWallet, IcLock
});
