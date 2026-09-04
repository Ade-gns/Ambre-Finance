import { describe, it, expect } from "vitest";
import { parseOFX, looksLikeOfx } from "./ofxParser";

// OFX 1.x — SGML, balises feuilles non fermées : le dialecte des banques
// françaises. En-tête clé:valeur avant la racine <OFX>.
const OFX_1X = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE

<OFX>
<BANKMSGSRSV1>
<STMTTRNRS>
<STMTRS>
<CURDEF>EUR
<BANKACCTFROM>
<BANKID>30004
<ACCTID>00012345678
<ACCTTYPE>CHECKING
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>20260301
<DTEND>20260331
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260301
<TRNAMT>-8.70
<FITID>2026030101
<NAME>BOULANGERIE PICHON
<MEMO>PAIEMENT PAR CARTE
</STMTTRN>
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20260315
<TRNAMT>2560.00
<FITID>2026031501
<NAME>VIREMENT DUPONT SAS
</STMTTRN>
</BANKTRANLIST>
<LEDGERBAL>
<BALAMT>2495.71
<DTASOF>20260331
</LEDGERBAL>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`;

// OFX 2.x — XML bien formé, toutes les balises fermées.
const OFX_2X = `<?xml version="1.0" encoding="UTF-8"?>
<?OFX OFXHEADER="200" VERSION="211"?>
<OFX>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <STMTRS>
        <BANKTRANLIST>
          <STMTTRN>
            <TRNTYPE>DEBIT</TRNTYPE>
            <DTPOSTED>20260304120000.000[-5:EST]</DTPOSTED>
            <TRNAMT>-13.49</TRNAMT>
            <FITID>abc123</FITID>
            <NAME>NETFLIX.COM</NAME>
            <MEMO>ABONNEMENT</MEMO>
          </STMTTRN>
        </BANKTRANLIST>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>`;

describe("looksLikeOfx", () => {
  it("reconnaît un OFX 1.x et un OFX 2.x", () => {
    expect(looksLikeOfx(OFX_1X)).toBe(true);
    expect(looksLikeOfx(OFX_2X)).toBe(true);
  });

  it("rejette un fichier qui n'est pas de l'OFX", () => {
    expect(looksLikeOfx("Date;Libellé;Montant\n01/03/2026;ACHAT;-10,00")).toBe(false);
    expect(looksLikeOfx("")).toBe(false);
  });
});

describe("parseOFX — dialecte 1.x (SGML, balises non fermées)", () => {
  it("extrait les transactions avec dates, libellés et montants signés", () => {
    const txs = parseOFX(OFX_1X);
    expect(txs).toHaveLength(2);
    expect(txs[0]).toMatchObject({
      d: "01/03/2026", lbl: "BOULANGERIE PICHON", sub: "PAIEMENT PAR CARTE", amt: -8.7,
    });
    expect(txs[1]).toMatchObject({
      d: "15/03/2026", lbl: "VIREMENT DUPONT SAS", amt: 2560,
    });
  });

  it("ne prend ni le solde de clôture ni les bornes de période pour des transactions", () => {
    const txs = parseOFX(OFX_1X);
    // <LEDGERBAL><BALAMT>2495.71 suit le dernier </STMTTRN> : il ne doit pas
    // être avalé par le dernier bloc.
    expect(txs.every(t => t.amt !== 2495.71)).toBe(true);
    expect(txs).toHaveLength(2);
  });

  it("catégorise via autoCat comme les autres formats", () => {
    const txs = parseOFX(OFX_1X);
    expect(txs[1].cat).toBe("inc"); // « VIREMENT … » reconnu comme un revenu
  });
});

describe("parseOFX — dialecte 2.x (XML)", () => {
  it("lit les balises fermées et ignore l'heure et le fuseau de DTPOSTED", () => {
    const txs = parseOFX(OFX_2X);
    expect(txs).toHaveLength(1);
    expect(txs[0]).toMatchObject({ d: "04/03/2026", lbl: "NETFLIX.COM", amt: -13.49 });
    expect(txs[0].cat).toBe("abo");
  });
});

describe("parseOFX — cas limites", () => {
  it("retombe sur MEMO quand NAME est vide, puis sur TRNTYPE", () => {
    const ofx = `<OFX><BANKTRANLIST>
<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20260301<TRNAMT>-12.00<MEMO>PRLV STORAGE BOX</STMTTRN>
<STMTTRN><TRNTYPE>ATM<DTPOSTED>20260302<TRNAMT>-60.00</STMTTRN>
</BANKTRANLIST></OFX>`;
    const txs = parseOFX(ofx);
    expect(txs).toHaveLength(2);
    expect(txs[0].lbl).toBe("PRLV STORAGE BOX");
    expect(txs[1].lbl).toBe("ATM");
  });

  it("ignore les montants nuls ou illisibles", () => {
    const ofx = `<OFX><BANKTRANLIST>
<STMTTRN><DTPOSTED>20260301<TRNAMT>0.00<NAME>REGUL</STMTTRN>
<STMTTRN><DTPOSTED>20260302<TRNAMT><NAME>VIDE</STMTTRN>
<STMTTRN><DTPOSTED>20260303<TRNAMT>-5.00<NAME>REEL</STMTTRN>
</BANKTRANLIST></OFX>`;
    const txs = parseOFX(ofx);
    expect(txs).toHaveLength(1);
    expect(txs[0].lbl).toBe("REEL");
  });

  it("gère un export où </STMTTRN> est omis", () => {
    const ofx = `<OFX><BANKTRANLIST>
<STMTTRN><DTPOSTED>20260301<TRNAMT>-8.70<NAME>PREMIERE
<STMTTRN><DTPOSTED>20260302<TRNAMT>-9.90<NAME>SECONDE
</BANKTRANLIST></OFX>`;
    const txs = parseOFX(ofx);
    expect(txs).toHaveLength(2);
    expect(txs.map(t => t.lbl)).toEqual(["PREMIERE", "SECONDE"]);
  });

  it("applique les règles utilisateur", () => {
    const rules = [{ id: 1, pattern: "boulangerie", catId: "alim", matchType: "contains" }];
    const txs = parseOFX(OFX_1X, rules);
    expect(txs[0]).toMatchObject({ cat: "alim", conf: "high" });
  });

  it("retourne null sur un fichier qui n'est pas de l'OFX", () => {
    expect(parseOFX("Date;Montant\n01/03/2026;-10,00")).toBeNull();
    expect(parseOFX("")).toBeNull();
  });

  it("retourne null sur un OFX sans aucune transaction", () => {
    expect(parseOFX(`<OFX><BANKTRANLIST><DTSTART>20260301<DTEND>20260331</BANKTRANLIST></OFX>`)).toBeNull();
  });
});
