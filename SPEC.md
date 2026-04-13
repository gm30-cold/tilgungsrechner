# SPEC: Tilgungsrechner für Immobilienfinanzierung

## 1. Überblick

Persönliches Web-Tool zur Kalkulation und Simulation einer Immobilienfinanzierung. Der Rechner deckt den gesamten Lebenszyklus ab: von den Kaufnebenkosten über die laufende Tilgung bis zur Anschlussfinanzierung. Ziel ist eine klare Übersicht über Gesamtkosten, Restschuld-Verlauf und den Einfluss von Sondertilgungen auf die Laufzeit.

**Zielgruppe:** Einzelnutzer (Eigennutzung, keine Kapitalanlage)
**Sprache:** Deutsch
**Datenhaltung:** Rein lokal, kein Server/Cloud – JSON Export/Import

---

## 2. Eingabebereiche

### 2.1 Immobilien-Grunddaten

| Feld | Typ | Pflicht | Hinweis |
|------|-----|---------|---------|
| Kaufpreis (Immobilie) | EUR | Ja | Reiner Kaufpreis ohne Nebenkosten |
| davon Mobiliarkosten | EUR | Nein | Im Kaufpreis enthaltenes Mobiliar (notariell festgehalten). Reduziert die Bemessungsgrundlage für Grunderwerbsteuer. |
| Eigenkapital | EUR | Ja | |

#### Nebenkosten

| Feld | Typ | Pflicht | Hinweis |
|------|-----|---------|---------|
| Grunderwerbsteuer | % / EUR | Ja | Eingabe über Bundesland-Auswahl (Steuersatz wird automatisch gezogen) ODER manuelle %-Eingabe. Bemessungsgrundlage = Kaufpreis − Mobiliarkosten. |
| Grundbuch | EUR | Ja | |
| Notar | EUR | Ja | |
| Makler | EUR | Nein | Optionales Feld |
| Sonstige Nebenkosten | EUR | Nein | Weitere Nebenkosten ohne Impact auf Notar/Grundbuch/Steuern (z.B. Gutachterkosten, Umzug) |

#### Grunderwerbsteuer nach Bundesland

Für die automatische Ermittlung des Steuersatzes wird eine hinterlegte Tabelle mit den aktuellen Sätzen je Bundesland verwendet:

| Bundesland | Satz |
|------------|------|
| Baden-Württemberg | 5,0 % |
| Bayern | 3,5 % |
| Berlin | 6,0 % |
| Brandenburg | 6,5 % |
| Bremen | 5,0 % |
| Hamburg | 5,5 % |
| Hessen | 6,0 % |
| Mecklenburg-Vorpommern | 6,0 % |
| Niedersachsen | 5,0 % |
| Nordrhein-Westfalen | 6,5 % |
| Rheinland-Pfalz | 5,0 % |
| Saarland | 6,5 % |
| Sachsen | 5,5 % |
| Sachsen-Anhalt | 5,0 % |
| Schleswig-Holstein | 6,5 % |
| Thüringen | 5,0 % |

> **Hinweis:** Steuersätze können sich ändern. Die Tabelle wird als editierbare Konfiguration im Code hinterlegt, sodass Anpassungen einfach möglich sind. Bei Auswahl "Manuell" kann der Nutzer den %-Satz selbst eingeben.

**Daraus ergibt sich automatisch:**
- Grunderwerbsteuer in EUR = (Kaufpreis − Mobiliarkosten) × Steuersatz
- Gesamtkosten = Kaufpreis + alle Nebenkosten
- Darlehenssumme = Gesamtkosten − Eigenkapital

### 2.2 Kreditkonditionen

| Feld | Typ | Pflicht | Hinweis |
|------|-----|---------|---------|
| Zinssatz (p.a.) | % | Ja | Sollzins pro Jahr |
| Zinsbindungsdauer | Jahre | Ja | z.B. 10, 15, 20 Jahre |
| Tilgung ODER Rate | Toggle | Ja | Siehe unten |

**Toggle: Tilgungsrate vs. monatliche Rate**
- **Modus A – Tilgungsrate:** Nutzer gibt anfängliche Tilgung in % ein (z.B. 2%). Monatliche Rate wird berechnet.
- **Modus B – Monatliche Rate:** Nutzer gibt feste monatliche Rate in EUR ein. Anfängliche Tilgungsrate wird daraus berechnet.

Dieser Toggle erlaubt sowohl die Planung einer neuen Finanzierung (Modus A) als auch das Abbilden eines bestehenden Kredits mit bekannter Rate (Modus B).

### 2.3 Anschlussfinanzierung

| Feld | Typ | Pflicht | Hinweis |
|------|-----|---------|---------|
| Zinssatz Anschlussfinanzierung | % | Nein | Preset: aktueller Zinssatz wird fortgeschrieben |
| Tilgung/Rate Anschlussfinanzierung | Toggle | Nein | Gleiche Logik wie bei Erstfinanzierung |

Die Anschlussfinanzierung greift automatisch nach Ablauf der Zinsbindung und wird in Grafiken visuell vom gesicherten Zeitraum abgegrenzt.

### 2.4 Sondertilgungen

#### 2.4.1 Reale Sondertilgungen (bereits geleistet)
Tabelle mit beliebig vielen Einträgen:

| Feld | Typ |
|------|-----|
| Datum | Datum (Monat/Jahr) |
| Betrag | EUR |

Diese fließen als Fakt in die Berechnung ein und verschieben die Restschuld konkret.

#### 2.4.2 Geplante Sondertilgungen (Prognose)
Tabelle mit beliebig vielen Einträgen:

| Feld | Typ |
|------|-----|
| Jahr | Kalenderjahr |
| Betrag | EUR |

Individuelle Beträge pro Jahr möglich (z.B. 2026: 5.000 EUR, 2027: 8.000 EUR, 2028: 3.000 EUR).

#### 2.4.3 Sensitivitätsanalyse
Vergleich mehrerer Szenarien mit jeweils **einheitlichem jährlichem Sondertilgungsbetrag**:
- z.B. Szenario A: 0 EUR/Jahr, Szenario B: 5.000 EUR/Jahr, Szenario C: 10.000 EUR/Jahr
- Darstellung: Wie verändert sich Restlaufzeit und Gesamtzinsbelastung je Szenario?

### 2.5 Förderungen

Tabelle mit beliebig vielen Einträgen:

| Feld | Typ | Hinweis |
|------|-----|---------|
| Bezeichnung | Text | z.B. "Hessengeld" |
| Gesamtbetrag | EUR | |
| Auszahlungsmodus | Auswahl | Einmalzahlung ODER ratierlich |
| Laufzeit (bei ratierlich) | Jahre | z.B. 10 Jahre |
| Beginn (bei ratierlich) | Datum | Ab wann wird ausgezahlt |

Förderungen wirken nicht direkt auf die Tilgung, sondern fließen in die **Gesamtkostenbetrachtung** ein (Gesamtkosten über Laufzeit minus erhaltene Förderungen = Netto-Belastung).

### 2.6 Einnahmen & Ausgaben (einmalig)

Zwei separate Listen für einmalige Posten rund um den Kauf:

**Einnahmen:**
| Feld | Typ | Hinweis |
|------|-----|---------|
| Bezeichnung | Text | z.B. "Verkauf übernommenes Mobiliar" |
| Betrag | EUR | |
| Datum | Datum | Optional |

**Ausgaben:**
| Feld | Typ | Hinweis |
|------|-----|---------|
| Bezeichnung | Text | z.B. "Neue Küche", "Renovierung Bad" |
| Betrag | EUR | |
| Datum | Datum | Optional |

Fließen in die Gesamtkostenbetrachtung ein, nicht in die Tilgungsberechnung.

### 2.7 Laufende Kosten

Tabelle mit beliebig vielen Einträgen für wiederkehrende monatliche/jährliche Kosten:

| Feld | Typ | Hinweis |
|------|-----|---------|
| Bezeichnung | Text | z.B. "Strom", "Heizung", "Gebäudeversicherung", "Grundsteuer" |
| Betrag | EUR | |
| Intervall | Auswahl | Monatlich ODER jährlich |
| Kategorie | Text | Optional, z.B. "Energie", "Versicherung", "Steuern" |

Laufende Kosten fließen nicht in die Tilgungsberechnung ein, sondern dienen der **Gesamtübersicht der monatlichen/jährlichen Belastung** durch die Immobilie (Kreditrate + laufende Kosten = tatsächliche monatliche Belastung).

---

## 3. Berechnungslogik

### 3.1 Tilgungsplan
- Monatliche Berechnung nach Annuitätendarlehen-Formel
- Annuität = Darlehenssumme × (Zinssatz + Tilgungssatz) / 12
- Monatlich: Zinsanteil = Restschuld × Zinssatz / 12, Tilgungsanteil = Rate − Zinsanteil
- Sondertilgungen reduzieren die Restschuld zum jeweiligen Zeitpunkt
- Nach Zinsbindungsende: Neuberechnung mit Anschluss-Zinssatz

### 3.2 Gesamtkostenbetrachtung
- Summe aller Zinszahlungen über gesamte Laufzeit
- Plus: Kaufnebenkosten, Ausgaben
- Minus: Eigenkapital, Förderungen, Einnahmen
- Ergebnis: Netto-Gesamtbelastung

### 3.3 Prognostiziertes Abzahlungsende
- Berechnung: Wann ist Restschuld = 0?
- Zwei Varianten: ohne Sondertilgungen vs. mit geplanten Sondertilgungen

---

## 4. Grafische Darstellungen

### 4.1 Restschuld-Verlauf (Hauptgrafik)
- X-Achse: Zeit (Jahre)
- Y-Achse: Restschuld in EUR
- **Zwei Linien:** ohne Sondertilgungen (Baseline) vs. mit Sondertilgungen (Prognose)
- **Visuelle Trennung:** Zinsbindungsperiode (solide/dunkel) vs. Anschlussfinanzierung (gestrichelt/heller)
- **Markierung:** Prognostiziertes Abzahlungsende für beide Szenarien

### 4.2 Zins/Tilgung-Aufteilung
- X-Achse: Zeit (Jahre)
- Y-Achse: EUR (gestapelt)
- Zeigt wie sich das Verhältnis von Zinszahlung zu Tilgung über die Laufzeit verschiebt

### 4.3 Sensitivitätsvergleich
- Mehrere Restschuld-Verläufe übereinander (je Szenario eine Linie)
- Tabelle mit: Szenario, Restlaufzeit, Gesamtzinsen, Ersparnis ggü. Baseline

---

## 5. Datenhaltung

### 5.1 JSON Export/Import
- Alle Eingabedaten werden als JSON-Datei exportiert/importiert
- Kein Server, keine Cloud, keine Datenbank
- Daten verlassen den Rechner des Nutzers nicht

### 5.2 Datenstruktur (vereinfacht)
```json
{
  "immobilie": {
    "kaufpreis": 350000,
    "mobiliarkosten": 5000,
    "nebenkosten": {
      "grunderwerbsteuer": {
        "modus": "bundesland",
        "bundesland": "Hessen",
        "satz": 6.0
      },
      "grundbuch": 5000,
      "notar": 8000,
      "makler": null,
      "sonstige": 1500
    },
    "eigenkapital": 80000
  },
  "kredit": {
    "zinssatz": 3.5,
    "zinsbindung_jahre": 10,
    "modus": "tilgungsrate",
    "tilgungsrate": 2.0,
    "monatliche_rate": null
  },
  "anschlussfinanzierung": {
    "zinssatz": 3.5,
    "modus": "tilgungsrate",
    "tilgungsrate": 2.0
  },
  "sondertilgungen_real": [
    { "datum": "2025-06", "betrag": 10000 }
  ],
  "sondertilgungen_geplant": [
    { "jahr": 2026, "betrag": 5000 },
    { "jahr": 2027, "betrag": 8000 }
  ],
  "foerderungen": [
    {
      "bezeichnung": "Hessengeld",
      "gesamtbetrag": 10000,
      "modus": "ratierlich",
      "laufzeit_jahre": 10,
      "beginn": "2025-01"
    }
  ],
  "einnahmen": [
    { "bezeichnung": "Möbelverkauf", "betrag": 2000, "datum": "2025-03" }
  ],
  "ausgaben": [
    { "bezeichnung": "Neue Küche", "betrag": 15000, "datum": "2025-04" }
  ],
  "laufende_kosten": [
    { "bezeichnung": "Strom", "betrag": 120, "intervall": "monatlich", "kategorie": "Energie" },
    { "bezeichnung": "Grundsteuer", "betrag": 480, "intervall": "jaehrlich", "kategorie": "Steuern" },
    { "bezeichnung": "Gebäudeversicherung", "betrag": 600, "intervall": "jaehrlich", "kategorie": "Versicherung" }
  ]
}
```

---

## 6. Technische Umsetzung

### 6.1 Tech-Stack
| Komponente | Technologie | Warum |
|------------|-------------|-------|
| Framework | React mit Vite | Schneller Einstieg, große Community, ideal für interaktive UIs |
| Sprache | TypeScript | Verhindert Fehler durch Typisierung, besonders wichtig bei Finanzberechnungen |
| Styling | Tailwind CSS | Schnelles, konsistentes Design ohne viel CSS-Wissen |
| Diagramme | Recharts | React-native Charting-Bibliothek, einfach zu nutzen |
| Hosting | Lokal / statische Dateien | Kein Server nötig, läuft als statische HTML/JS-App |

### 6.2 Architekturprinzip: Erweiterbarkeit

Die App wird modular aufgebaut, sodass neue Eingabebereiche, Kostenarten oder Auswertungen hinzugefügt werden können, ohne bestehenden Code zu brechen:

- **Datenmodell:** Zentrale TypeScript-Typen definieren die Struktur. Neue Felder werden optional ergänzt, bestehende JSON-Importe bleiben kompatibel.
- **Komponenten:** Jeder Eingabebereich (Grunddaten, Kredit, Sondertilgungen, etc.) ist eine eigenständige Komponente.
- **Berechnungslogik:** Getrennt von der UI in eigenen Modulen. Neue Berechnungen (z.B. Rendite bei Vermietung) können später ergänzt werden ohne die Tilgungslogik anzufassen.
- **Konfiguration:** Daten wie Grunderwerbsteuer-Sätze liegen in separaten Konfigurationsdateien, nicht hart im Code.

### 6.3 Responsive Design
- Desktop-first Layout
- Mobile-kompatibel durch responsive Breakpoints (Tailwind)
- Auf kleinen Bildschirmen: Eingabefelder und Grafiken untereinander statt nebeneinander

---

## 7. Nicht im Scope (bewusst ausgeschlossen)

- Nutzerverwaltung / Login
- Cloud-Speicherung / Datenbank
- Mehrsprachigkeit (nur Deutsch)
- Mieteinnahmen / Kapitalanlage-Rechnung
- Steuerliche Berechnung
- Barrierefreiheit (WCAG)
- Druckansicht / PDF-Export

---

## 8. Edge Cases

| Fall | Behandlung |
|------|------------|
| Eigenkapital > Gesamtkosten | Hinweis: "Kein Kredit nötig" |
| Monatliche Rate < Zinsanteil | Fehler: "Rate deckt nicht einmal die Zinsen" |
| Sondertilgung > Restschuld | Sondertilgung wird auf Restschuld gekappt |
| Zinssatz = 0% | Gültig – reine Tilgung ohne Zinsen |
| Bereits laufender Kredit | Startdatum des Kredits erfassen, bisherige Zahlungen werden berücksichtigt |
| Makler = leer | Wird als 0 EUR behandelt |
| Keine Sondertilgungen | Baseline = Prognose (eine Linie in Grafik) |
