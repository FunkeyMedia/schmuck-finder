# SCHMUCK FINDER

Eigenständige statische Website für schmuck-finder.de. Öffnen Sie `index.html` lokal oder veröffentlichen Sie den Ordner als statische Website.

## Produktdaten

Die Produktkarten verwenden die Amazon Creators API, den offiziellen Nachfolger der eingestellten PA-API 5. Die Vercel-Funktion durchsucht je Zielgruppe fünf Schmuckkategorien, führt Farbvarianten über die Parent-ASIN zusammen und liefert fünf verfügbare Angebote je Kategorie, also bis zu 25 pro Zielgruppe. Bilder, Titel, Preise und Partnerlinks stammen direkt von Amazon.

Damit der Finder auch bei einer kurzzeitig gedrosselten Schnittstelle sofort funktioniert, enthält `products-data.js` einen am 12. September 2026 über die Creators API geprüften Bestand mit 50 eindeutigen Parent-ASINs: 25 Angebote für Frauen und 25 für Männer. Die Website und `/api/products` verwenden diese Fassung als Ausfallsicherung; sobald gültige Zugangsdaten im neuen Vercel-Projekt vorhanden sind, aktualisiert der Endpunkt den Bestand direkt über Amazon.

Die kuratierte Auswahl enthält ausschließlich bekannte Marken. Women zeigt Swarovski, s.Oliver, LIEBESKIND, Fossil und THOMAS SABO. Men zeigt Fossil, Diesel, Lacoste, Police, Tommy Hilfiger und Emporio Armani. Jede Ansicht enthält je fünf Ketten, Ringe, Armbänder, Ohrringe und Anhänger.

Benötigte serverseitige Vercel-Variablen:

- `AMAZON_CREATORS_CREDENTIAL_ID`
- `AMAZON_CREATORS_CREDENTIAL_SECRET`
- `AMAZON_PARTNER_TAG=Onlinestarkei-21`

Für die Migration eines bestehenden Projekts werden zusätzlich die älteren Variablennamen `AMAZON_CREDENTIAL_ID` und `AMAZON_CREDENTIAL_SECRET` unterstützt. Zugangsdaten bleiben ausschließlich in der Vercel-Umgebung.

## Rechtliches

Impressum und Datenschutz müssen vor dem Geschäftsbetrieb um die echten Betreiberangaben ergänzt werden.
