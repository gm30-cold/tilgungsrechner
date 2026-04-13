// Zwei Karten für einmalige Einnahmen bzw. Ausgaben rund um den Immobilienkauf.
// Beide Komponenten nutzen das gleiche interne Layout (`PostenCard`).

import { ArrowDownLeft, ArrowUpRight, Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "./ui/Card";
import { InputField } from "./ui/InputField";
import { IconButton } from "./ui/IconButton";
import type { FinanzierungController } from "../hooks/useFinanzierung";
import type { EinmaligerPosten } from "../types";

interface Props {
  ctrl: FinanzierungController;
}

export function EinmaligeEinnahmen({ ctrl }: Props) {
  return (
    <PostenCard
      title="Einnahmen (einmalig)"
      subtitle="z.B. Verkauf übernommenes Mobiliar"
      icon={<ArrowDownLeft size={16} />}
      items={ctrl.finanzierung.einnahmen}
      onAdd={() => ctrl.addEinmalig("einnahmen")}
      onUpdate={(id, patch) => ctrl.updateEinmalig("einnahmen", id, patch)}
      onRemove={(id) => ctrl.removeEinmalig("einnahmen", id)}
      placeholder="Möbelverkauf"
    />
  );
}

export function EinmaligeAusgaben({ ctrl }: Props) {
  return (
    <PostenCard
      title="Ausgaben (einmalig)"
      subtitle="Mobiliar, Renovierung, Modernisierung"
      icon={<ArrowUpRight size={16} />}
      items={ctrl.finanzierung.ausgaben}
      onAdd={() => ctrl.addEinmalig("ausgaben")}
      onUpdate={(id, patch) => ctrl.updateEinmalig("ausgaben", id, patch)}
      onRemove={(id) => ctrl.removeEinmalig("ausgaben", id)}
      placeholder="Neue Küche"
    />
  );
}

interface PostenCardProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  items: EinmaligerPosten[];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<EinmaligerPosten>) => void;
  onRemove: (id: string) => void;
  placeholder: string;
}

function PostenCard({
  title,
  subtitle,
  icon,
  items,
  onAdd,
  onUpdate,
  onRemove,
  placeholder,
}: PostenCardProps) {
  return (
    <Card
      title={title}
      subtitle={subtitle}
      icon={icon}
      actions={
        <IconButton
          variant="accent"
          icon={<Plus size={12} />}
          label="Neu"
          onClick={onAdd}
        />
      }
    >
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--color-ink-700)] px-3 py-4 text-center text-[10px] text-[var(--color-ink-500)]">
          Noch keine Einträge
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((it) => (
            <div
              key={it.id}
              className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2 items-end"
            >
              <InputField
                label="Bezeichnung"
                type="text"
                value={it.bezeichnung}
                placeholder={placeholder}
                onChange={(e) => onUpdate(it.id, { bezeichnung: e.target.value })}
              />
              <InputField
                label="Betrag"
                type="number"
                min={0}
                suffix="€"
                value={it.betrag || ""}
                onChange={(e) =>
                  onUpdate(it.id, { betrag: Number(e.target.value) || 0 })
                }
              />
              <InputField
                label="Datum"
                type="month"
                value={it.datum ?? ""}
                onChange={(e) =>
                  onUpdate(it.id, { datum: e.target.value || null })
                }
              />
              <IconButton
                variant="danger"
                icon={<Trash2 size={12} />}
                label=""
                onClick={() => onRemove(it.id)}
              />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
