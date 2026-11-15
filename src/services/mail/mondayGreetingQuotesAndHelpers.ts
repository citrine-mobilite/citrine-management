import fs from 'fs';
import path from 'path';

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

export function getWeeklyCoolQuote(): { quote: string; index: number } {
  const totalQuotes = COOL_MONDAY_QUOTES.length;
  if (totalQuotes === 0) {
    return { quote: '', index: 0 };
  }
  const quoteIndex = Math.floor(Math.random() * totalQuotes);
  return {
    quote: COOL_MONDAY_QUOTES[quoteIndex],
    index: quoteIndex + 1,
  };
}

export function extractFirstName(fullName?: string): string {
  if (!fullName) return "l'équipe";
  const clean = fullName.trim();
  const parts = clean.split(/\s+/);
  if (parts.length > 1) {
    return parts.slice(1).join(' ');
  }
  return parts[0] || "l'équipe";
}

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
    console.warn("[Monday Greeting] Impossible de charger l'image Humaans locale:", err);
  }
  return null;
}
