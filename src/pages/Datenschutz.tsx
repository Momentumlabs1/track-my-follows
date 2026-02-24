import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Datenschutz() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="flex items-center px-4 pt-4 pb-2">
        <button onClick={() => navigate(-1)} className="p-2 -ms-2 text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
        </button>
        <h1 className="text-lg font-extrabold ms-2">{t("settings.privacy")}</h1>
      </div>

      <div className="px-6 py-4 space-y-6 text-[13px] text-muted-foreground leading-relaxed">
        <h2 className="text-base font-extrabold text-foreground">{t("settings.privacy")}</h2>

        <section>
          <h3 className="font-bold text-foreground mb-1">1. Verantwortlicher</h3>
          <p>SmartTradingAI e.U., [Adresse], Österreich</p>
          <p>E-Mail: datenschutz@smarttradingai.com</p>
        </section>

        <section>
          <h3 className="font-bold text-foreground mb-1">2. Erhobene Daten</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>E-Mail-Adresse (bei Registrierung)</li>
            <li>Instagram-Usernames die Sie tracken möchten (öffentlich verfügbare Daten)</li>
            <li>Nutzungsdaten (Zeitpunkt der Nutzung, verwendete Funktionen)</li>
          </ul>
        </section>

        <section>
          <h3 className="font-bold text-foreground mb-1">3. Zweck der Verarbeitung</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Bereitstellung des Dienstes (Tracking öffentlicher Instagram-Daten)</li>
            <li>Kontoverwaltung und Authentifizierung</li>
            <li>Zahlungsabwicklung über Apple/Google (via RevenueCat)</li>
          </ul>
        </section>

        <section>
          <h3 className="font-bold text-foreground mb-1">4. Rechtsgrundlage</h3>
          <p>Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)</p>
        </section>

        <section>
          <h3 className="font-bold text-foreground mb-1">5. Speicherdauer</h3>
          <p>Daten werden gelöscht wenn Sie Ihr Konto löschen.</p>
        </section>

        <section>
          <h3 className="font-bold text-foreground mb-1">6. Ihre Rechte</h3>
          <p>Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch.</p>
        </section>

        <section>
          <h3 className="font-bold text-foreground mb-1">7. Kontakt</h3>
          <p>datenschutz@smarttradingai.com</p>
        </section>

        <section>
          <h3 className="font-bold text-foreground mb-1">8. Drittanbieter</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Supabase (Datenbank, EU-Server)</li>
            <li>HikerAPI (Instagram-Daten)</li>
            <li>RevenueCat (Zahlungsabwicklung)</li>
            <li>OneSignal (Push Notifications)</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
