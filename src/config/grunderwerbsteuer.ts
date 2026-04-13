// Grunderwerbsteuer-Sätze je Bundesland (Stand 2025).
// Werte können hier zentral angepasst werden, wenn sich Sätze ändern.

import type { Bundesland } from "../types";

export const GRUNDERWERBSTEUER_SAETZE: Record<Bundesland, number> = {
  "Baden-Württemberg": 5.0,
  "Bayern": 3.5,
  "Berlin": 6.0,
  "Brandenburg": 6.5,
  "Bremen": 5.0,
  "Hamburg": 5.5,
  "Hessen": 6.0,
  "Mecklenburg-Vorpommern": 6.0,
  "Niedersachsen": 5.0,
  "Nordrhein-Westfalen": 6.5,
  "Rheinland-Pfalz": 5.0,
  "Saarland": 6.5,
  "Sachsen": 5.5,
  "Sachsen-Anhalt": 5.0,
  "Schleswig-Holstein": 6.5,
  "Thüringen": 5.0,
};

export const BUNDESLAENDER = Object.keys(GRUNDERWERBSTEUER_SAETZE) as Bundesland[];
