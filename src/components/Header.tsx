// App-Header: Titel + Export/Import/Reset oben, Tab-Navigation darunter.

import { Download, Upload, RotateCcw } from "lucide-react";
import { useRef, type ReactNode } from "react";
import type { FinanzierungController } from "../hooks/useFinanzierung";
import { exportiereJSON, importiereJSON } from "../utils/persistence";

interface Props {
  ctrl: FinanzierungController;
  tabs?: ReactNode;
}

export function Header({ ctrl, tabs }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importiereJSON(file);
      ctrl.ersetzeFinanzierung(data);
    } catch (err) {
      alert(
        "Datei konnte nicht gelesen werden: " +
          (err instanceof Error ? err.message : String(err)),
      );
    }
    e.target.value = "";
  }

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-ink-800)] bg-[var(--color-ink-950)]">
      <div className="mx-auto max-w-[1600px] px-6 pt-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={import.meta.env.BASE_URL + "logo.jpg"}
              alt="Amortize"
              className="h-9 w-9 shrink-0 rounded-lg"
            />
            <div className="min-w-0">
              <h1 className="text-base font-semibold tracking-tight text-[var(--color-ink-50)]">
                Amortize
              </h1>
              <p className="text-[11px] text-[var(--color-ink-400)] leading-tight">
                Mortgage &amp; Investment Simulator
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInput}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleImport}
            />
            <HeaderButton
              icon={<Upload size={14} />}
              label="Import"
              onClick={() => fileInput.current?.click()}
            />
            <HeaderButton
              icon={<Download size={14} />}
              label="Export"
              onClick={() => exportiereJSON(ctrl.finanzierung)}
              variant="accent"
            />
            <HeaderButton
              icon={<RotateCcw size={14} />}
              label="Reset"
              onClick={() => {
                if (confirm("Alle Eingaben zurücksetzen?")) ctrl.zuruecksetzen();
              }}
              variant="danger"
            />
          </div>
        </div>
        {tabs && <div className="mt-3 -mb-px">{tabs}</div>}
      </div>
    </header>
  );
}

interface HeaderButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "ghost" | "accent" | "danger";
}

function HeaderButton({ icon, label, onClick, variant = "ghost" }: HeaderButtonProps) {
  const styles = {
    ghost:
      "border-[var(--color-ink-700)] text-[var(--color-ink-200)] hover:border-[var(--color-ink-600)] hover:bg-[var(--color-ink-800)]",
    accent:
      "border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20",
    danger:
      "border-[var(--color-ink-700)] text-[var(--color-ink-400)] hover:border-[var(--color-warn)]/40 hover:text-[var(--color-warn)] hover:bg-[var(--color-warn)]/10",
  }[variant];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${styles}`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
