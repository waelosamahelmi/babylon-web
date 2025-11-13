import { useLanguage } from "@/lib/language-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  const { t } = useLanguage();

  const goBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-stone-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button
            onClick={goBack}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("Takaisin", "Back")}
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t("Käyttöehdot", "Terms & Conditions")}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t("Viimeksi päivitetty: 12.6.2024", "Last updated: June 12, 2024")}
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("1. Palvelun käyttö", "1. Service Usage")}</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>
                {t(
                  "Pizzeria Antonion verkkopalvelu on tarkoitettu ruoan tilaamiseen ja pizzerian tietojen katseluun. Käyttämällä palvelua hyväksyt nämä käyttöehdot.",
                  "Pizzeria Antonio's web service is intended for food ordering and viewing restaurant information. By using the service, you accept these terms of use."
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("2. Tilaukset ja maksut", "2. Orders and Payments")}</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>
                {t(
                  "Kaikki tilaukset ovat sitovia. Maksu tapahtuu toimituksen yhteydessä käteisellä tai kortilla. Peruutukset on tehtävä viimeistään 15 minuLahtia tilauksen jälkeen.",
                  "All orders are binding. Payment is made upon delivery with cash or card. Cancellations must be made no later than 15 minutes after ordering."
                )}
              </p>
              <ul>
                <li>{t("Kotiinkuljetus: 0-4 km ilmainen, 4-5 km 4€, 5-8 km 7€, 8-10 km 10€", "Delivery: 0-4 km free, 4-5 km €4, 5-8 km €7, 8-10 km €10")}</li>
                <li>{t("Nouto: Ilmainen", "Pickup: Free")}</li>
                <li>{t("Minimi tilaussumma kotiinkuljetukselle: 15€", "Minimum order for delivery: €15")}</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("3. Toimitus", "3. Delivery")}</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>
                {t(
                  "Toimitusaika on arvio ja voi vaihdella ruuhka-aikoina. Toimitamme Lahden ja lähialueiden alueella. Toimitusmaksut vaihtelevat etäisyyden mukaan.",
                  "Delivery time is an estimate and may vary during peak hours. We deliver in the Lahti and surrounding areas. Delivery fees vary by distance."
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("4. Yksityisyys", "4. Privacy")}</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>
                {t(
                  "Keräämme ainoastaan tilauksiin tarvittavat tiedot. Tietoja ei luovuteta kolmansille osapuolille ilman lupaa. Katso tarkemmat tiedot tietosuojaselosteestamme.",
                  "We collect only the information necessary for orders. Information is not disclosed to third parties without permission. See our privacy policy for details."
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("5. Vastuu", "5. Liability")}</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>
                {t(
                  "Pizzeria Antonio ei vastaa mahdollisista teknisistä ongelmista verkkopalvelussa. Reklamaatiot ruoasta tulee tehdä 24 tunnin sisällä toimituksesta.",
                  "Pizzeria Antonio is not responsible for possible technical problems in the web service. Food complaints must be made within 24 hours of delivery."
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("6. Yhteystiedot", "6. Contact Information")}</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>
                {t(
                  "Kysymykset käyttöehdoista tai palvelusta:",
                  "Questions about terms of use or service:"
                )}
              </p>
              <p>
                <strong>Pizzeria Antonio</strong><br />
                Rauhankatu 19 c, 15110 Lahti<br />
                Puhelin: +35835899089<br />
                Sähköposti: info@pizzeriaantonio.fi
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}