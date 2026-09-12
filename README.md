# SCHMUCK FINDER

Eigenständige statische Website für schmuck-finder.de. Öffnen Sie `index.html` lokal oder veröffentlichen Sie den Ordner als statische Website.

## Produktdaten

Die Produktkarten verwenden die Amazon Creators API, den offiziellen Nachfolger der eingestellten PA-API 5. Die Vercel-Funktion durchsucht je Zielgruppe fünf Schmuckkategorien, führt Farbvarianten über die Parent-ASIN zusammen und liefert bis zu 50 verfügbare Angebote. Bilder, Titel, Preise und Partnerlinks stammen direkt von Amazon.

Benötigte serverseitige Vercel-Variablen:

- `AMAZON_CREATORS_CREDENTIAL_ID`
- `AMAZON_CREATORS_CREDENTIAL_SECRET`
- `AMAZON_PARTNER_TAG=Onlinestarkei-21`

## Rechtliches

Impressum und Datenschutz müssen vor dem Geschäftsbetrieb um die echten Betreiberangaben ergänzt werden.
