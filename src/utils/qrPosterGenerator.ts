export interface QrPosterOptions {
  companyName?: string;
  siteName?: string;
  title?: string;
  subtitle?: string;
}

export function generateAndDownloadQrPoster(
  qrSecret: string,
  optionsOrCompany: string | QrPosterOptions = 'Citrine Management'
) {
  try {
    const options: QrPosterOptions =
      typeof optionsOrCompany === 'string'
        ? { companyName: optionsOrCompany }
        : optionsOrCompany;

    const companyName = options.companyName || 'Citrine SARL';
    const siteName = options.siteName || 'Entrée Principale (HQ Siège)';
    const title = options.title || 'BORNE OFFICIELLE DE POINTAGE';
    const subtitle = options.subtitle || 'Scannez ce QR Code à l’arrivée, en pause et au départ.';

    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1000, 1350);

    // Borders (Hero Teal)
    ctx.strokeStyle = '#2A7B76';
    ctx.lineWidth = 10;
    ctx.strokeRect(30, 30, 940, 1290);

    ctx.strokeStyle = '#D4A82F';
    ctx.lineWidth = 3;
    ctx.strokeRect(45, 45, 910, 1260);

    // Header Badge
    ctx.fillStyle = '#E6F4F1';
    ctx.beginPath();
    ctx.roundRect(260, 75, 480, 52, 26);
    ctx.fill();

    ctx.fillStyle = '#2A7B76';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, 500, 108);

    // Company Name
    ctx.fillStyle = '#1C1917';
    ctx.font = 'bold 36px serif';
    ctx.fillText(companyName, 500, 175);

    // Site Name
    ctx.fillStyle = '#2A7B76';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`📍 ${siteName}`, 500, 215);

    ctx.fillStyle = '#78716C';
    ctx.font = '16px sans-serif';
    ctx.fillText(subtitle, 500, 250);

    // Load and draw QR code
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // White container for QR code
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(270, 280, 460, 460);
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 2;
      ctx.strokeRect(270, 280, 460, 460);

      ctx.drawImage(img, 300, 310, 400, 400);

      // Security instructions in correct logical order
      ctx.fillStyle = '#2A7B76';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('INSTRUCTIONS COLLABORATEUR', 500, 785);

      ctx.fillStyle = '#44403C';
      ctx.font = '16px sans-serif';
      ctx.fillText('1. Lancez l’application Citrine SARL sur votre smartphone.', 500, 835);
      ctx.fillText('2. Accédez à l’onglet « Pointage » puis sélectionnez « Scanner QR Code ».', 500, 875);
      ctx.fillText('3. Cadrez ce QR Code officiel avec votre caméra pour valider l’action.', 500, 915);
      ctx.fillText('4. Vérifiez la confirmation instantanée et la mise à jour de votre statut.', 500, 955);

      // Token info block
      ctx.fillStyle = '#F1F5F9';
      ctx.fillRect(150, 1010, 700, 70);
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 1;
      ctx.strokeRect(150, 1010, 700, 70);

      ctx.fillStyle = '#475569';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(`Jeton de Borne : ${qrSecret}`, 500, 1050);

      // Footer
      ctx.fillStyle = '#78716C';
      ctx.font = 'italic 14px sans-serif';
      const todayFormatted = new Date().toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      ctx.fillText(`Affiche générée le ${todayFormatted} - Système Sécurisé Citrine SARL`, 500, 1260);

      const a = document.createElement('a');
      a.download = `Affiche_Pointage_Borne_${companyName.replace(/\s+/g, '_')}_${siteName.replace(/\s+/g, '_')}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrSecret)}`;
  } catch (err) {
    console.error('Erreur lors de la génération de l’affiche:', err);
  }
}
