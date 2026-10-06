import React from 'react';
import { QrCode, Printer, X, ShieldCheck, Building, Copy, Check, Tablet, AlertTriangle, Download } from 'lucide-react';

interface OfficeQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrSecret?: string;
  companyName?: string;
  onLaunchKiosk?: () => void;
}

export default function OfficeQRCodeModal({
  isOpen,
  onClose,
  qrSecret = "",
  companyName = "Citrine Management",
  onLaunchKiosk
}: OfficeQRCodeModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(qrSecret)}`;

  const handleCopySecret = () => {
    navigator.clipboard.writeText(qrSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAffiche = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1000;
      canvas.height = 1350;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1000, 1350);

      // Borders
      ctx.strokeStyle = '#881337';
      ctx.lineWidth = 10;
      ctx.strokeRect(30, 30, 940, 1290);

      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 3;
      ctx.strokeRect(45, 45, 910, 1260);

      // Header Badge
      ctx.fillStyle = '#ffe4e6';
      ctx.beginPath();
      ctx.roundRect(300, 80, 400, 50, 25);
      ctx.fill();

      ctx.fillStyle = '#881337';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(companyName.toUpperCase(), 500, 112);

      // Title
      ctx.fillStyle = '#4c0519';
      ctx.font = 'bold 30px Georgia, serif';
      ctx.fillText('AFFICHE OFFICIELLE DE POINTAGE SUR SITE', 500, 190);

      ctx.fillStyle = '#57534e';
      ctx.font = '18px sans-serif';
      ctx.fillText("Scannez ce QR Code avec votre smartphone à l'arrivée et au départ", 500, 230);

      // QR Image
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        // QR Container Box
        ctx.fillStyle = '#fff1f2';
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(260, 270, 480, 480, 30);
        ctx.fill();
        ctx.stroke();

        ctx.drawImage(img, 320, 330, 360, 360);

        // Secret Box
        ctx.fillStyle = '#1c1917';
        ctx.beginPath();
        ctx.roundRect(280, 780, 440, 60, 16);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px monospace';
        ctx.fillText(`CODE CERTIFIÉ : ${qrSecret}`, 500, 818);

        // Anti Fraud Rule Box
        ctx.fillStyle = '#fafaf9';
        ctx.strokeStyle = '#e7e5e4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(100, 880, 800, 240, 20);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#881337';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('🔒 SÉCURITÉ TRAÇABILITÉ IP & EMPREINTE APPAREIL :', 130, 930);

        ctx.fillStyle = '#44403c';
        ctx.font = '16px sans-serif';
        ctx.fillText('• 1 Smartphone / IP = 1 Seul Collaborateur par jour.', 140, 975);
        ctx.fillText("• L'adresse IP et l'identifiant du téléphone sont enregistrés lors du scan.", 140, 1015);
        ctx.fillText('• Le pointage par procuration déclenche une alerte de sécurité instantanée.', 140, 1055);

        // Footer
        ctx.fillStyle = '#78716c';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CITRINE MANAGEMENT - SYSTÈME DE GESTION RH & POINTAGE D\'ENTREPRISE', 500, 1200);
        ctx.font = '13px sans-serif';
        ctx.fillText(`Document Officiel Généré le ${new Date().toLocaleDateString('fr-FR')}`, 500, 1225);

        // Trigger Direct Download
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `Affiche_QR_Pointage_${companyName.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };

      // Fallback if image CORS fails
      img.onerror = () => {
        const link = document.createElement('a');
        link.download = `Affiche_QR_Pointage_${companyName.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
        link.href = qrImageUrl;
        link.target = '_blank';
        link.click();
      };

      img.src = qrImageUrl;
    } catch (e) {
      window.print();
    }
  };

  const handlePrint = () => {
    try {
      const printWindow = window.open('', '_blank', 'width=800,height=900');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Affiche QR Code Pointage - ${companyName}</title>
              <style>
                body { 
                  font-family: system-ui, -apple-system, sans-serif; 
                  text-align: center; 
                  padding: 40px; 
                  margin: 0; 
                  background: #fff; 
                  color: #1c1917; 
                }
                .container {
                  max-width: 650px;
                  margin: 0 auto;
                  border: 4px double #881337;
                  border-radius: 24px;
                  padding: 40px 30px;
                  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
                }
                .badge { 
                  display: inline-block; 
                  padding: 8px 20px; 
                  background: #ffe4e6; 
                  color: #881337; 
                  border-radius: 9999px; 
                  font-weight: bold; 
                  font-size: 14px; 
                  margin-bottom: 20px; 
                  text-transform: uppercase;
                  letter-spacing: 1px;
                }
                h1 { 
                  font-size: 26px; 
                  margin: 0 0 10px 0; 
                  color: #4c0519; 
                  font-family: Georgia, serif;
                }
                p { 
                  font-size: 13px; 
                  color: #57534e; 
                  margin-bottom: 30px; 
                  line-height: 1.5;
                }
                .qr-box { 
                  display: inline-block; 
                  padding: 24px; 
                  border: 3px dashed #f43f5e; 
                  border-radius: 24px; 
                  background: #fff1f2; 
                  margin-bottom: 25px; 
                }
                .qr-box img { 
                  width: 260px; 
                  height: 260px; 
                  border-radius: 16px; 
                  border: 2px solid #000;
                  background: #fff;
                  padding: 10px;
                }
                .secret-box { 
                  display: inline-block; 
                  margin-top: 15px; 
                  padding: 10px 24px; 
                  background: #1c1917; 
                  color: #fff; 
                  border-radius: 12px; 
                  font-family: monospace; 
                  font-size: 15px; 
                  font-weight: bold; 
                  letter-spacing: 1px;
                }
                .rules {
                  text-align: left;
                  background: #fafaf9;
                  border: 1px solid #e7e5e4;
                  padding: 15px 20px;
                  border-radius: 16px;
                  font-size: 12px;
                  color: #44403c;
                  margin-top: 20px;
                }
                .rules h4 { margin: 0 0 5px 0; color: #881337; }
                .footer-note { 
                  font-size: 11px; 
                  color: #78716c; 
                  border-top: 1px solid #e7e5e4; 
                  padding-top: 20px; 
                  margin-top: 30px; 
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="badge">📍 ${companyName}</div>
                <h1>QR CODE OFFICIEL DE POINTAGE SUR SITE</h1>
                <p>Scannez ce QR Code avec votre smartphone à l'arrivée et au départ du bureau</p>
                <div class="qr-box">
                  <img src="${qrImageUrl}" alt="QR Code" />
                  <br/>
                  <div class="secret-box">CODE CERTIFIÉ : ${qrSecret}</div>
                </div>
                <div class="rules">
                  <h4>🔒 RÈGLE STRICTE ANTI-FRAUDE IP & APPAREIL :</h4>
                  <ul style="margin: 5px 0 0 0; padding-left: 20px;">
                    <li>Un téléphone portable / IP ne peut enregistrer qu'UN SEUL collaborateur par jour.</li>
                    <li>Toute tentative de badgeage pour un collègue est automatiquement bloquée par le système.</li>
                  </ul>
                </div>
                <div class="footer-note">
                  <strong>CITRINE MANAGEMENT - SYSTÈME DE GESTION DES PRÉSENCES RH & POINTAGE D'ENTREPRISE</strong><br/>
                  Imprimé le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
                </div>
              </div>
              <script>
                window.onload = function() {
                  window.print();
                  setTimeout(function() { window.close(); }, 500);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      } else {
        window.print();
      }
    } catch (err) {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in print:p-0 print:bg-white overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative border border-green-100 print:shadow-none print:border-none print:max-w-none print:w-full">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition cursor-pointer print:hidden"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-stone-100 pb-4 print:hidden">
          <div className="p-2.5 bg-green-100 rounded-2xl text-green-700">
            <QrCode className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-serif font-bold text-green-950">
              Affiche QR Code Officiel de Pointage
            </h2>
            <p className="text-xs text-stone-500">
              Collez cette affiche à l'entrée ou la réception. Chaque employé scannera le code avec son propre téléphone.
            </p>
          </div>
        </div>

        {/* 2-Column Wide Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left Column: QR Code Printable Card Preview */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-green-50/70 to-stone-50 rounded-3xl border-2 border-dashed border-green-200 space-y-4 print:border-none print:p-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-950 text-xs font-bold">
              <Building className="h-3.5 w-3.5 text-green-600" />
              <span>{companyName}</span>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-md border border-green-100 print:shadow-none print:border-2 print:border-black">
              <img 
                src={qrImageUrl} 
                alt="QR Code de Pointage Bureau"
                className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-stone-800 font-mono bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-2xs">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="font-bold">{qrSecret}</span>
              <button
                onClick={handleCopySecret}
                className="p-1 hover:bg-stone-100 rounded text-stone-400 hover:text-stone-700 transition cursor-pointer print:hidden"
                title="Copier le code"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Right Column: Instructions, Anti-Fraud & Action Buttons */}
          <div className="md:col-span-7 space-y-4 print:hidden">
            {/* Anti-Fraud Logic Banner */}
            <div className="p-4 bg-stone-900 text-white rounded-2xl space-y-2 shadow-sm border border-stone-800">
              <div className="flex items-center gap-2 text-green-400 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Sécurité Anti-Fraude par IP & Appareil</span>
              </div>
              <p className="text-stone-300 text-xs leading-relaxed">
                Lors du scan, la plateforme associe automatiquement l'adresse IP et l'identifiant du téléphone à l'employé.
              </p>
              <div className="p-2.5 bg-green-950/80 border border-green-900 rounded-xl text-[11px] text-green-200 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Règle Strictement Appliquée :</strong> 1 Téléphone / IP = 1 Seul Collaborateur par jour. Si un employé essaie de flasher le QR code pour un collègue le même jour, le pointage est immédiatement bloqué.
                </span>
              </div>
            </div>

            {/* Quick Operating Steps */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs text-stone-600 space-y-2">
              <div className="font-bold text-stone-800 flex items-center gap-1.5">
                <QrCode className="h-4 w-4 text-green-600" />
                <span>Instructions de Mise en Service :</span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-stone-600 font-medium">
                <li>Téléchargez l'affiche au format PNG ou imprimez-la directement.</li>
                <li>Collez l'affiche à la porte d'entrée ou à la réception du bureau.</li>
                <li>Chaque collaborateur scanne le code avec son propre téléphone pour valider ses présences.</li>
              </ol>
            </div>

            {/* Actions */}
            <div className="pt-2 space-y-2.5">
              <button
                onClick={handlePrint}
                className="w-full py-3.5 bg-green-900 hover:bg-green-950 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Printer className="h-4.5 w-4.5 text-green-300" />
                <span>🖨️ Générer Affiche PDF / Imprimer en A4 (Économie d'Encre)</span>
              </button>

              <button
                onClick={handleDownloadAffiche}
                className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 border border-stone-300 cursor-pointer"
              >
                <Download className="h-4 w-4 text-stone-600" />
                <span>📥 Télécharger l'Affiche sous forme d'Image PNG</span>
              </button>

              {onLaunchKiosk && (
                <button
                  onClick={() => {
                    onClose();
                    onLaunchKiosk();
                  }}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Tablet className="h-4 w-4 text-emerald-200" />
                  <span>🖥️ Mode Borne Interactive (Sur Tablette Fixe de Réception)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
