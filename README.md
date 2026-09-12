# SCHMUCK FINDER

Eigenständige statische Website für schmuck-finder.de. Öffnen Sie `index.html` lokal oder veröffentlichen Sie den Ordner als statische Website.

## Produktdaten

Die Produktkarten verwenden die Amazon Creators API, den offiziellen Nachfolger der eingestellten PA-API 5. Die Vercel-Funktion durchsucht je Zielgruppe fünf Schmuckkategorien, führt Farbvarianten über die Parent-ASIN zusammen und liefert fünf verfügbare Angebote je Kategorie, also bis zu 25 pro Zielgruppe. Bilder, Titel, Preise und Partnerlinks stammen direkt von Amazon.

Damit der Finder auch bei einer kurzzeitig gedrosselten Schnittstelle sofort funktioniert, enthält `products-data.js` einen am 12. September 2026 über die Creators API geprüften Bestand mit 50 eindeutigen Parent-ASINs: 25 Angebote für Frauen und 25 für Männer. Beim Öffnen versucht die Website lautlos, diesen Bestand über `/api/products` zu aktualisieren, und verwendet bei einem API-Fehler die geprüfte Fassung.

Benötigte serverseitige Vercel-Variablen:

- `AMAZON_CREATORS_CREDENTIAL_ID`
- `AMAZON_CREATORS_CREDENTIAL_SECRET`
- `AMAZON_PARTNER_TAG=Onlinestarkei-21`

Für die Migration eines bestehenden Projekts werden zusätzlich die älteren Variablennamen `AMAZON_CREDENTIAL_ID` und `AMAZON_CREDENTIAL_SECRET` unterstützt. Zugangsdaten bleiben ausschließlich in der Vercel-Umgebung.

## Rechtliches

Impressum und Datenschutz müssen vor dem Geschäftsbetrieb um die echten Betreiberangaben ergänzt werden.
