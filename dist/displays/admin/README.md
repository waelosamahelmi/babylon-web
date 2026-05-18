# Babylon TV Display Admin

## Asennus

1. Lataa kaikki tiedostot PHP-palvelimelle (esim. ravintolababylon.fi/displays/)
2. Varmista että PHP on käytössä palvelimella
3. Anna kirjoitusoikeudet `uploads/` ja `config.json` tiedostoille:
   ```
   chmod 755 uploads/
   chmod 644 config.json
   ```

## Tiedostorakenne

```
displays/
├── babylon-ad.html      # TV-näyttö (avaa tämä TV:ssä)
├── admin/
│   ├── index.php        # Hallintapaneeli
│   ├── api.php          # API TV-näytölle
│   ├── config.json      # Asetukset (luodaan automaattisesti)
│   └── uploads/         # Ladatut kuvat
└── README.md
```

## Käyttö

### Hallintapaneeli
Avaa selaimessa: `https://ravintolababylon.fi/displays/admin/`

Oletussalasana: `babylon2024`
**Muista vaihtaa salasana!** (muokkaa index.php tiedostoa)

### TV-näyttö
Avaa TV:n selaimessa: `https://ravintolababylon.fi/displays/babylon-ad.html`

## Toiminnot

### Näyttötilat
- **Vain tarjoukset**: Näyttää vain Supabase-tietokannasta tulevat tarjoukset
- **Vain omat kuvat**: Näyttää vain hallinnasta lisätyt kuvat/slidet
- **Sekoitettu**: Näyttää molemmat vuorotellen

### Slide-tyypit
1. **Kuva** - Yksinkertainen kuva (esim. mainosbanneri)
2. **Tarjous** - Tuote kuvalla, hinnalla ja alennuksella
3. **Mainos** - Tekstipohjainen mainos (esim. "Lounas arkisin!")

### Ajastus
Voit ajastaa slideja näkymään tiettyyn aikaan:
- Aseta alkamisaika ja/tai päättymisaika
- Tyhjät kentät = näkyy aina

## Salasanan vaihto

Avaa `admin/index.php` ja muuta rivi:
```php
$ADMIN_PASSWORD = 'babylon2024';
```

## Huomioita

- TV-näyttö päivittyy automaattisesti 2 minuutin välein
- Kuvat tallennetaan `uploads/` kansioon
- Suositellut kuvaformaatit: JPG, PNG, WebP
- Suositeltu kuvan koko: 1080x1920 px (pystynäyttö)
