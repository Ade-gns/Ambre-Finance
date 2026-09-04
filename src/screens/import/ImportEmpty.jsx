import { useRef, useState } from "react";
import { IcCalendar, IcSearch, IcUpload, IcLock, IcPlus } from "../../lib/icons";

/* ─────────────────────────────────────────────────────────────────
   1. État vide — drop zone + historique + sources reconnues
   ───────────────────────────────────────────────────────────────── */
export default function ImportEmpty({ onFile, importHistory = [] }) {
  const fileRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [histOpen, setHistOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [histFilter, setHistFilter] = useState("all"); // "all" | "pdf" | "csv"
  const [addSourceOpen, setAddSourceOpen] = useState(false);
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceFmt, setNewSourceFmt] = useState("CSV");
  const [userSources, setUserSources] = useState([]);

  const sources = [
    { name: "BNP Paribas",            fmt: "PDF, CSV", last: "Avril 2026", status: "ok" },
    { name: "La Banque Postale",      fmt: "PDF, CSV", last: "Mars 2026",  status: "ok" },
    { name: "Crédit Agricole",        fmt: "PDF, CSV", last: "Jamais",     status: "new" },
    { name: "Boursorama",             fmt: "CSV",      last: "Jamais",     status: "new" },
    { name: "Revolut",                fmt: "CSV",      last: "Jamais",     status: "new" },
    { name: "Autre — CSV générique",  fmt: "CSV",      last: null,         status: "generic" },
  ];

  const allSources = [...sources, ...userSources].filter(s =>
    !searchQ || s.name.toLowerCase().includes(searchQ.toLowerCase())
  );

  const filteredHistory = importHistory.filter(h => {
    if (histFilter === "all") return true;
    return h.file.toLowerCase().endsWith("." + histFilter);
  });

  const onDrop = e => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  return (
    <main className="ie-main">
      <style>{`
        .ie-main { padding: 22px 28px; display: flex; flex-direction: column;
                   gap: 16px; height: 100%; overflow: auto;
                   background: var(--page-bg); color: var(--ink-800); font-size: 13px; }
        .ie-top { display: flex; align-items: flex-end; justify-content: space-between; }
        .ie-bread { font-size: 11px; color: var(--ink-500); letter-spacing: 0.06em; text-transform: uppercase; }
        .ie-bread strong { color: var(--ink-800); font-weight: 500; letter-spacing: 0; text-transform: none; }
        .ie-h1 { font-family: var(--font-display); font-size: 28px; font-weight: 400;
                 margin: 4px 0 0; color: var(--ink-900); letter-spacing: -0.01em; }
        .ie-h1 em { font-style: italic; color: var(--amber-500); }
        .ie-tool { display: flex; gap: 8px; align-items: center; }
        .ie-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px;
                  border: 1px solid var(--line); border-radius: 8px;
                  background: var(--cream-50); color: var(--ink-700); font-size: 12px;
                  cursor: pointer; }
        .ie-btn.amber { background: var(--amber-500); color: var(--cream-50);
                        border-color: var(--amber-500); font-weight: 500; }

        .ie-drop { background: var(--cream-50);
                   border: 1.5px dashed rgba(184,105,61,0.45);
                   border-radius: 14px; padding: 40px 28px;
                   display: flex; flex-direction: column; align-items: center; gap: 14px;
                   position: relative; overflow: hidden; transition: background 0.15s, border-color 0.15s; }
        .ie-drop.over { background: var(--amber-100); border-color: var(--amber-500); border-style: solid; }
        .ie-drop::before { content: ""; position: absolute; inset: 0;
                           background-image: repeating-linear-gradient(45deg, transparent 0 14px, rgba(184,105,61,0.025) 14px 16px);
                           pointer-events: none; }
        .ie-drop > * { position: relative; z-index: 1; }
        .ie-drop-ico { width: 60px; height: 60px; border-radius: 16px;
                       background: var(--amber-100); color: var(--amber-500);
                       display: flex; align-items: center; justify-content: center; }
        .ie-drop-t { font-family: var(--font-display); font-size: 26px;
                     color: var(--ink-900); letter-spacing: -0.01em; }
        .ie-drop-s { font-size: 13px; color: var(--ink-600); text-align: center; max-width: 480px; }
        .ie-drop-actions { display: flex; gap: 10px; align-items: center; margin-top: 4px; }
        .ie-drop-formats { display: flex; gap: 8px; margin-top: 6px; }
        .ie-fmt-chip { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px;
                       border-radius: 999px; background: var(--cream-200);
                       font-size: 11px; color: var(--ink-700); font-family: var(--font-mono); }
        /* Format annoncé mais pas encore lisible : signalé comme tel plutôt que
           présenté au même niveau que les formats réellement pris en charge. */
        .ie-fmt-chip.soon { background: transparent; border: 1px dashed var(--line-strong);
                            color: var(--ink-500); }
        .ie-fmt-chip.soon .ie-fmt-soon { font-family: var(--font-sans); font-size: 9.5px;
                                         text-transform: uppercase; letter-spacing: 0.06em; }
        .ie-trust { display: flex; align-items: center; gap: 6px; font-size: 11px;
                    color: var(--sage-500);
                    padding-top: 6px; border-top: 1px dashed var(--line); }

        .ie-cols { display: grid; grid-template-columns: 1fr 1.05fr; gap: 14px;
                   flex: 1; min-height: 0; }
        .ie-card { background: var(--cream-50); border: 1px solid var(--line);
                   border-radius: 14px; padding: 18px 20px;
                   display: flex; flex-direction: column; gap: 12px; min-height: 0; }
        .ie-card-h { display: flex; align-items: flex-start; justify-content: space-between; }
        .ie-card-t { font-size: 13px; color: var(--ink-800); font-weight: 500; }
        .ie-card-s { font-size: 11px; color: var(--ink-500); margin-top: 2px; }

        .ie-src-list { display: flex; flex-direction: column; }
        .ie-src-row { display: grid; grid-template-columns: 28px 1fr auto auto;
                      align-items: center; gap: 10px;
                      padding: 10px 0; border-bottom: 1px dashed var(--line); }
        .ie-src-row:last-child { border-bottom: none; }
        .ie-src-mark { width: 28px; height: 28px; border-radius: 7px;
                       background: var(--cream-200);
                       display: flex; align-items: center; justify-content: center;
                       font-family: var(--font-display); font-style: italic;
                       font-size: 15px; color: var(--ink-700); }
        .ie-src-name { font-size: 13px; color: var(--ink-800); }
        .ie-src-meta { font-size: 11px; color: var(--ink-500); margin-top: 2px;
                       font-family: var(--font-mono); }
        .ie-src-last { font-size: 11px; color: var(--ink-500); }
        .ie-src-status { font-size: 10px; padding: 2px 8px; border-radius: 999px;
                         border: 1px solid var(--line); color: var(--ink-600); }
        .ie-src-status.ok { background: rgba(107,122,79,0.10); border-color: rgba(107,122,79,0.35); color: var(--sage-500); }
        .ie-src-status.new { background: var(--amber-100); border-color: rgba(184,105,61,0.35); color: var(--amber-500); }

        .ie-hist-row { display: grid; grid-template-columns: 32px 1fr auto auto; gap: 12px;
                       align-items: center; padding: 12px 0;
                       border-bottom: 1px dashed var(--line); }
        .ie-hist-row:last-child { border-bottom: none; }
        .ie-hist-ico { width: 32px; height: 32px; border-radius: 8px; background: var(--cream-200);
                       display: flex; align-items: center; justify-content: center; color: var(--ink-600); }
        .ie-hist-file { font-size: 12.5px; color: var(--ink-800); font-family: var(--font-mono); }
        .ie-hist-meta { font-size: 11px; color: var(--ink-500); margin-top: 2px; }
        .ie-hist-tx { display: inline-flex; align-items: center; gap: 4px;
                      padding: 3px 8px; border-radius: 999px;
                      background: var(--amber-100); color: var(--amber-500);
                      font-size: 11px; font-weight: 500; }
        .ie-hist-act { display: flex; gap: 6px; }
        .ie-hist-act > button { width: 26px; height: 26px; padding: 0; }

        @media (max-width: 768px) {
          .ie-main { padding: 14px 12px; }
          .ie-top { flex-direction: column; align-items: flex-start; gap: 8px; }
          .ie-tool { flex-wrap: wrap; }
          .ie-cols { grid-template-columns: 1fr; flex: none; min-height: 0; }
          .ie-card { min-height: 200px; }
        }
      `}</style>

      {/* Input fichier caché — déclenché par le bouton */}
      <input ref={fileRef} type="file" accept=".csv,.pdf,.txt"
             style={{ display: "none" }}
             onChange={e => { const f = e.target.files[0]; if (f) onFile(f); e.target.value = ""; }} />

      <div className="ie-top">
        <div>
          <div className="ie-bread">Ambre · <strong>Importer un relevé</strong></div>
          <h1 className="ie-h1">Ajouter un <em>relevé</em>.</h1>
        </div>
        <div className="ie-tool">
          {searchOpen && (
            <input
              autoFocus
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Rechercher une source…"
              style={{
                padding: "6px 10px", borderRadius: 8, border: "1px solid var(--line)",
                background: "var(--cream-50)", fontSize: 12, color: "var(--ink-800)",
                outline: "none", width: 200,
              }}
            />
          )}
          <button className="ie-btn" onClick={() => setHistOpen(true)}>
            <IcCalendar size={14}/>Historique complet
          </button>
          <button className="ie-btn" onClick={() => { setSearchOpen(o => !o); if (searchOpen) setSearchQ(""); }}>
            <IcSearch size={14}/>
          </button>
        </div>
      </div>

      {/* DROP ZONE */}
      <div className={"ie-drop" + (dragging ? " over" : "")}
           onDragOver={e => { e.preventDefault(); setDragging(true); }}
           onDragEnter={e => { e.preventDefault(); setDragging(true); }}
           onDragLeave={() => setDragging(false)}
           onDrop={onDrop}>
        <div className="ie-drop-ico">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6"
               strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 4h10l5 5v18a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/>
            <path d="M19 4v5h5"/>
            <path d="M16 22V14"/>
            <path d="M12 18l4-4 4 4"/>
          </svg>
        </div>
        <div className="ie-drop-t">
          {dragging ? "Déposez le fichier ici" : "Glissez un relevé ici"}
        </div>
        <div className="ie-drop-s">
          Ambre lit les relevés PDF de la plupart des banques françaises et les fichiers CSV
          génériques. Les transactions sont extraites et pré-classées automatiquement.
        </div>
        <div className="ie-drop-actions">
          <button className="ie-btn amber" style={{ padding: "9px 16px", fontSize: 13 }}
                  onClick={() => fileRef.current?.click()}>
            <IcUpload size={14}/>Parcourir mes fichiers
          </button>
          <span style={{ fontSize: 12, color: "var(--ink-500)" }}>ou faites glisser le fichier</span>
        </div>
        <div className="ie-drop-formats">
          <span className="ie-fmt-chip">.pdf</span>
          <span className="ie-fmt-chip">.csv</span>
          <span className="ie-fmt-chip soon" title="Lecture des fichiers OFX pas encore disponible — exportez un CSV ou un PDF en attendant">
            .ofx <span className="ie-fmt-soon">bientôt</span>
          </span>
          <span className="ie-fmt-chip soon" title="Lecture des fichiers QIF pas encore disponible — exportez un CSV ou un PDF en attendant">
            .qif <span className="ie-fmt-soon">bientôt</span>
          </span>
        </div>
        <div className="ie-trust">
          <IcLock size={11}/>
          Lecture 100 % locale · aucun fichier n'est transmis ni stocké en ligne
        </div>
      </div>

      {/* TWO COLUMNS */}
      <div className="ie-cols">
        {/* SOURCES */}
        <div className="ie-card">
          <div className="ie-card-h">
            <div>
              <div className="ie-card-t">Sources reconnues</div>
              {/* Le compteur porte sur les sources listées ci-dessous, pas sur
                  des formats de fichier — l'ancien libellé « 6 formats pris en
                  charge » laissait croire à 6 formats lisibles. */}
              <div className="ie-card-s">
                {allSources.length} source{allSources.length > 1 ? "s" : ""} · ajoutez les vôtres dans Paramètres
              </div>
            </div>
            <button className="ie-btn" style={{ padding: "4px 10px", fontSize: 11 }}
                    onClick={() => setAddSourceOpen(true)}>
              <IcPlus size={11}/>Ajouter
            </button>
          </div>
          <div className="ie-src-list">
            {allSources.map(s => (
              <div key={s.name} className="ie-src-row">
                <div className="ie-src-mark">{s.name[0].toLowerCase()}</div>
                <div>
                  <div className="ie-src-name">{s.name}</div>
                  <div className="ie-src-meta">{s.fmt}</div>
                </div>
                <div className="ie-src-last">{s.last || "—"}</div>
                <div className={"ie-src-status " + s.status}>
                  {s.status === "ok" ? "Configurée" : s.status === "new" ? "À configurer" : "Manuel"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* HISTORY */}
        <div className="ie-card" style={{ overflow: "hidden" }}>
          <div className="ie-card-h">
            <div>
              <div className="ie-card-t">Imports récents</div>
              <div className="ie-card-s">
                {importHistory.length > 0
                  ? `${importHistory.length} fichier${importHistory.length > 1 ? "s" : ""} · ${importHistory.reduce((s, h) => s + (h.tx || 0), 0)} transactions importées`
                  : "Aucun import pour l'instant"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {[["all","Tous"],["pdf","PDF"],["csv","CSV"]].map(([k,label]) => (
                <button key={k} className="ie-btn" style={{ padding: "4px 10px", fontSize: 11,
                  ...(histFilter === k ? { background: "var(--amber-100)", color: "var(--amber-500)", borderColor: "rgba(184,105,61,0.3)" } : {})
                }} onClick={() => setHistFilter(k)}>{label}</button>
              ))}
            </div>
          </div>
          <div style={{ overflow: "hidden" }}>
            {filteredHistory.length === 0 ? (
              <div style={{ padding: "24px 20px", textAlign: "center", color: "var(--ink-500)", fontSize: 12 }}>
                Aucun import enregistré.
              </div>
            ) : filteredHistory.map((h, idx) => (
              <div key={idx} className="ie-hist-row">
                <div className="ie-hist-ico">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <path d="M14 2v6h6"/>
                  </svg>
                </div>
                <div>
                  <div className="ie-hist-file">{h.file}</div>
                  <div className="ie-hist-meta">{h.date} · {h.period} · {h.size}</div>
                </div>
                <span className="ie-hist-tx">{h.tx} tx</span>
                <div className="ie-hist-act">
                  <button className="ie-btn" title="Revoir"><IcSearch size={12}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {addSourceOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "var(--overlay-scrim)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => setAddSourceOpen(false)}>
          <div className="ambre-modal-box" style={{
            background: "var(--cream-50)", borderRadius: 16,
            padding: "28px 32px", width: 420,
            boxShadow: "0 24px 60px var(--shadow-modal)",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontFamily: "var(--font-display)", color: "var(--ink-900)" }}>
                Ajouter une source
              </div>
              <button onClick={() => setAddSourceOpen(false)} style={{
                width: 28, height: 28, border: "1px solid var(--line)", borderRadius: 7,
                background: "var(--cream-100)", cursor: "pointer", fontSize: 18, display: "flex",
                alignItems: "center", justifyContent: "center", color: "var(--ink-600)",
              }}>×</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: "var(--ink-500)", display: "block", marginBottom: 6 }}>Nom de la banque</label>
                <input value={newSourceName} onChange={e => setNewSourceName(e.target.value)}
                       placeholder="ex. Fortuneo, Hello bank…"
                       style={{ width: "100%", padding: "8px 10px", borderRadius: 8, fontSize: 13,
                                border: "1px solid var(--line)", background: "var(--cream-100)",
                                color: "var(--ink-800)", boxSizing: "border-box", outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "var(--ink-500)", display: "block", marginBottom: 6 }}>Format</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {["CSV","PDF"].map(f => (
                    <button key={f} onClick={() => setNewSourceFmt(f)} style={{
                      padding: "6px 14px", borderRadius: 7, fontSize: 12, cursor: "pointer",
                      border: "1px solid var(--line)",
                      background: newSourceFmt === f ? "var(--amber-100)" : "var(--cream-50)",
                      color: newSourceFmt === f ? "var(--amber-500)" : "var(--ink-700)",
                      borderColor: newSourceFmt === f ? "rgba(184,105,61,0.3)" : "var(--line)",
                    }}>{f}</button>
                  ))}
                </div>
              </div>
              <button onClick={() => {
                if (!newSourceName.trim()) return;
                setUserSources(prev => [...prev, { name: newSourceName.trim(), fmt: newSourceFmt, last: null, status: "new" }]);
                setNewSourceName("");
                setNewSourceFmt("CSV");
                setAddSourceOpen(false);
              }} style={{
                marginTop: 6, padding: "9px 0", borderRadius: 9, fontSize: 13, fontWeight: 500,
                background: "var(--amber-500)", color: "var(--cream-50)", border: "none", cursor: "pointer",
              }}>Ajouter la source</button>
            </div>
          </div>
        </div>
      )}

      {histOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "var(--overlay-scrim)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => setHistOpen(false)}>
          <div className="ambre-modal-box" style={{
            background: "var(--cream-50)", borderRadius: 16,
            padding: "28px 32px", width: 560,
            boxShadow: "0 24px 60px var(--shadow-modal)",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontFamily: "var(--font-display)", color: "var(--ink-900)" }}>
                  Historique des imports
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 3 }}>
                  {importHistory.length} fichier{importHistory.length > 1 ? "s" : ""} importé{importHistory.length > 1 ? "s" : ""}
                </div>
              </div>
              <button onClick={() => setHistOpen(false)} style={{
                width: 28, height: 28, border: "1px solid var(--line)", borderRadius: 7,
                background: "var(--cream-100)", cursor: "pointer", fontSize: 18, display: "flex",
                alignItems: "center", justifyContent: "center", color: "var(--ink-600)",
              }}>×</button>
            </div>
            <div style={{ borderTop: "1px solid var(--line)" }}>
              {importHistory.length === 0 ? (
                <div style={{ padding: "24px 0", textAlign: "center", color: "var(--ink-500)", fontSize: 12 }}>
                  Aucun import enregistré.
                </div>
              ) : importHistory.map((h, idx) => (
                <div key={idx} style={{
                  display: "grid", gridTemplateColumns: "1fr auto",
                  alignItems: "center", gap: 12,
                  padding: "12px 0", borderBottom: "1px dashed var(--line)",
                }}>
                  <div>
                    <div style={{ fontSize: 13, color: "var(--ink-800)", fontWeight: 500 }}>{h.file}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-500)", marginTop: 2, fontFamily: "var(--font-mono)" }}>
                      {h.date} · {h.tx} transactions · {h.size}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

