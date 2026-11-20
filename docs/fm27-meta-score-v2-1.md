# FM27 Outfield Meta v2.1

**Explorativer Scoutingindex für eine konkrete Einsatzposition, Stand 20. November 2026.** Der Spielerexport liefert Attribute für den Rankingvergleich. Für die Vorhersage individueller Matchleistung steht die unabhängige Validierung aus.

## Baseline und Einsatzposition

Die Basis ist der Feldspieler-Commit 9293f80. Für Quelle s, Positionsgruppe p und Attribut j werden die beobachteten positiven GD-Koeffizienten innerhalb derselben Quelle und Position normiert. Der Endpunkt ist die Tordifferenz über 38 Spiele bei einem zusätzlichen Attributpunkt eines Spielers. Die beiden normierten Quellenprofile erhalten jeweils die Hälfte des Gewichts. Kleine positive Punktschätzungen können unsicher sein.

~~~text
q[s,p,j] = max(0, beta[s,p,j]) / Σ_i max(0, beta[s,p,i])    (beobachtete Koeffizienten)
w[p,j]   = (q[Mac,p,j] + q[Purity,p,j]) / 2
S₂.₀,p   = Σ_j w[p,j] x[j]                                 (Σ_j w[p,j] = 1)
~~~

Macs GD-Tabelle enthält keinen Dribbling-Koeffizienten. Das Feld bleibt in den Rohdaten leer, sein Beitrag zur Mac-Summe ist null. Nur Purity trägt hier zum Ensemble bei. Finishing und Strength behalten in jeder Positionsgruppe positive Ensemblegewichte. Tatsächliche Tore berücksichtigen auch die Verwertung einer gegebenen Chance. Ein Ranking ausschließlich nach xG könnte diesen Beitrag übersehen. Vollständige Rohwerte, ungerundete Gewichte und die Entwicklung seit v0.1 stehen in der [Modellspezifikation](fm27-outfield-meta-v2-model.json) und im [Baseline-Bericht](fm27-outfield-meta-v2.md).

Positionsgewichte in Prozent, zur Anzeige gerundet. Die Rechnung verwendet volle Genauigkeit.

| Attribut | ST | CB | FB | DM | AM |
| --- | ---: | ---: | ---: | ---: | ---: |
| Acceleration | 19,47 | 21,27 | 18,91 | 24,82 | 17,80 |
| Pace | 20,98 | 15,17 | 23,21 | 17,11 | 21,46 |
| JumpingReach | 16,45 | 22,32 | 6,46 | 9,09 | 9,77 |
| Stamina | 7,47 | 9,51 | 16,18 | 13,49 | 11,86 |
| Anticipation | 7,39 | 8,30 | 8,87 | 5,22 | 8,50 |
| Balance | 7,62 | 8,45 | 5,52 | 3,62 | 3,28 |
| Strength | 6,13 | 6,44 | 7,22 | 10,88 | 12,70 |
| Finishing | 7,98 | 0,96 | 1,70 | 4,04 | 6,23 |
| Concentration | 4,93 | 6,24 | 7,67 | 6,86 | 4,59 |
| Dribbling | 1,57 | 1,34 | 4,26 | 4,88 | 3,83 |

DC verwendet CB, DL/DR/WBL/WBR verwenden FB, AMC/AML/AMR verwenden AM. Der Transfer zwischen Außen- und Flügelverteidigern sowie zwischen zentralen und breiten offensiven Mittelfeldpositionen bleibt kontextabhängig. MC verwendet einen Proxy aus 60 % DM und 40 % AM, ML/MR einen Proxy aus je 50 % FB und AM. SW verwendet CB als Proxy. Für die Tabellenposition zählt die bevorzugte natürliche Position, sofern sie in der natürlichen Liste liegt. Sonst entscheidet die feste Reihenfolge SW, DC, DL, DR, WBL, WBR, DM, MC, ML, MR, AMC, AML, AMR, ST. Bei älteren Exporten ohne natürliche Liste dient die vorhandene Positionsliste als Grundlage. Ein Spieler ohne bekannte Einsatzposition erhält einen Strich. Das Profil zeigt jede natürliche Einsatzposition separat.

## Evidenz für die Kurvenform

- Studie 12 variiert Attribute mannschaftsweit und misst vor allem xPts. In 21.000 Matches liegt der geschätzte Knick für Sprunghöhe bei 9. Die veröffentlichten Steigungen betragen rund 0,019 und 0,047 xPts pro Match und Attributpunkt. Einsatzfreude fällt besonders bei 1 ab. Der geschätzte Knick liegt dort bei 3, das beobachtete Plateau beginnt ungefähr bei 9. Ausdauer hat den steilsten Bereich unter ungefähr 4. [Fm-Match-Lab, Studie 12](https://github.com/caiograco289/Fm-Match-Lab/blob/9bc29019adc87cf45138c462e96c4e19077a0381/docs/studies/12-thresholds.md)
- Studie 13b berichtet 50.000 Gegenpress- und 34.340 Catenaccio-Matches. Die Krümmungsanalyse verwendet dieselben 50.000 Gegenpress-Matches wie die Hauptanalyse. Sie stützt die positive Krümmung der Sprunghöhe und eine positive Wechselwirkung von Pace und Acceleration. Für die übrigen geprüften Attribute ist eine vergleichbare Krümmung innerhalb 8–17 offen. Studie 12 findet für Pace und Acceleration stärkere Zuwächse unter ungefähr 13 bzw. 11. Richtung und Übertragbarkeit der Interaktion auf individuelle GD-Gewichte reichen für einen zusätzlichen Multiplikator derzeit nicht aus. Alle anderen Nutzenfunktionen bleiben linear. [Fm-Match-Lab, Studie 13b](https://github.com/caiograco289/Fm-Match-Lab/blob/9bc29019adc87cf45138c462e96c4e19077a0381/docs/studies/13b-value-by-position-random.md)
- Purity berichtet 200.000 Simulationen aus 50.000 Konfigurationen mit je vier Seeds im eigenen 3-4-2-1. Diese zweite Autorenquelle liefert eigene Positionsgewichte. Gemeinsamkeiten zwischen den Simulationen desselben Autors und die unterschiedlichen Taktiken begrenzen die statistische Interpretation des Quellenvergleichs. [Purity, Positionsstudie](https://fm-arena.com/threads/attribute-importance-by-position-in-fm27-a-test-on-my-own-tactic.125/)
- Harvestgreen22 berichtet am 20. November einen Mannschaftstest auf sechs Stufen von 1 bis 20 gegen 19 exportierte Premier-League-KI-Taktiken, jeweils zu Hause und auswärts. Die berichteten Muster für hohe Sprunghöhe, extrem niedrige Einsatzfreude und niedrige Ausdauer sind mit der gewählten Richtung vereinbar. Die schwache Auswärtsbaseline begrenzt, wie stark die beobachtete Gewinnrate noch fallen kann. Der Beitrag verlinkt Tabellen, darunter eine ausdrücklich als partiell bezeichnete. Exakter Engine-Build und Vollständigkeit der Rohdaten sind für diese Implementierung unbestätigt. Der Beitrag dient ausschließlich als qualitative Gegenprüfung. [Harvestgreen22, Attributstufen-Test](https://fm-arena.com/threads/fm27-new-player-attribute-1-4-8-12-16-20-test.276/)

## Berechnung, Skala und Übertragungsannahme

~~~text
D = 0,019 × 8 + 0,047 × 11 = 0,669
g_voll(x) = 1 + 19 × [0,019 × min(x−1, 8) + 0,047 × max(0, x−9)] / D
g_JR(x; ρ) = (1−ρ) × x + ρ × g_voll(x)
g_j(x) = x für jedes weitere Attribut
S₂.₁,p(x; ρ) = Σ_j w[p,j] × g_j(x[j])
             = S₂.₀,p(x) + w[p,JR] × [g_JR(x[JR]; ρ) − x[JR]]
~~~

Die Endpunkte sind exakt 1 und 20. Bei 9 schließen beide Segmente stetig aneinander an. Ihre Steigungen sind (1−ρ) + ρ × 19 × 0,019/D bzw. (1−ρ) + ρ × 19 × 0,047/D, beide positiv. Zusammen mit den normierten Gewichten garantiert das Monotonie und die Skala 1–20. Bei ρ = 0 ist der Score exakt die lineare Baseline. **ρ = 0,5** ist die konservative Arbeitsentscheidung für v2.1. **ρ = 1** überträgt die gesamte relative Kurvenform. Eine Änderung des Standardwerts erfordert eine neue dokumentierte Modellversion mit erneutem Rankingvergleich.

Die gleiche Form für alle Positionsgruppen und die Übertragung von Mannschafts-xPts auf den Einzelspieler-GD-Index sind Modellannahmen. Die Endpunktnormierung und die Halbierung bestimmen die Stärke der Korrektur. Die Studien identifizieren weder einen optimalen ρ-Wert noch eine individuelle GD-Kurve auf der gesamten Skala.

## Mindestwerte und fehlende Daten

| Attribut | Angezeigte Attributwerte | Diagnose |
|---|---|---|
| Work Rate | 1–2 / 3–6 / 7–8 / 9–20 | SEVERE_LOW_WORK_RATE / LOW_WORK_RATE / BELOW_PLATEAU / NO_LOW_FLOOR_WARNING |
| Stamina | 1–3 / 4–6 / 7–20 | SEVERE_LOW_STAMINA / LOW_STAMINA / NO_LOW_FLOOR_WARNING |

Die Stufen interpretieren die gemessenen Kurven. Insbesondere ist 7 für Ausdauer eine pragmatische Warnschwelle. Das Diagnoseobjekt enthält die Einzelkategorien, die aktiven Warncodes, die Zahl schwerer Warnungen und den Gesamtstatus. Die Priorität lautet SEVERE, WARNING, INCOMPLETE, OK. Fehlende oder ungültige Messungen sind im Einzelstatus als UNKNOWN erkennbar. Fehlende Einsatzfreude lässt einen sonst gültigen Score zu. Für alle zehn positiv gewichteten Attribute sind endliche Zahlen in [1,20] erforderlich. Die Tabelle markiert Warnungen mit ⚠ und unvollständige Diagnosen ohne bekannte Warnung mit ?. Details zeigen Attribut, Messwert und Schweregrad. Ausdauer wirkt weiterhin über ihr lineares Gewicht. Es gibt keinen kalibrierten zusätzlichen Einzelspieler-Flooreffekt.

Über die Modulschnittstelle liefert der Aufruf mit einer expliziten Gruppe, etwa <code>evaluate(attrs, "CB")</code>, die Positionsdetails. <code>evaluateLinear(attrs, "CB")</code> liefert die eigenständige v2.0-Baseline.

Die App sortiert und filtert nach dem ungerundeten Arbeitsindex. Im Tooltip stehen der lineare Vergleichswert und die mit derselben Kurve berechneten Quellenscores. Ihre Spannweite beschreibt Quellenempfindlichkeit. PA-Meta verwendet die bestehende Attributprojektion, dieselbe Nutzenkurve und die bisherige Untergrenze durch den aktuellen Score. Die Floor-Hinweise der Oberfläche beziehen sich auch dort auf beobachtete Attribute. PA-Meta ist ein hypothetisches Entwicklungsszenario. Für die Wahrscheinlichkeit, das Potenzial auszuschöpfen, gibt es hier keine Schätzung. Die Historie speichert weiterhin CA, PA und Wert.

## Gemessene Rankingsensitivität

Der Offline-Vergleich verwendet die App-Baseline und das Produktionsmodul für alle vier Scores. Verglichen werden nur Spieler derselben Modellgruppe. Spearman ist die Pearson-Korrelation der mittleren Ränge bei Bindungen. Werte mit Abstand unter 10⁻¹² zur Spitze einer Bindungsgruppe gelten als gleich. Für genau zehn Plätze entscheidet innerhalb einer Bindung die ursprüngliche Eingabereihenfolge. Die obere Dezilgruppe enthält je Position die ersten aufgerundeten 10 %. Gruppenübergreifende Summen addieren diese separat gebildeten Gruppen.

### Vorhandener Spielerexport

Export vom 17.11.2026, Versionsfeld **27.1**, SHA-256 **fa57cbb5f25347cf69ba6cb35f9006c99136677c2ba224f5a1da042abcf9ab39**. Von 113.673 Datensätzen sind 18 in der App ausgeblendet, 12.570 sind Torhüter. Für 6.091 weitere Datensätze fehlt ein gültiger Vergleich. Die übrigen **94.994** zählen jeweils einmal an ihrer Standardposition. SW ist unbesetzt. Es wurden ausschließlich vorhandene Attribute ausgewertet.

| Gruppe | n | Spearman Legacy → v2.1 | Top 10 gemeinsam | Spearman v2.0 → v2.1 | Top 10 gemeinsam (v2.0) | Ø ΔR | Max. ΔR | Max. ΔS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| ST | 14.513 | 0,95155 | 6 | 0,99932 | 10 | 116,4 | 892,0 | 0,303 |
| CB | 16.038 | 0,94572 | 6 | 0,99905 | 9 | 149,5 | 1.007,0 | 0,411 |
| FB | 15.849 | 0,94415 | 8 | 0,99985 | 9 | 58,1 | 445,5 | 0,119 |
| DM | 10.286 | 0,96977 | 7 | 0,99982 | 9 | 42,9 | 300,0 | 0,167 |
| AM | 21.163 | 0,93576 | 6 | 0,99961 | 9 | 127,3 | 922,5 | 0,180 |
| CM_PROXY | 13.013 | 0,96061 | 8 | 0,99972 | 10 | 66,2 | 450,0 | 0,172 |
| WM_PROXY | 4.132 | 0,94846 | 6 | 0,99974 | 9 | 20,5 | 122,0 | 0,149 |

| Gruppe | Spearman ρ 0,5 → 1 | Top 10 gemeinsam | Max. ΔR ρ 0,5 → 1 | Oberes Dezil (ρ 0,5) | Mit Warnung | Davon schwer |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ST | 0,99934 | 9 | 909,0 | 1.452 | 47 | 0 |
| CB | 0,99914 | 10 | 1.069,0 | 1.604 | 23 | 1 |
| FB | 0,99984 | 10 | 470,0 | 1.585 | 10 | 0 |
| DM | 0,99982 | 10 | 296,0 | 1.029 | 3 | 0 |
| AM | 0,99959 | 10 | 881,0 | 2.117 | 86 | 0 |
| CM_PROXY | 0,99971 | 9 | 466,0 | 1.302 | 16 | 0 |
| WM_PROXY | 0,99974 | 10 | 135,0 | 414 | 10 | 0 |

ΔR bezeichnet die absolute Verschiebung des mittleren Rangs, ΔS die absolute Scoreänderung. In der ersten Tabelle beziehen sich diese Spalten auf v2.0 → v2.1. In den sieben v2.1-Top-Tens gab es bei vollständiger Floor-Diagnostik **0 von 70** Spielern mit Warnung. Im oberen Dezil waren es **195 von 9.503**, davon einer mit schwerer Warnung. Alle 9.503 hatten gültige Floor-Attribute. Das Ergebnis hängt vom Kaderbestand und der Auswahl vollständig bewertbarer Spieler ab.

### Kontrollierte synthetische Profile

Alle 17 Profile werden jeweils an derselben Einsatzposition gegeneinander bewertet, auch wenn einzelne Spieler dort positionsfremd wären. Jede Tabellenzeile zeigt das Ergebnis im Vergleichsfeld ihrer angegebenen Positionsgruppe. Die vollständige JSON-Ausgabe enthält sämtliche Ranglisten, Einzelverschiebungen lassen sich aus den vier Rängen ablesen.

| Profil | Position | Legacy | v2.0 | v2.1 | ρ = 1 | Ränge in Modellreihenfolge | Floor |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Fast striker, weak finishing | ST | 15,26 | 14,65 | 14,45 | 14,26 | 5 → 6 → 6 → 6 | OK |
| Slower clinical striker | ST | 13,37 | 14,14 | 13,92 | 13,70 | 11 → 9 → 9 → 9 | OK |
| Aerial striker | ST | 12,78 | 13,31 | 13,25 | 13,20 | 14 → 12 → 12 → 12 | OK |
| High attributes, work rate 2 | ST | 15,84 | 16,00 | 15,89 | 15,78 | 3 → 2 → 2 → 2 | SEVERE_LOW_WORK_RATE |
| High attributes, work rate 8 | ST | 15,91 | 16,00 | 15,89 | 15,78 | 2 → 2 → 2 → 2 | BELOW_PLATEAU |
| High attributes, work rate 9 | ST | 15,92 | 16,00 | 15,89 | 15,78 | 1 → 2 → 2 → 2 | OK |
| Aerial centre-back | DC | 12,04 | 13,23 | 13,23 | 13,23 | 15 → 15 → 14 → 11 | OK |
| Fast centre-back | DC | 15,02 | 14,51 | 14,18 | 13,84 | 6 → 6 → 6 → 6 | OK |
| CB twin, reach 19 | DC | 12,85 | 13,56 | 13,53 | 13,49 | 13 → 12 → 9 → 9 | OK |
| CB twin, reach 8 | DC | 11,51 | 11,11 | 10,75 | 10,39 | 16 → 16 → 16 → 16 | OK |
| High-stamina full-back | DL | 14,01 | 14,98 | 14,89 | 14,81 | 8 → 7 → 7 → 7 | OK |
| Defensive holding midfielder | DM | 12,94 | 13,75 | 13,62 | 13,50 | 12 → 11 → 11 → 11 | OK |
| Fast DM, stamina 3 | DM | 14,77 | 13,72 | 13,60 | 13,48 | 7 → 12 → 12 → 12 | SEVERE_LOW_STAMINA |
| Dribbling winger | AML | 15,51 | 14,85 | 14,72 | 14,59 | 4 → 4 → 4 → 4 | OK |
| Technical slow number ten | AMC | 10,71 | 10,62 | 10,49 | 10,36 | 17 → 17 → 17 → 17 | OK |
| Attacking number eight | MC | 13,62 | 14,36 | 14,23 | 14,11 | 10 → 8 → 8 → 8 | OK |
| Balanced profile | MC | 13,72 | 14,00 | 13,91 | 13,81 | 9 → 9 → 9 → 9 | OK |

Die IV-Zwillinge unterscheiden sich ausschließlich in Sprunghöhe. Der IV mit 19 steigt im Vergleich zur linearen Baseline drei Plätze, obwohl sein absoluter Score leicht sinkt. Der IV mit 8 verliert mehr Scorepunkte und bleibt auf Rang 16. Die drei Spieler mit Einsatzfreude 2, 8 und 9 teilen sich bei v2.1 denselben Rang. Die Anzeige unterscheidet die drei Risikoprofile. Der schnelle Stürmer mit schwachem Abschluss bleibt in diesen Profilen vor dem langsameren Vollstrecker. Ein zusätzlicher Abschlusspunkt hat bei ST weiterhin einen positiven Beitrag von rund 0,080 Punkten.

**Plausibilität und Artefakte.** Hohe Sprunghöhe kann einen relativen Ranggewinn bringen. Durch die feste Endpunktnormierung sinkt zugleich für *jeden* inneren Sprunghöhenwert der absolute Score gegenüber linear. Am stärksten ist die Absenkung bei 9, an 1 und 20 ist sie null. Auch ein mittleres Einheitsprofil fällt deshalb unter seinen Attributwert. Diese Eigenschaft folgt aus der Konstruktion. Sie ist ein möglicher Kalibrierungsnachteil, wenn Nutzer einen festen Meta-Grenzwert über Versionswechsel hinweg verwenden. In dicht besetzten Gruppen reichen kleine Abstände für große Rangbewegungen. Der plausible Verlauf und die hohe Rangkorrelation liefern bislang keinen Nachweis besserer Matchvorhersage.

## Gültigkeit für 27.1.0 und unabhängige Bestätigung

Die Gewichte stammen aus früheren FM27-Experimenten. Die Auswertung des Exports mit Versionskennung 27.1 prüft die Auswirkung auf vorhandene Spielerattribute. Weder die Identität des genauen 27.1.0-Engine-Builds mit den Studien noch die Stabilität der Koeffizienten nach dem Patch ist damit bestätigt.

Für eine Bestätigung müssten vor Einsicht in die Ergebnisse Patch/Build, Einsatzpositionen, Endpunkt und Vergleich feststehen. Ein geeigneter gepaarter Holdout variiert je Fixture genau einen eingesetzten Spieler, hält Mitspieler, Gegner, Taktik und Minuten vergleichbar und misst tatsächliche Tordifferenz pro gleicher Spielzeit. Seeds, Spieler und Fixtures müssen von Modellwahl und Kalibrierung getrennt sein. Bei Beobachtungsdaten sind Einsatzminuten, Teamstärke, Gegner und Rolle zu berücksichtigen. Als primäre Prüfung eignet sich der Anteil korrekt geordneter Spielerpaare innerhalb einer Position, mit vorab festgelegter Behandlung von Gleichständen. Besonders aussagekräftig sind Paare, deren Rang sich zwischen v2.0 und v2.1 umkehrt. Vor einer Überlegenheitsaussage den gepaarten Unterschied mit nach Fixture/Team gruppierter Unsicherheit ausweisen, ausreichende Präzision für die vorab definierte relevante Verbesserung verlangen und nach Position sowie Sprunghöhenbereich prüfen. Eine neue Version von ρ benötigt nach der Auswahl einen frischen Holdout. PA-Projektionen benötigen eigene longitudinale Entwicklungsdaten.

## Reproduktion

~~~sh
npm test
node tools/rank-outfield-meta.js
node tools/rank-outfield-meta.js "Pfad/zum/FM27-dump.json"
node tools/compare-outfield-meta.js
git diff --check
~~~

Ohne Dateipfad liefert der Rechner alle synthetischen Einzelscores und Ränge. Mit Dateipfad liest er einen vollständigen FM27-Export und gibt Positionsaggregate aus. Die Anwendung berechnet pro Spieler eine feste Zahl von Attributbeiträgen. Der vorhandene WeakMap-Cache hält skalare Tabellenwerte, die Rankinganalyse sortiert separat und läuft ausschließlich auf Anforderung.
