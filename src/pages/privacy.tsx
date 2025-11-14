import { useLanguage } from "@/lib/language-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Eye, Lock, Database } from "lucide-react";

export default function Privacy() {
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
          
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t("Tietosuojaseloste", "Privacy Policy")}
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            {t("GDPR-yhteensopiva | Viimeksi päivitetty: 12.6.2024", "GDPR Compliant | Last updated: June 12, 2024")}
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-blue-600" />
                <span>{t("1. Mitä tietoja keräämme", "1. What Information We Collect")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>
                {t(
                  "Keräämme ainoastaan tilauksiin välttämättömät tiedot:",
                  "We collect only information necessary for orders:"
                )}
              </p>
              <ul>
                <li>{t("Nimi ja puhelinnumero (pakollinen)", "Name and phone number (required)")}</li>
                <li>{t("Sähköpostiosoite (valinnainen)", "Email address (optional)")}</li>
                <li>{t("Toimitusosoite (kotiinkuljetuksessa)", "Delivery address (for delivery)")}</li>
                <li>{t("Tilaushistoria ja mieltymykset", "Order history and preferences")}</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-green-600" />
                <span>{t("2. Miten käytämme tietoja", "2. How We Use Information")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>
                {t(
                  "Käytämme tietojasi ainoastaan seuraaviin tarkoituksiin:",
                  "We use your information only for the following purposes:"
                )}
              </p>
              <ul>
                <li>{t("Tilausten käsittely ja toimitus", "Order processing and delivery")}</li>
                <li>{t("Asiakaspalvelu ja yhteydenotto", "Customer service and communication")}</li>
                <li>{t("Palvelun parantaminen", "Service improvement")}</li>
                <li>{t("Lakisääteiset velvoitteet", "Legal obligations")}</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-red-600" />
                <span>{t("3. Tietoturva", "3. Data Security")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>
                {t(
                  "Suojaamme tietojasi nykyaikaisilla tietoturvamenetelmillä:",
                  "We protect your information with modern security methods:"
                )}
              </p>
              <ul>
                <li>{t("SSL-salaus kaikessa tiedonsiirrossa", "SSL encryption in all data transmission")}</li>
                <li>{t("Tietojen säilytys turvallisilla palvelimilla", "Data storage on secure servers")}</li>
                <li>{t("Pääsy rajoitettu valtuutettulle henkilöstölle", "Access limited to authorized personnel")}</li>
                <li>{t("Säännölliset tietoturva-auditoinnit", "Regular security audits")}</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("4. Evästeet (Cookies)", "4. Cookies")}</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>
                {t(
                  "Käytämme evästeitä palvelun toimivuuden varmistamiseksi:",
                  "We use cookies to ensure service functionality:"
                )}
              </p>
              <ul>
                <li>{t("Ostoskorin sisältö", "Shopping cart contents")}</li>
                <li>{t("Kieliasetukset", "Language preferences")}</li>
                <li>{t("Teema-asetukset (tumma/vaalea)", "Theme settings (dark/light)")}</li>
                <li>{t("Sisäänkirjautumisen muistaminen", "Login persistence")}</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("5. Oikeutesi", "5. Your Rights")}</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>
                {t(
                  "GDPR:n mukaisesti sinulla on seuraavat oikeudet:",
                  "According to GDPR, you have the following rights:"
                )}
              </p>
              <ul>
                <li>{t("Oikeus tietojen tarkastamiseen", "Right to access your data")}</li>
                <li>{t("Oikeus tietojen oikaisemiseen", "Right to rectify your data")}</li>
                <li>{t("Oikeus tietojen poistamiseen", "Right to erasure")}</li>
                <li>{t("Oikeus käsittelyn rajoittamiseen", "Right to restrict processing")}</li>
                <li>{t("Oikeus tietojen siirtämiseen", "Right to data portability")}</li>
                <li>{t("Oikeus vastustaa käsittelyä", "Right to object to processing")}</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("6. Tietojen säilytys", "6. Data Retention")}</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>
                {t(
                  "Säilytämme tietojasi ainoastaan niin kauan kuin on tarpeen:",
                  "We retain your information only as long as necessary:"
                )}
              </p>
              <ul>
                <li>{t("Tilaushistoria: 3 vuotta", "Order history: 3 years")}</li>
                <li>{t("Asiakastiedot: Kunnes pyydät poistamista", "Customer data: Until you request deletion")}</li>
                <li>{t("Markkinointilupa: Kunnes peruutat", "Marketing consent: Until you withdraw")}</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("7. Yhteystiedot", "7. Contact Information")}</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>
                {t(
                  "Tietosuojaan liittyvissä kysymyksissä ota yhteyttä:",
                  "For privacy-related questions, contact:"
                )}
              </p>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mt-4">
                <p>
                  <strong>Tietosuojavastaava / Data Protection Officer</strong><br />
                  Ravintola Babylon<br />
                  Vapaudenkatu 28, 15140 Lahti<br />
                  Sähköposti: info@ravintolababylon.fi<br />
                  Puhelin: +35835899089
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}