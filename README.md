# SCHMUCK FINDER

Eigenständige statische Website für schmuck-finder.de. Öffnen Sie `index.html` lokal oder veröffentlichen Sie den Ordner als statische Website.

## Produktdaten

Die Produktkarten verwenden die Amazon Creators API, den offiziellen Nachfolger der eingestellten PA-API 5. Die Vercel-Funktion durchsucht je Zielgruppe fünf Schmuckkategorien, führt Farbvarianten über die Parent-ASIN zusammen und liefert einen geprüften Katalog von 200 Angeboten pro Zielgruppe. Bilder, Titel, Preise und Partnerlinks stammen direkt von Amazon.

Damit der Finder auch bei einer kurzzeitig gedrosselten Schnittstelle sofort funktioniert, enthält `products-data.js` einen am 12. September 2026 über die Creators API geprüften Bestand mit 400 eindeutigen Parent-ASINs: 200 Angebote für Frauen und 200 für Männer. Die Website und `/api/products` verwenden diese Fassung als Ausfallsicherung; der Endpunkt aktualisiert einen Teil des Bestands direkt über Amazon und ergänzt ihn um den geprüften Katalog.

Die kuratierte Auswahl enthält ausschließlich bekannte Marken. Women zeigt Swarovski, THOMAS SABO, Fossil, LIEBESKIND, s.Oliver, Guess, Michael Kors, Calvin Klein, Tommy Hilfiger und Elli. Men zeigt Fossil, Diesel, Police, Tommy Hilfiger, Emporio Armani, BOSS, Lacoste, Calvin Klein, s.Oliver und Maserati. Die Auswahl verteilt sich auf Ketten, Ringe, Armbänder, Ohrringe und Anhänger; jede Marke kann im Finder direkt angeklickt werden.

Für den Hover-Effekt fragt die Schnittstelle zusätzlich `images.variants.large` ab. Wenn Amazon eine weitere Ansicht bereitstellt, zeigt die Produktkarte dieses Detailbild. Ohne alternatives Amazon-Bild bleibt der primäre Produktfreisteller stehen.

Benötigte serverseitige Vercel-Variablen:

- `AMAZON_CREATORS_CREDENTIAL_ID`
- `AMAZON_CREATORS_CREDENTIAL_SECRET`
- `AMAZON_PARTNER_TAG=Onlinestarkei-21`

Für die Migration eines bestehenden Projekts werden zusätzlich die älteren Variablennamen `AMAZON_CREDENTIAL_ID` und `AMAZON_CREDENTIAL_SECRET` unterstützt. Zugangsdaten bleiben ausschließlich in der Vercel-Umgebung.

## Rechtliches

Impressum und Datenschutz müssen vor dem Geschäftsbetrieb um die echten Betreiberangaben ergänzt werden.
