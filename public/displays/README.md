# Babylon näyttömenut — uusi menu (PDF tammikuu 2026)

## Mitä tämä on
Kolme staattista näyttösivua, jotka korvaavat vanhat:
- **menu1.html** — Pizzat, osa 1 (Buffalo margarita, Bresaola, Smoked salmon, Super supreme, Juusto)
- **menu2.html** — Pizzat, osa 2 (Joe's, Piccolo mondo, Lucca, Americano, Babylon)
- **menu3.html** — Kokoa oma pizzasi, kebabit & annokset, sipit, burgerit, täytteet

Jaetut tiedostot: `menu-data.js` (kaikki tuotteet ja hinnat yhdessä paikassa),
`display.css`, `display.js`, `images/` (pizzakuvat PDF:stä + logo).

## Julkaisu
Lataa **koko kansion sisältö** palvelimen `/displays/`-hakemistoon niin, että
`menu1.html`, `menu2.html` ja `menu3.html` korvaavat vanhat tiedostot ja
`images/`, `menu-data.js`, `display.css`, `display.js` ovat samassa hakemistossa.
Näytöt osoittavat jo näihin URL-osoitteisiin, joten mitään muuta ei tarvitse muuttaa.

## Ominaisuudet
- Skaalautuu automaattisesti mihin tahansa TV-resoluutioon (suunniteltu 1280×720, toimii 4K:ssa)
- Kello päivittyy reaaliajassa
- Sivu lataa itsensä uudelleen joka yö klo 04.00 → hintamuutokset `menu-data.js`-tiedostoon
  näkyvät näytöillä viimeistään seuraavana aamuna
- Ei backendia, ei riippuvuuksia — pelkkiä staattisia tiedostoja

## Hintojen muokkaus jatkossa
Kaikki tuotteet ja hinnat ovat **yhdessä tiedostossa**: `menu-data.js`.
Muokkaa sitä ja lataa palvelimelle — kaikki kolme näyttöä päivittyvät.

## Tarkista ennen julkaisua (tärkeää)
Tekstit ja hinnat on litteroitu PDF:stä ja tarkistettu sivu sivulta, mutta tarkista
hinnat vielä kerran PDF:ää vasten ennen julkaisua — näytöllä oleva väärä hinta on
ikävä yllätys kassalla. Vertailua varten mukana on `pdf-sivut/`-kansio, jossa
jokainen PDF-sivu kuvana.

Kirjoitusasut on normalisoitu suomen kielen mukaisiksi
(PDF:ssä esim. "Tomatti" → "tomaatti", "salatti" → "salaatti", "olivi/paprikka" jätetty
Super supremen kuvaukseen sellaisenaan — muuta halutessasi `menu-data.js`:ssä).
