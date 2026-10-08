export function generateAndDownloadQrPoster(qrSecret: string, companyName: string = 'Citrine Management') {
  try {
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
    ctx.roundRect(300, 80, 400, 50, 25);
    ctx.fill();

    ctx.fillStyle = '#2A7B76';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('POINTAGE SÉCURISÉ EN DIRECT', 500, 112);

    // Company Name
    ctx.fillStyle = '#1C1917';
    ctx.font = 'bold 36px serif';
    ctx.fillText(companyName, 500, 180);

    ctx.fillStyle = '#78716C';
    ctx.font = '18px sans-serif';
    ctx.fillText('Scannez ce QR Code à l’arrivée, en pause et au départ.', 500, 220);

    // Load and draw QR code
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 300, 280, 400, 400);

      // Security instructions
      ctx.fillStyle = '#2A7B76';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('INSTRUCTIONS COLLABORATEUR', 500, 750);

      ctx.fillStyle = '#44403C';
      ctx.font = '16px sans-serif';
      ctx.fillText('1. Ouvrez l’application Citrine sur votre smartphone.', 500, 800);
      ctx.fillText('2. Cliquez sur « Pointage Quotidien » puis « Scanner QR Code ».', 500, 840);
      ctx.fillText('3. Visez ce QR Code pour valider instantanément votre présence.', 500, 880);

      // Footer
      ctx.fillStyle = '#78716C';
      ctx.font = 'italic 14px sans-serif';
      ctx.fillText(`Généré le ${new Date().toLocaleDateString('fr-FR')} - Citrine Enterprise Security`, 500, 1250);

      const a = document.createElement('a');
      a.download = `Affiche_Pointage_QRCode_${companyName.replace(/\s+/g, '_')}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrSecret)}`;
  } catch (err) {
    console.error('Erreur lors de la génération de l’affiche:', err);
  }
}
