import LegalPage from "@/components/LegalPage";

export default function Datenschutz() {
  return (
    <LegalPage title="Datenschutzerklärung">
      <p>Diese Datenschutzerklärung informiert Sie über Art, Umfang und Zweck der Verarbeitung personenbezogener Daten innerhalb unserer App „Spy-Secret" und der zugehörigen Website spy-secret.com. Sie gilt gemäß der Datenschutz-Grundverordnung (DSGVO, Verordnung (EU) 2016/679), dem österreichischen Datenschutzgesetz (DSG) sowie dem Telekommunikationsgesetz 2021 (TKG 2021).</p>

      <h2>1. Verantwortlicher</h2>
      <p>Smart Trading AI GmbH, Franzosenhausweg 41, 4030 Linz, Österreich</p>
      <p>Geschäftsführer: Saifuldeen Alnaseri</p>
      <p>E-Mail: info@spy-secret.com</p>
      <p>Telefon: +43 676 4512064</p>
      <p>Firmenbuchnummer: FN 650520 y</p>
      <p>Firmenbuchgericht: Landesgericht Linz</p>

      <h2>2. Welche Daten wir erheben</h2>

      <h3>2.1 Nutzerkonto (Registrierung &amp; Login)</h3>
      <p>Bei der Registrierung erheben wir: E-Mail-Adresse, ein selbst gewähltes Passwort (verschlüsselt gespeichert via bcrypt) sowie den Zeitpunkt der Registrierung.</p>
      <p>Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).</p>

      <h3>2.2 Instagram-Daten (öffentlich zugänglich)</h3>
      <p>Wenn Sie einen öffentlichen Instagram-Benutzernamen zur Überwachung eingeben, rufen wir über einen Drittanbieter-Dienst (HikerAPI) folgende öffentlich zugängliche Daten ab: Instagram-Benutzername, Instagram-Benutzer-ID, öffentliches Profilbild (URL), Anzahl der Follower und Followings sowie die öffentliche Following- und Follower-Liste.</p>
      <p>Wichtig: Wir erheben KEINE Instagram-Passwörter. Nutzer müssen sich NICHT bei Instagram einloggen. Wir greifen ausschließlich auf öffentlich sichtbare Daten zu. Die Überwachung stoppt automatisch, wenn ein Profil auf privat gestellt wird.</p>
      <p>Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse – der Nutzer hat ein Interesse daran, öffentlich verfügbare Informationen strukturiert aufzubereiten).</p>

      <h3>2.3 Automatisierte Gender-Analyse (Profiling)</h3>
      <p>Spy-Secret führt eine automatisierte Geschlechtsschätzung auf Basis der Vornamen in den Following-Listen durch. Diese Analyse dient ausschließlich der statistischen Aufbereitung (z. B. „55 % weiblich, 45 % männlich"). Es handelt sich um eine Schätzung, nicht um eine gesicherte Bestimmung. Die DSGVO erkennt Geschlecht nicht als besondere Kategorie personenbezogener Daten an (Art. 9 DSGVO).</p>
      <p>Diese Analyse hat keine rechtliche oder ähnlich bedeutsame Wirkung für die betroffenen Personen (Art. 22 Abs. 1 DSGVO findet keine Anwendung). Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).</p>

      <h3>2.4 Zahlungsdaten</h3>
      <p>Zahlungen für Abonnements werden über Apple App Store (In-App-Käufe) und/oder Google Play Store abgewickelt. Wir selbst speichern KEINE Kreditkarten- oder Bankdaten. Die Verwaltung der Abonnements erfolgt über RevenueCat, Inc. (USA). Es gelten die jeweiligen Datenschutzbestimmungen von Apple (apple.com/privacy), Google (policies.google.com/privacy) und RevenueCat (revenuecat.com/privacy).</p>
      <p>Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).</p>

      <h3>2.5 Technische Daten (automatisch)</h3>
      <p>Beim Zugriff auf unsere App/Website werden automatisch erfasst: IP-Adresse (anonymisiert), Gerätetyp und Betriebssystem, App-Version, Zeitpunkt des Zugriffs sowie die aufgerufene Funktion. Diese Daten werden für die Sicherheit und Funktionsfähigkeit der App benötigt. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).</p>

      <h2>3. Zweck der Datenverarbeitung</h2>
      <p>Wir verarbeiten Ihre Daten zu folgenden Zwecken: Bereitstellung und Betrieb der App-Funktionen (Profil-Tracking, Follow-Erkennung, Gender-Analyse), Verwaltung Ihres Nutzerkontos, Abwicklung von Zahlungen und Abonnements, Verbesserung und Weiterentwicklung unserer Dienste, Sicherstellung der IT-Sicherheit und Missbrauchsprävention sowie Erfüllung gesetzlicher Aufbewahrungspflichten.</p>

      <h2>4. Datenweitergabe an Dritte</h2>
      <p>Wir geben personenbezogene Daten nur weiter, soweit dies zur Vertragserfüllung erforderlich ist oder eine gesetzliche Verpflichtung besteht. Folgende Dienstleister werden als Auftragsverarbeiter eingesetzt:</p>
      <ul>
        <li>Supabase, Inc. (USA) – Hosting, Datenbank und Authentifizierung. Supabase verarbeitet Daten auf Servern in der EU (Frankfurt). Datenschutzbestimmungen: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">https://supabase.com/privacy</a></li>
        <li>RevenueCat, Inc. (USA) – Abonnementverwaltung. Datenschutzbestimmungen: <a href="https://www.revenuecat.com/privacy" target="_blank" rel="noopener noreferrer">https://www.revenuecat.com/privacy</a></li>
        <li>Resend, Inc. (USA) – Transaktionale E-Mails (Bestätigungen, Passwortzurücksetzung). Datenschutzbestimmungen: <a href="https://resend.com/privacy" target="_blank" rel="noopener noreferrer">https://resend.com/privacy</a></li>
        <li>HikerAPI – Abruf öffentlich zugänglicher Instagram-Daten. Es werden keine personenbezogenen Daten unserer Nutzer an HikerAPI übermittelt, lediglich öffentliche Instagram-Benutzernamen.</li>
      </ul>
      <p>Für Datenübermittlungen in die USA stützen wir uns auf EU-Standardvertragsklauseln gemäß Art. 46 Abs. 2 lit. c DSGVO und/oder den Angemessenheitsbeschluss der EU-Kommission gemäß dem EU-U.S. Data Privacy Framework, soweit die jeweiligen Empfänger zertifiziert sind.</p>

      <h2>5. Speicherdauer</h2>
      <p>Kontodaten werden gespeichert, solange Ihr Konto aktiv ist, und nach Löschung des Kontos innerhalb von 30 Tagen vollständig entfernt. Follow-Events und Snapshots werden maximal 12 Monate aufbewahrt; ältere Daten werden automatisch gelöscht. Zahlungsdaten bei Apple/Google werden gemäß den gesetzlichen Aufbewahrungsfristen (7 Jahre gemäß BAO) gespeichert. Technische Logdaten werden nach 90 Tagen gelöscht.</p>

      <h2>6. Ihre Rechte</h2>
      <p>Sie haben gemäß DSGVO folgende Rechte:</p>
      <ul>
        <li>Recht auf Auskunft (Art. 15 DSGVO) – Sie können jederzeit Auskunft über die bei uns gespeicherten Daten verlangen.</li>
        <li>Recht auf Berichtigung (Art. 16 DSGVO) – Unrichtige Daten werden auf Ihre Anfrage korrigiert.</li>
        <li>Recht auf Löschung (Art. 17 DSGVO) – Sie können die Löschung Ihrer Daten verlangen, sofern keine gesetzlichen Aufbewahrungspflichten bestehen.</li>
        <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO).</li>
        <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO) – Sie erhalten Ihre Daten in einem maschinenlesbaren Format.</li>
        <li>Widerspruchsrecht (Art. 21 DSGVO) – Sie können der Verarbeitung Ihrer Daten jederzeit widersprechen, insbesondere gegen das Profiling gemäß Abschnitt 2.3.</li>
      </ul>
      <p>Zur Ausübung Ihrer Rechte kontaktieren Sie uns unter: info@spy-secret.com</p>
      <p>Sie haben zudem das Recht, eine Beschwerde bei der zuständigen Aufsichtsbehörde einzureichen: Österreichische Datenschutzbehörde, Barichgasse 40-42, 1030 Wien, dsb@dsb.gv.at, <a href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer">https://www.dsb.gv.at</a></p>

      <h2>7. Rechte betroffener Instagram-Nutzer</h2>
      <p>Auch Personen, deren öffentliche Instagram-Profile durch unsere Nutzer überwacht werden, haben Rechte gemäß DSGVO. Wenn Sie feststellen, dass Ihr Instagram-Profil über Spy-Secret getrackt wird, können Sie uns unter info@spy-secret.com kontaktieren und die Löschung aller zu Ihrem Profil gespeicherten Daten verlangen. Wir werden diesem Antrag innerhalb von 30 Tagen nachkommen.</p>
      <p>Alternativ können Sie Ihr Instagram-Profil auf „privat" stellen – die Überwachung wird dann automatisch eingestellt.</p>

      <h2>8. Cookies und lokale Speicherung</h2>
      <p>Unsere App verwendet ausschließlich technisch notwendige Cookies und lokale Speichermechanismen (z. B. für Authentifizierung und Sitzungsverwaltung). Es werden KEINE Tracking-Cookies, Werbe-Cookies oder Analytics-Cookies von Drittanbietern eingesetzt. Eine Einwilligung ist für technisch notwendige Cookies nicht erforderlich (§ 165 Abs. 3 TKG 2021).</p>

      <h2>9. Datensicherheit</h2>
      <p>Wir setzen technische und organisatorische Maßnahmen zum Schutz Ihrer Daten ein: Verschlüsselte Übertragung via HTTPS/TLS, verschlüsselte Speicherung von Passwörtern (bcrypt), Zugriffskontrolle durch Row-Level-Security (RLS) in der Datenbank, regelmäßige Sicherheitsupdates sowie Trennung von Nutzer- und Anwendungsdaten.</p>

      <h2>10. Nutzung durch Minderjährige</h2>
      <p>Unsere App richtet sich an Personen ab 16 Jahren. Personen unter 16 Jahren dürfen die App nur mit Zustimmung eines Erziehungsberechtigten nutzen (Art. 8 DSGVO, § 4 Abs. 4 DSG). Wenn wir feststellen, dass personenbezogene Daten von Personen unter 16 Jahren ohne die erforderliche Einwilligung erhoben wurden, werden diese Daten umgehend gelöscht.</p>

      <h2>11. Änderungen dieser Datenschutzerklärung</h2>
      <p>Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf anzupassen. Die aktuelle Version finden Sie stets in der App und auf spy-secret.com. Bei wesentlichen Änderungen werden Sie per E-Mail informiert.</p>

      <p className="mt-6 text-muted-foreground">Stand: Februar 2026</p>
    </LegalPage>
  );
}
