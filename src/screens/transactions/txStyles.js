/* ─────────────────────────────────────────────────────────────────
   Styles partagés (en variable string pour injection unique)
   ───────────────────────────────────────────────────────────────── */
export const TX_STYLES = `
  .tx-main { padding: 22px 28px; display: flex; flex-direction: column; gap: 12px;
             height: 100%; overflow: hidden;
             background: var(--page-bg); color: var(--ink-800); font-size: 13px; }
  .tx-main.with-panel { padding-right: 0; }
  .tx-top { display: flex; align-items: flex-end; justify-content: space-between; }
  .tx-bread { font-size: 11px; color: var(--ink-500); letter-spacing: 0.06em; text-transform: uppercase; }
  .tx-bread strong { color: var(--ink-800); font-weight: 500; letter-spacing: 0; text-transform: none; }
  .tx-h1 { font-family: var(--font-display); font-size: 28px; font-weight: 400; margin: 4px 0 0;
           color: var(--ink-900); letter-spacing: -0.01em; }
  .tx-h1 em { font-style: italic; color: var(--amber-500); }
  .tx-h1-actions { display: flex; gap: 8px; align-items: center; }

  .tx-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px;
            border: 1px solid var(--line); border-radius: 8px; background: var(--cream-50);
            color: var(--ink-700); font-size: 12px; cursor: pointer; }
  .tx-btn.amber { background: var(--amber-500); color: var(--cream-50);
                  border-color: var(--amber-500); font-weight: 500; }
  .tx-btn.ghost { background: transparent; border-color: transparent; color: var(--ink-600); }
  .tx-btn[disabled] { opacity: 0.5; cursor: not-allowed; }
  .tx-badge { background: var(--amber-500); color: var(--cream-50); font-size: 10px;
              padding: 1px 6px; border-radius: 999px; }

  .tx-toolbar { display: flex; align-items: center; gap: 8px; }
  .tx-segmented { display: flex; padding: 3px; background: var(--cream-50);
                  border: 1px solid var(--line); border-radius: 9px; gap: 2px; }
  .tx-seg { padding: 5px 11px; border-radius: 6px; font-size: 12px; color: var(--ink-600);
            background: transparent; border: none; cursor: pointer;
            display: inline-flex; align-items: center; gap: 6px; }
  .tx-seg.active { background: var(--cream-200); color: var(--ink-800); font-weight: 500; }
  .tx-seg .num { font-family: var(--font-mono); font-size: 10px; color: var(--ink-500); }
  .tx-seg.active .num { color: var(--amber-500); }

  .tx-search { display: flex; align-items: center; gap: 8px; background: var(--cream-50);
               border: 1px solid var(--line); border-radius: 8px; padding: 6px 10px; min-width: 280px; }
  .tx-search input { border: none; outline: none; background: transparent; flex: 1;
                     font-family: inherit; font-size: 12px; color: var(--ink-800); }
  .tx-search input::placeholder { color: var(--ink-500); }
  .tx-search-kbd { font-family: var(--font-mono); font-size: 10px; color: var(--ink-500);
                   border: 1px solid var(--line); padding: 1px 5px; border-radius: 4px; }

  .tx-chips { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .tx-chip-lbl { font-size: 10px; color: var(--ink-500); letter-spacing: 0.08em;
                 text-transform: uppercase; margin-right: 4px; }
  .tx-chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px 4px 10px;
             border: 1px solid var(--line-strong); border-radius: 999px; font-size: 11px;
             background: var(--cream-50); color: var(--ink-700); }
  .tx-chip.clear { color: var(--rose-500); border-color: transparent;
                   background: transparent; cursor: pointer; }

  .tx-summary { display: flex; align-items: center; gap: 18px; padding: 10px 16px;
                background: var(--cream-50); border: 1px solid var(--line); border-radius: 10px;
                font-size: 12px; color: var(--ink-600); }
  .tx-summary strong { color: var(--ink-800); font-weight: 500; }

  .tx-table { background: var(--cream-50); border: 1px solid var(--line); border-radius: 12px;
              flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }
  .tx-tbody { flex: 1; overflow: auto; }
  .tx-thead, .tx-row { display: grid;
                       grid-template-columns: 24px 70px 1.6fr 60px 150px 90px 110px 24px;
                       align-items: center; gap: 14px; padding: 8px 18px; }
  .tx-thead { background: var(--cream-100); border-bottom: 1px solid var(--line);
              font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
              color: var(--ink-500); position: sticky; top: 0; z-index: 1; }
  .tx-thead .sort { display: inline-flex; align-items: center; gap: 4px; color: var(--amber-500); }
  .tx-thead .th-sort { cursor: pointer; user-select: none; transition: color 0.1s; }
  .tx-thead .th-sort:hover { color: var(--ink-900); }
  .tx-thead .th-sort.active { color: var(--amber-500); }

  .tx-group-h { padding: 10px 18px 6px; font-size: 10px; letter-spacing: 0.1em;
                text-transform: uppercase; color: var(--ink-500);
                background: var(--cream-50); border-bottom: 1px dashed var(--line);
                display: flex; align-items: center; gap: 10px; }
  .tx-group-h .sum { margin-left: auto; font-family: var(--font-mono);
                     color: var(--ink-700); text-transform: none; letter-spacing: 0; }

  .tx-row { padding: 10px 18px; border-bottom: 1px dashed var(--line);
            position: relative; cursor: pointer; }
  .tx-row.dense { padding: 8px 18px; }
  .tx-row:hover { background: var(--cream-100); }
  .tx-row.selected { background: var(--amber-100); }
  .tx-row.selected::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0;
                              width: 2px; background: var(--amber-500); }
  .tx-row.bulk { background: var(--amber-100); }
  .tx-row.bulk:hover { background: var(--amber-100); }
  .tx-row.bulk::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0;
                          width: 2px; background: var(--amber-500); }
  .tx-row.bulk .tx-cb { background: var(--amber-500); border-color: var(--amber-500);
                         position: relative; }
  .tx-row.bulk .tx-cb::after { content: ""; position: absolute; left: 3px; top: 1px;
                                width: 4px; height: 7px;
                                border: solid var(--cream-50); border-width: 0 1.5px 1.5px 0;
                                transform: rotate(45deg); }

  .tx-cb { width: 14px; height: 14px; border: 1.5px solid var(--line-strong); border-radius: 3.5px;
           cursor: pointer; flex-shrink: 0; }

  .tx-date { display: flex; flex-direction: column; line-height: 1.1; }
  .tx-date .dow { font-size: 9px; letter-spacing: 0.06em; text-transform: uppercase;
                  color: var(--ink-500); font-family: var(--font-mono); }
  .tx-date .num { font-family: var(--font-mono); font-size: 13px;
                  color: var(--ink-800); font-weight: 500; }

  .tx-label-cell .lbl { font-size: 13px; color: var(--ink-800); font-weight: 500; }
  .tx-label-cell .sub { font-size: 11px; color: var(--ink-500); margin-top: 2px;
                        display: flex; align-items: center; gap: 6px; }
  .tx-tag { font-family: var(--font-mono); font-size: 9px; color: var(--amber-500);
            background: var(--amber-100); padding: 1px 6px; border-radius: 999px; }

  .tx-acc { font-family: var(--font-mono); font-size: 11px; color: var(--ink-500);
            background: var(--cream-200); padding: 2px 6px; border-radius: 4px; justify-self: start; }

  .tx-cat-chip { display: inline-flex; align-items: center; gap: 6px; padding: 3px 9px;
                 border: 1px solid; border-radius: 999px;
                 font-size: 11px; background: var(--cream-50); }

  .tx-mode { font-size: 11px; color: var(--ink-500); font-family: var(--font-mono); }
  .tx-amt { font-family: var(--font-mono); font-size: 13.5px; text-align: right;
            color: var(--ink-800); font-weight: 500; }
  .tx-amt.pos { color: var(--sage-500); }

  .tx-menu { width: 24px; height: 24px; padding: 0; border: none; background: transparent;
             color: var(--ink-500); border-radius: 6px; cursor: pointer; }
  .tx-menu.active,
  .tx-menu:hover { background: var(--cream-200); color: var(--ink-800); }

  .tx-ctx-menu { position: absolute; right: 0; top: calc(100% + 4px); z-index: 60;
                 background: var(--cream-50); border: 1px solid var(--line);
                 border-radius: 10px; padding: 5px;
                 box-shadow: 0 8px 28px var(--shadow-modal); min-width: 200px; }
  .tx-ctx-item { display: flex; align-items: center; gap: 9px; width: 100%;
                 padding: 8px 10px; border-radius: 6px; border: none;
                 background: transparent; color: var(--ink-700);
                 font-size: 12.5px; cursor: pointer; text-align: left; }
  .tx-ctx-item:hover { background: var(--cream-100); color: var(--ink-900); }
  .tx-ctx-item.danger { color: var(--rose-500); }
  .tx-ctx-item.danger:hover { background: rgba(168,90,72,0.08); }
  .tx-ctx-item.danger.confirm { background: rgba(168,90,72,0.10); font-weight: 500; }
  .tx-ctx-sep { height: 1px; background: var(--line); margin: 4px 0; }
  .tx-ctx-cats { display: grid; grid-template-columns: 1fr 1fr; gap: 3px;
                 padding: 4px 6px 6px; }
  .tx-ctx-cat { display: flex; align-items: center; gap: 6px; padding: 5px 8px;
                border-radius: 6px; cursor: pointer; font-size: 11px; color: var(--ink-700); }
  .tx-ctx-cat:hover { background: var(--cream-200); }
  .tx-ctx-cat.active { background: var(--amber-100); color: var(--amber-500); font-weight: 500; }

  .tx-pagination { display: flex; align-items: center; justify-content: space-between;
                   padding: 10px 18px; border-top: 1px solid var(--line);
                   font-size: 11px; color: var(--ink-500); background: var(--cream-50); }
  .tx-pager { display: flex; gap: 4px; }
  .tx-pager > button { width: 26px; height: 26px; padding: 0; }
  .tx-pager > button.active { background: var(--amber-100); color: var(--amber-500);
                              border-color: rgba(184,105,61,0.3); }

  /* DETAIL PANEL */
  .tx-detail { background: var(--cream-50); border-left: 1px solid var(--line);
               padding: 22px 24px 18px;
               display: flex; flex-direction: column; gap: 18px; overflow: auto; }
  .tx-detail-close { width: 28px; height: 28px; padding: 0; align-self: flex-end;
                     background: transparent; border: 1px solid var(--line); border-radius: 7px;
                     color: var(--ink-600);
                     display: flex; align-items: center; justify-content: center; cursor: pointer; }
  .tx-detail-h { font-size: 11px; color: var(--ink-500); letter-spacing: 0.06em; text-transform: uppercase; }
  .tx-detail-amt { font-family: var(--font-display); font-size: 44px; line-height: 1;
                   color: var(--rose-500); margin: 4px 0 6px; letter-spacing: -0.01em; }
  .tx-detail-amt .cur { font-size: 26px; color: var(--ink-500); vertical-align: top; margin-right: 4px; }
  .tx-detail-amt .cents { font-size: 22px; color: var(--ink-500); }
  .tx-detail-lbl { font-family: var(--font-display); font-size: 22px; color: var(--ink-900);
                   letter-spacing: -0.01em; line-height: 1.2; }
  .tx-detail-sub { font-size: 12px; color: var(--ink-500); margin-top: 4px; font-family: var(--font-mono); }

  .tx-detail-section { display: flex; flex-direction: column; gap: 8px;
                       padding-top: 14px; border-top: 1px solid var(--line); }
  .tx-detail-section-t { font-size: 10px; color: var(--ink-500); letter-spacing: 0.1em;
                         text-transform: uppercase; margin-bottom: 2px; }

  .tx-field { display: flex; align-items: center; justify-content: space-between;
              padding: 8px 12px; background: var(--cream-100);
              border: 1px solid var(--line); border-radius: 8px; }
  .tx-field .lbl { font-size: 11px; color: var(--ink-500); }
  .tx-field .val { font-size: 12.5px; color: var(--ink-800); font-weight: 500; }
  .tx-field.editable { cursor: pointer; }
  .tx-field.editable:hover { border-color: var(--amber-500); }

  .tx-notes { background: var(--cream-100); border: 1px solid var(--line); border-radius: 8px;
              padding: 10px 12px; min-height: 56px; font-size: 12px; color: var(--ink-700);
              font-family: inherit; resize: vertical; outline: none; width: 100%;
              box-sizing: border-box; line-height: 1.5; }
  .tx-notes:focus { border-color: var(--amber-500); }
  .tx-notes::placeholder { color: var(--ink-400); font-style: italic; }

  .tx-similar { display: flex; flex-direction: column; gap: 6px; }
  .tx-similar-row { display: grid; grid-template-columns: 50px 1fr 80px;
                    align-items: center; gap: 8px; padding: 6px 0;
                    border-bottom: 1px dashed var(--line); font-size: 12px; }
  .tx-similar-row:last-child { border-bottom: none; }
  .tx-similar-row .date { font-family: var(--font-mono); font-size: 11px; color: var(--ink-500); }
  .tx-similar-row .amt { font-family: var(--font-mono); text-align: right; color: var(--ink-800); }

  .tx-rule { display: flex; gap: 10px; padding: 12px; background: var(--amber-100);
             border: 1px solid rgba(184,105,61,0.25); border-radius: 10px; align-items: flex-start; }
  .tx-rule-t { font-size: 12px; font-weight: 500; color: var(--ink-900); }
  .tx-rule-s { font-size: 11px; color: var(--ink-700); margin-top: 3px; }
  .tx-rule-cta { margin-top: 8px; }

  .tx-danger-btn { font-size: 11px; color: var(--rose-500); background: transparent;
                   border: 1px solid rgba(168,90,72,0.3); padding: 6px 10px; border-radius: 7px;
                   display: inline-flex; align-items: center; gap: 6px; cursor: pointer; }

  /* BULK ACTION BAR */
  .tx-bulk-bar { display: flex; align-items: center; gap: 14px; padding: 10px 18px;
                 background: var(--ink-800); color: var(--cream-50); border-radius: 10px;
                 box-shadow: 0 4px 14px var(--shadow-modal); }
  .tx-bulk-count { font-family: var(--font-display); font-size: 22px; }
  .tx-bulk-sep { width: 1px; height: 24px; background: rgba(232,224,208,0.2); }
  .tx-bulk-action { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px;
                    background: rgba(232,224,208,0.08); color: var(--cream-50);
                    border: 1px solid rgba(232,224,208,0.15); border-radius: 8px;
                    font-size: 12.5px; cursor: pointer; }
  .tx-bulk-action.amber { background: var(--amber-500); border-color: var(--amber-500); font-weight: 500; }
  .tx-bulk-action.danger { color: #d68a76; border-color: rgba(214,138,118,0.3); }
  .tx-bulk-close { margin-left: auto; width: 26px; height: 26px; border-radius: 6px;
                   background: transparent; border: none; color: var(--cream-300);
                   display: flex; align-items: center; justify-content: center; cursor: pointer; }
  .tx-bulk-filters { display: flex; align-items: center; gap: 10px; padding: 8px 4px; }
  .tx-search-clear { font-size: 14px; color: var(--ink-500); cursor: pointer; line-height: 1;
                     padding: 0 2px; }
  .tx-search-clear:hover { color: var(--ink-800); }

  .tx-cat-picker { display: flex; gap: 6px; padding: 0 6px; }
  .tx-cat-picker > span { padding: 4px 9px; border-radius: 999px;
                          border: 1px solid rgba(232,224,208,0.15);
                          font-size: 11px; color: var(--cream-50);
                          display: flex; align-items: center; gap: 5px; cursor: pointer; }
  .tx-cat-picker > span.hi { background: rgba(184,105,61,0.30); border-color: var(--amber-500); }

  /* EMPTY STATE */
  .tx-empty-card { background: var(--cream-50); border: 1px solid var(--line); border-radius: 12px;
                   flex: 1; min-height: 0; display: flex; flex-direction: column; }
  .tx-empty-body { flex: 1; display: flex; flex-direction: column; align-items: center;
                   justify-content: center; gap: 14px; padding: 32px; }
  .tx-empty-ico { width: 64px; height: 64px; border-radius: 16px; background: var(--cream-100);
                  color: var(--ink-500);
                  display: flex; align-items: center; justify-content: center; }
  .tx-empty-t { font-family: var(--font-display); font-size: 28px; color: var(--ink-900);
                letter-spacing: -0.01em; line-height: 1.1; text-align: center; max-width: 520px; }
  .tx-empty-t em { font-style: italic; color: var(--amber-500); }
  .tx-empty-s { font-size: 13.5px; color: var(--ink-600); text-align: center;
                max-width: 480px; line-height: 1.5; }
  .tx-empty-suggest { display: flex; gap: 8px; flex-wrap: wrap;
                      justify-content: center; margin-top: 6px; }
  .tx-empty-chip { padding: 6px 12px; background: var(--cream-100); border: 1px solid var(--line);
                   border-radius: 999px; font-size: 12px; color: var(--ink-700); cursor: pointer; }
  .tx-empty-chip.amber { background: var(--amber-100); color: var(--amber-500);
                         border-color: rgba(184,105,61,0.3); }
  .tx-empty-actions { display: flex; gap: 10px; margin-top: 14px; }

  /* ─── Layout panel detail ─── */
  .tx-panel-layout {
    display: grid;
    grid-template-columns: 1fr 360px;
    height: 100%;
    background: var(--page-bg);
  }

  /* ─── Mobile ─── */
  @media (max-width: 768px) {
    .tx-main { padding: 14px 12px; gap: 10px; }
    .tx-top { flex-direction: column; align-items: flex-start; gap: 6px; }
    .tx-h1 { font-size: 22px; }
    .tx-h1-actions { flex-wrap: wrap; gap: 6px; }
    .tx-toolbar { flex-wrap: wrap; gap: 6px; }
    .tx-search { min-width: 0; flex: 1 1 100%; }
    .tx-segmented { overflow-x: auto; max-width: 100%; }
    .tx-summary { flex-wrap: wrap; gap: 8px; padding: 8px 12px; font-size: 11px; }
    .tx-chips { gap: 6px; }
    /* Table : masquer compte, catégorie, mode — garder checkbox/date/libellé/montant/menu */
    .tx-thead, .tx-row {
      grid-template-columns: 24px 82px 1fr 80px 24px;
      padding: 8px 10px;
      gap: 8px;
    }
    .tx-acc, .tx-cat-chip, .tx-mode { display: none !important; }
    .tx-thead > :nth-child(4),
    .tx-thead > :nth-child(5),
    .tx-thead > :nth-child(6) { display: none !important; }
    .tx-pagination { flex-wrap: wrap; gap: 8px; padding: 8px 12px; font-size: 11px; }
    /* Panel détail : overlay plein écran */
    .tx-panel-layout { grid-template-columns: 1fr; }
    .tx-detail {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 60px;
      z-index: 150;
      border-left: none;
      border-top: 1px solid var(--line);
      overflow-y: auto;
    }
    .tx-detail-close {
      position: sticky; top: 0;
      align-self: auto;
      z-index: 1;
      background: var(--cream-50);
    }
    .tx-detail-amt { font-size: 36px; }
    .tx-detail-lbl { font-size: 18px; }
    /* Bulk bar */
    .tx-bulk-bar { flex-wrap: wrap; border-radius: 8px; gap: 8px; }
    .tx-bulk-count { font-size: 18px; }
  }
`;
