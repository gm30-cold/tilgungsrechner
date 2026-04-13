// Dialog für den Import von Börse.de-Monatskursen via Copy-Paste.
// Wird als Overlay über den Miet-Benchmark-Tab gelegt.

import { useState, useRef } from "react";
import { ClipboardPaste, ExternalLink, X, Check, AlertTriangle } from "lucide-react";
import { parseBoerseTabelle } from "../utils/boerseParser";

const BOERSE_URL =
  "https://www.boerse.de/historische-kurse/iShares-MSCI-World-EUR-Hedged-UCITS-ETF-Acc/IE00B441G979";

interface Props {
  open: boolean;
  onClose: () => void;
  onImport: (returns: Record<string, number>) => void;
  /** Dez-Schlusskurs des Vorjahres (für die Jan-Berechnung), falls bekannt. */
  vorjahresDezClose?: number;
}

export function MsciImportDialog({
  open,
  onClose,
  onImport,
  vorjahresDezClose,
}: Props) {
  const [pasteText, setPasteText] = useState("");
  const [result, setResult] = useState<{
    ok: boolean;
    msg: string;
    warnungen: string[];
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!open) return null;

  function handleParse() {
    if (!pasteText.trim()) {
      setResult({ ok: false, msg: "Kein Text eingefügt.", warnungen: [] });
      return;
    }
    const parsed = parseBoerseTabelle(pasteText, vorjahresDezClose);
    if (parsed.anzahl === 0) {
      setResult({
        ok: false,
        msg: 'Keine gültigen Monatsdaten gefunden. Wurde die gesamte Tabelle inkl. Header "Monats-Schlusskurse YYYY" kopiert?',
        warnungen: [],
      });
      return;
    }
    onImport(parsed.returns);
    setResult({
      ok: true,
      msg: `${parsed.anzahl} Monats-Returns importiert (bis ${parsed.letzterMonat}).`,
      warnungen: parsed.warnungen,
    });
  }

  async function handleClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      setPasteText(text);
      setResult(null);
    } catch {
      setResult({
        ok: false,
        msg: "Zwischenablage konnte nicht gelesen werden. Bitte manuell in das Textfeld einfügen (Strg+V / Cmd+V).",
        warnungen: [],
      });
    }
  }

  function handleClose() {
    setPasteText("");
    setResult(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4 rounded-2xl border border-[var(--color-ink-700)] bg-[var(--color-ink-850)] shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--color-ink-800)] px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-ink-50)]">
              MSCI-World-Kursdaten aktualisieren
            </h2>
            <p className="text-[11px] text-[var(--color-ink-400)] mt-0.5">
              Monatliche Schlusskurse von Börse.de importieren
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-[var(--color-ink-400)] hover:bg-[var(--color-ink-800)] hover:text-[var(--color-ink-100)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Anleitung */}
        <div className="px-6 py-4 border-b border-[var(--color-ink-800)]">
          <div className="flex flex-col gap-2.5 text-[12px] text-[var(--color-ink-200)] leading-relaxed">
            <div className="flex items-start gap-2">
              <span className="shrink-0 flex items-center justify-center h-5 w-5 rounded-full bg-[var(--color-accent)]/15 text-[var(--color-accent)] text-[10px] font-bold mt-0.5">
                1
              </span>
              <span>
                Öffne{" "}
                <a
                  href={BOERSE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[var(--color-accent)] hover:underline"
                >
                  Börse.de – iShares MSCI World EUR Hedged
                  <ExternalLink size={10} />
                </a>
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="shrink-0 flex items-center justify-center h-5 w-5 rounded-full bg-[var(--color-accent)]/15 text-[var(--color-accent)] text-[10px] font-bold mt-0.5">
                2
              </span>
              <span>
                Scrolle zur Tabelle{" "}
                <strong className="text-[var(--color-ink-100)]">
                  "iShares MSCI World EUR Hedged UCITS ETF (Acc) Monats-Schlusskurse"
                </strong>
                . Markiere die gesamte Tabelle inkl. Titel und Jahresregister
                und kopiere sie in die Zwischenablage (Strg+C / Cmd+C).
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="shrink-0 flex items-center justify-center h-5 w-5 rounded-full bg-[var(--color-accent)]/15 text-[var(--color-accent)] text-[10px] font-bold mt-0.5">
                3
              </span>
              <span>
                Klicke unten auf{" "}
                <strong className="text-[var(--color-ink-100)]">
                  "Aus Zwischenablage einfügen"
                </strong>{" "}
                oder füge den Text manuell in das Feld ein. Dann{" "}
                <strong className="text-[var(--color-ink-100)]">
                  "Importieren"
                </strong>{" "}
                klicken.
              </span>
            </div>
          </div>
        </div>

        {/* Paste-Bereich */}
        <div className="px-6 py-4">
          <div className="flex items-center gap-2 mb-2.5">
            <button
              type="button"
              onClick={handleClipboard}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 px-3 py-2 text-xs font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 transition-colors"
            >
              <ClipboardPaste size={14} />
              Aus Zwischenablage einfügen
            </button>
            {pasteText && (
              <span className="text-[10px] text-[var(--color-ink-400)]">
                {pasteText.split("\n").filter((l) => l.trim()).length} Zeilen
                eingefügt
              </span>
            )}
          </div>
          <textarea
            ref={textareaRef}
            value={pasteText}
            onChange={(e) => {
              setPasteText(e.target.value);
              setResult(null);
            }}
            placeholder="Tabelle hier einfügen..."
            rows={8}
            className="w-full rounded-lg border border-[var(--color-ink-700)] bg-[var(--color-ink-900)]/80 px-3 py-2.5 text-[12px] text-[var(--color-ink-100)] font-mono placeholder:text-[var(--color-ink-500)] outline-none focus:border-[var(--color-accent)] resize-y"
          />

          {/* Feedback */}
          {result && (
            <div
              className={
                "mt-3 rounded-lg border px-3 py-2 text-[11px] " +
                (result.ok
                  ? "border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                  : "border-[var(--color-warn)]/40 bg-[var(--color-warn)]/10 text-[var(--color-warn)]")
              }
            >
              <div className="flex items-center gap-2">
                {result.ok ? <Check size={14} /> : <AlertTriangle size={14} />}
                <span>{result.msg}</span>
              </div>
              {result.warnungen.length > 0 && (
                <ul className="mt-1.5 ml-5 list-disc text-[var(--color-amber)]">
                  {result.warnungen.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[var(--color-ink-800)] px-6 py-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-[var(--color-ink-700)] px-4 py-2 text-xs font-medium text-[var(--color-ink-200)] hover:bg-[var(--color-ink-800)] transition-colors"
          >
            Schließen
          </button>
          <button
            type="button"
            onClick={handleParse}
            disabled={!pasteText.trim()}
            className="rounded-lg border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/15 px-4 py-2 text-xs font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent)]/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Importieren
          </button>
        </div>
      </div>
    </div>
  );
}
