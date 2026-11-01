import fs from 'fs';
import path from 'path';
import { getCollectionData } from '../db/repository';
import { sendThreadedEmployeeEmail, parseEmailList } from './serverMailService';
import { getDoualaDateInfo } from './timesheetReportService';

export interface MondayGreetingOptions {
  testRecipient?: string;
  forceMonday?: boolean;
  specificEmployeeId?: string | number;
}

export interface MondayGreetingResult {
  success: boolean;
  message: string;
  sentCount: number;
  recipientEmails: string[];
  errors: string[];
  timestamp: string;
}

/**
 * Liste des 20 proverbes & pensées cools pour le lundi matin.
 * Chaque semaine, un proverbe différent est pioché en rotation automatique selon le numéro de semaine.
 */
export const COOL_MONDAY_QUOTES = [
  "« Nouveau lundi, nouvelles opportunités ! On laisse les excuses au week-end et on démarre en beauté. 😎 »",

  "« Le lundi n'est pas ton ennemi, c'est juste le bouton RESET de tes ambitions. Bonne semaine ! 🚀 »",

  "« Pas besoin d'être parfait dès lundi. Juste d'être prêt à donner le meilleur de soi. 💪 »",

  "« Un lundi avec le sourire, une équipe au top et des objectifs en ligne de mire… Ça sent la belle semaine ! 🔥 »",

  "« Les grandes choses commencent souvent par un simple lundi. Alors, autant bien commencer ! 😉 »",

  "« Ton café est prêt, tes idées aussi ? Alors, il ne manque plus que toi pour faire de cette semaine une réussite ! ☕ »",

  "« On ne cherche pas à faire des miracles en une journée. On avance, on apprend et on fait mieux chaque jour ! 🌱 »",

  "« La bonne humeur est contagieuse. Aujourd'hui, soyons tous des porteurs de bonnes nouvelles ! 😁 »",

  "« Nouvelle semaine, même équipe, encore plus d'idées et toujours cette envie de faire la différence ! ✨ »",

  "« Petit rappel du lundi : tu es capable de plus que tu ne le penses. Alors, montre à cette semaine de quoi tu es capable ! 💥 »",

  "« Les objectifs ne vont pas s'atteindre tout seuls… Mais avec une bonne équipe, ça devient tout de suite plus sympa ! 🤝 »",

  "« On ne contrôle pas toujours le programme de la semaine, mais on peut toujours choisir son état d'esprit. 😉 »",

  "« Que cette semaine soit remplie de bonnes idées, de petites victoires et de grandes raisons de sourire ! 🌟 »",

  "« Pas de pression inutile : on respire, on s'organise et on avance. Chaque chose en son temps ! 😌 »",

  "« Le meilleur moment pour faire bouger les choses ? Ce lundi. La meilleure équipe pour le faire ? La nôtre ! 🚀 »",

  "« Le lundi est arrivé… On fait comme si on l'attendait avec impatience ! 😂 »",

  "« Les batteries sont chargées ? Les objectifs sont prêts ? Alors, que la semaine commence ! ⚡ »",

  "« On ne demande pas une semaine parfaite, juste une équipe qui se serre les coudes et qui avance ensemble. ❤️ »",

  "« Objectif de la semaine : faire du bon travail, garder le sourire et ne pas oublier de respirer ! 😅 »",

  "« Une nouvelle semaine, c'est 5 nouvelles occasions de faire la différence. À nous de jouer ! 🎯 »",
];


/**
 * Sélectionne aléatoirement une citation parmi les 10 citations
 * disponibles pour le mail du lundi.
 *
 * @returns La citation sélectionnée et son index (à partir de 1).
 */
export function getWeeklyCoolQuote(): { quote: string; index: number } {
  const totalQuotes = COOL_MONDAY_QUOTES.length;

  if (totalQuotes === 0) {
    return { quote: "", index: 0 };
  }

  const quoteIndex = Math.floor(Math.random() * totalQuotes);

  return {
    quote: COOL_MONDAY_QUOTES[quoteIndex],
    index: quoteIndex + 1,
  };
}


/**
 * Extrait le prénom à partir du nom complet de l'employé.
 * Règle demandée : prendre à partir du deuxième mot (puisque le premier mot est le nom de famille).
 * Si un seul mot existe, on prend ce mot en repli.
 */
export function extractFirstName(fullName?: string): string {
  if (!fullName) return "l'équipe";
  const clean = fullName.trim();
  const parts = clean.split(/\s+/);
  if (parts.length > 1) {
    // Prend à partir du deuxième mot
    return parts.slice(1).join(' ');
  }
  return parts[0] || "l'équipe";
}

/**
 * Lit l'illustration Humaans locale et la renvoie sous forme de Buffer
 */
export function getHumaansImageAttachment(): {
  filename: string;
  content: Buffer;
  contentType: string;
  cid: string;
} | null {
  try {
    const candidatePaths = [
      path.join(process.cwd(), 'public', 'assets', 'humaans_monday.jpg'),
      path.join(process.cwd(), 'src', 'assets', 'humaans_monday.jpg'),
      path.join(process.cwd(), 'dist', 'assets', 'humaans_monday.jpg'),
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        const fileBuf = fs.readFileSync(p);
        return {
          filename: 'humaans_monday.jpg',
          content: fileBuf,
          contentType: 'image/jpeg',
          cid: 'humaans_monday',
        };
      }
    }
  } catch (err) {
    console.warn('[Monday Greeting] Impossible de charger l\'image Humaans locale:', err);
  }
  return null;
}

/**
 * Construit un e-mail de "Bon début de semaine" d'un niveau esthétique haut de gamme,
 * respectant la charte Material Design 3, intégrant l'illustration Humaans,
 * avec le texte convivial exact et les 3 clés chaleureuses.
 */
export function buildMondayGreetingHtml(options: {
  employeeName: string;
  dateStr?: string;
  quote?: string;
  appUrl?: string;
}): string {
  const firstName = extractFirstName(options.employeeName);
  const doualaTime = getDoualaDateInfo();
  const dateDisplay = options.dateStr || doualaTime.dateOnly;
  const quote = options.quote || getWeeklyCoolQuote().quote;
  const appUrl = options.appUrl || 'https://citrine-management.vercel.app';

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bon début de semaine — Citrine Mobilité</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 32px 14px;">
    <tr>
      <td align="center">
        
        <!-- Conteneur Carte Material Design 3 -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 28px; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;" cellspacing="0" cellpadding="0">
          
          <!-- En-tête Supérieur Material You (Gradient Teal & Emerald) -->
          <tr>
            <td style="background: linear-gradient(135deg, #004D40 0%, #00695C 60%, #00897B 100%); padding: 32px 36px 24px 36px; text-align: left; position: relative;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <!-- Pill Badge Material 3 -->
                    <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.16); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.28); color: #E0F2F1; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 5px 14px; border-radius: 20px; margin-bottom: 12px;">
                      Bon début de semaine
                    </div>
                    <div style="font-family: Georgia, serif; font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: 0.5px; line-height: 1.2;">
                      CITRINE MOBILITÉ
                    </div>
                    <div style="font-size: 13px; color: #A7F3D0; font-weight: 500; margin-top: 4px;">
                      Lundi ${dateDisplay} · Douala, Cameroun
                    </div>
                  </td>
                  <td align="right" valign="top">
                    <!-- Cercle décoratif Material -->
                    <div style="width: 48px; height: 48px; background-color: rgba(255, 255, 255, 0.14); border-radius: 50%; text-align: center; line-height: 48px; font-size: 22px;">
                      ☕
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bloc Illustration Humaans avec Halo Doux -->
          <tr>
            <td align="center" style="padding: 26px 36px 12px 36px; background-color: #ffffff;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <div style="background: radial-gradient(circle, #E0F2F1 0%, #ffffff 70%); border-radius: 24px; padding: 12px; display: inline-block;">
                      <img src="cid:humaans_monday" alt="Personnage Humaans vous souhaitant un bon lundi" width="260" height="260" style="display: block; max-width: 260px; width: 100%; height: auto; border-radius: 18px; box-shadow: 0 8px 24px rgba(0, 105, 92, 0.12); border: 2px solid #ffffff;" />
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Message Chaleureux Exact & Personnalisé (Prénom à partir du 2e mot) -->
          <tr>
            <td style="padding: 16px 36px 24px 36px; text-align: left;">
              
              <!-- Salutation avec prénom -->
              <h1 style="font-size: 26px; font-weight: 900; color: #0F172A; margin: 0 0 16px 0; line-height: 1.25;">
                Hello ${firstName} !
              </h1>

              <p style="font-size: 15.5px; color: #1e293b; line-height: 1.6; margin: 0 0 14px 0; font-weight: 600;">
                Un nouveau lundi, une nouvelle semaine et plein de belles choses à accomplir ! 😎
              </p>

              <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 14px 0;">
                On espère que tu es prêt(e) à attaquer cette semaine avec le plein d'énergie, de motivation et de bonne humeur.
              </p>

              <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 20px 0;">
                Que les idées fusent, que les objectifs avancent et que les petites victoires s'enchaînent ! 🚀
              </p>

              <!-- Bannière verte de réussite Citrine -->
              <div style="background-color: #E0F2F1; border: 1.5px solid #80CBC4; border-radius: 14px; padding: 14px 20px; margin-bottom: 24px; text-align: center;">
                <span style="font-size: 15.5px; font-weight: 800; color: #004D40;">
                  On se souhaite une belle semaine de réussite chez Citrine Mobilité ! 💚
                </span>
              </div>

              <!-- Carte Proverbe Cool de la Semaine (Rotation parmi 10 proverbes cools) -->
              <div style="background-color: #FFFBEB; border-left: 4px solid #F59E0B; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.08);">
                <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #B45309; margin-bottom: 5px;">
                  Il faut garder en tete que:
                </div>
                <div style="font-size: 14px; font-style: italic; color: #78350F; line-height: 1.5; font-weight: 600;">
                  ${quote}
                </div>
              </div>

              <!-- 3 Clés Amicales pour la semaine -->
              <div style="margin-bottom: 26px;">
                <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #004D40; margin-bottom: 12px;">
                  3 petits tips bienveillants pour une semaine au top :
                </div>

                <!-- Clé 1 : Priorités au calme -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 12px 16px; margin-bottom: 10px;">
                  <tr>
                    <td width="36" valign="top" style="font-size: 20px;">🎯</td>
                    <td style="font-size: 13.5px; color: #1E293B; line-height: 1.45;">
                      <strong style="color: #00695C;">On pose les priorités au calme :</strong> Un pas après l'autre ! Commence par les 2 ou 3 dossiers qui comptent le plus, avance à ton rythme et valide tes étapes sans stress.
                    </td>
                  </tr>
                </table>

                <!-- Clé 2 : Entraide & Bonne humeur -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 12px 16px; margin-bottom: 10px;">
                  <tr>
                    <td width="36" valign="top" style="font-size: 20px;">🤝</td>
                    <td style="font-size: 13.5px; color: #1E293B; line-height: 1.45;">
                      <strong style="color: #00695C;">L'esprit d'équipe avant tout :</strong> Une question, un petit blocage ou une bonne idée ? N'hésite pas à échanger, on est toute une équipe prête à s'épauler avec le sourire !
                    </td>
                  </tr>
                </table>

                <!-- Clé 3 : Énergie & Pause sacrée -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 12px 16px;">
                  <tr>
                    <td width="36" valign="top" style="font-size: 20px;">⚡</td>
                    <td style="font-size: 13.5px; color: #1E293B; line-height: 1.45;">
                      <strong style="color: #00695C;">Prends soin de ton énergie :</strong> On démarre motivés dès 08h00, et à midi, pause déjeuner sacrée pour recharger les batteries, déconnecter et souffler !
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Bouton d'action Material You vers https://citrine-management.vercel.app -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 10px 0 16px 0;">
                    <a href="${appUrl}" target="_blank" style="display: inline-block; background-color: #00796B; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 34px; border-radius: 28px; box-shadow: 0 4px 14px rgba(0, 121, 107, 0.35); letter-spacing: 0.3px;">
                      🚀 Ouvrir mon espace Citrine
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Pied de page Material Design 3 (Subtle Neutral) -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 22px 36px; text-align: center;">
              <p style="margin: 0; font-size: 12px; font-weight: 700; color: #004D40;">
                CITRINE MOBILITÉ · DIRECTION DES RESSOURCES HUMAINES
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Envoie l'e-mail de bon début de semaine à tous les collaborateurs de l'entreprise.
 * Si testRecipient est spécifié, n'envoie qu'à cette adresse de test.
 */
export async function sendMondayGreetingToAllEmployees(options?: MondayGreetingOptions): Promise<MondayGreetingResult> {
  const doualaTime = getDoualaDateInfo();
  const errors: string[] = [];
  const recipientEmails: string[] = [];
  let sentCount = 0;

  // 1. Vérification du jour (Lundi uniquement, sauf si forceMonday: true)
  const now = new Date();
  const weekdayName = new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Douala', weekday: 'long' }).format(now).toLowerCase();
  const isMonday = weekdayName === 'monday';

  if (!isMonday && !options?.forceMonday) {
    const skipMsg = `⏸️ [GREETING LUNDI] Envoi ignoré : nous sommes ${weekdayName} et le message de bon début de semaine est programmé chaque lundi à 08h00.`;
    console.log(skipMsg);
    return {
      success: true,
      message: skipMsg,
      sentCount: 0,
      recipientEmails: [],
      errors: [],
      timestamp: doualaTime.fullDateStr,
    };
  }

  console.log(`🌅 [GREETING LUNDI 08:00] Démarrage de l'envoi du message de bon début de semaine (${doualaTime.fullDateStr})...`);

  try {
    const humaansAttachment = getHumaansImageAttachment();
    const attachments = humaansAttachment ? [humaansAttachment] : [];
    const coolQuote = getWeeklyCoolQuote();
    const appUrl = 'https://citrine-management.vercel.app';

    // CAS 1 : Envoi de test vers un destinataire unique (ex: test de connexion SMTP ou test manuel)
    if (options?.testRecipient && options.testRecipient.trim()) {
      const targetEmails = parseEmailList(options.testRecipient);
      if (targetEmails.length === 0) {
        return {
          success: false,
          message: "Adresse e-mail destinataire invalide.",
          sentCount: 0,
          recipientEmails: [],
          errors: ["Adresse e-mail destinataire invalide"],
          timestamp: doualaTime.fullDateStr,
        };
      }

      // Pour le test : on prend "Équipe Citrine" -> prénom "Citrine"
      const testEmployeeName = "Équipe Citrine";
      const testFirstName = extractFirstName(testEmployeeName);

      const htmlContent = buildMondayGreetingHtml({
        employeeName: testEmployeeName,
        dateStr: doualaTime.dateOnly,
        quote: coolQuote.quote,
        appUrl,
      });

      console.log(`✉️ [GREETING LUNDI TEST] Envoi du mail de bonjour vers : ${targetEmails.join(', ')}...`);

      const result = await sendThreadedEmployeeEmail({
        employeeName: testEmployeeName,
        employeeId: "greeting-test",
        eventTitle: "Bon début de semaine — Citrine Mobilité",
        threadCategory: "greeting",
        threadSubject: `Hello ${testFirstName} ! Bon début de semaine chez Citrine Mobilité`,
        htmlContent,
        attachments,
        overrideRecipients: targetEmails,
        recipientEmails: targetEmails,
      });

      if (!result.success) {
        return {
          success: false,
          message: `Échec d'envoi du message de bonjour : ${result.error}`,
          sentCount: 0,
          recipientEmails: targetEmails,
          errors: [result.error || 'Erreur inconnue'],
          timestamp: doualaTime.fullDateStr,
        };
      }

      return {
        success: true,
        message: `Message de bon début de semaine envoyé avec succès à ${targetEmails.join(', ')}.`,
        sentCount: 1,
        recipientEmails: targetEmails,
        errors: [],
        timestamp: doualaTime.fullDateStr,
      };
    }

    // CAS 2 : Envoi officiel à tous les collaborateurs actifs
    const employees = await getCollectionData('employees');

    // Filtrer les employés actifs avec une adresse e-mail valide
    const activeEmployees = employees.filter((emp: any) => {
      const status = String(emp.status || emp.employmentStatus || '').toLowerCase();
      if (status === 'archived' || status === 'inactif' || status === 'inactive' || status === 'parti') {
        return false;
      }
      return Boolean(emp.email && emp.email.includes('@'));
    });

    if (activeEmployees.length === 0) {
      console.warn("⚠️ [GREETING LUNDI] Aucun collaborateur avec e-mail valide trouvé.");
      return {
        success: true,
        message: "Aucun collaborateur éligible trouvé.",
        sentCount: 0,
        recipientEmails: [],
        errors: [],
        timestamp: doualaTime.fullDateStr,
      };
    }

    console.log(`🚀 [GREETING LUNDI] Envoi personnalisé à ${activeEmployees.length} collaborateur(s)...`);

    for (const emp of activeEmployees) {
      const empName = emp.name || 'Collaborateur';
      const empEmail = emp.email?.trim();
      const empId = emp.id;

      if (!empEmail) continue;

      const empFirstName = extractFirstName(empName);

      try {
        const htmlContent = buildMondayGreetingHtml({
          employeeName: empName,
          dateStr: doualaTime.dateOnly,
          quote: coolQuote.quote,
          appUrl,
        });

        await sendThreadedEmployeeEmail({
          employeeName: empName,
          employeeId: empId,
          employeeEmail: empEmail,
          eventTitle: "Bon début de semaine — Citrine Mobilité",
          threadCategory: "greeting",
          threadSubject: `Hello ${empFirstName} ! Bon début de semaine chez Citrine Mobilité`,
          htmlContent,
          attachments,
          overrideRecipients: [empEmail],
          recipientEmails: [empEmail],
        });

        sentCount++;
        recipientEmails.push(empEmail);
        console.log(`✓ [GREETING LUNDI] E-mail transmis à ${empName} (Prénom: ${empFirstName}, Email: ${empEmail})`);
      } catch (err: any) {
        const msg = `Erreur pour ${empName} (${empEmail}) : ${err?.message || err}`;
        console.error(`❌ [GREETING LUNDI Error]:`, msg);
        errors.push(msg);
      }
    }

    const summaryMsg = `Message de bon début de semaine envoyé avec succès à ${sentCount}/${activeEmployees.length} collaborateurs.`;
    console.log(`✅ [GREETING LUNDI 08:00 TERMINÉ] ${summaryMsg}`);

    return {
      success: errors.length === 0 || sentCount > 0,
      message: summaryMsg,
      sentCount,
      recipientEmails,
      errors,
      timestamp: doualaTime.fullDateStr,
    };
  } catch (globalErr: any) {
    const rawError = globalErr?.message || String(globalErr);
    console.error("💥 [GREETING LUNDI FATAL ERROR]:", globalErr);
    return {
      success: false,
      message: `Erreur générale lors de l'envoi du message de bon début de semaine : ${rawError}`,
      sentCount,
      recipientEmails,
      errors: [rawError],
      timestamp: doualaTime.fullDateStr,
    };
  }
}
