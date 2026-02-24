import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Impressum() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center px-4 pt-4 pb-2">
        <button onClick={() => navigate(-1)} className="p-2 -ms-2 text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
        </button>
        <h1 className="text-lg font-extrabold ms-2">{t("settings.impressum")}</h1>
      </div>

      <div className="px-6 py-4 space-y-4 text-[13px] text-muted-foreground leading-relaxed">
        <div>
          <p className="font-bold text-foreground">SmartTradingAI e.U.</p>
          <p>Inhaber: Diego [Nachname]</p>
          <p>[Adresse]</p>
          <p>Österreich</p>
        </div>
        <div>
          <p>Firmenbuchnummer: [PLATZHALTER]</p>
          <p>UID-Nummer: [PLATZHALTER]</p>
          <p>E-Mail: kontakt@smarttradingai.com</p>
        </div>
        <div>
          <p>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:</p>
          <p>Diego [Nachname]</p>
        </div>
      </div>
    </div>
  );
}
