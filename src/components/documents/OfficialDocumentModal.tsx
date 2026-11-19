import React, { useState, useEffect } from 'react';
import { X, Download, FileText, Check } from 'lucide-react';
import { GeneratedDocument, CompanyModuleConfig } from '../../types';
import { generateCitrineOfficialDocumentPdf, OfficialDocumentData } from '../../services/pdf/citrineOfficialDocumentPdf';
import { CITRINE_DEFAULT_LOGO_BASE64 } from '../../assets/citrineLogoBase64';

interface OfficialDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: GeneratedDocument | null;
  moduleConfig?: CompanyModuleConfig;
}

export const OfficialDocumentModal: React.FC<OfficialDocumentModalProps> = ({
  isOpen,
  onClose,
  document,
  moduleConfig,
}) => {
  // RÈGLE FORMELLE : La signature ne doit PAS être par défaut (initialisé à false)
  const [includeSignature, setIncludeSignature] = useState<boolean>(false);

  useEffect(() => {
    if (document) {
      setIncludeSignature(Boolean(document.includeSignature));
    }
  }, [document]);

  if (!isOpen || !document) return null;

  // Image du logo : conservée telle quelle en BD (Base64) ou fallback raster direct (aucun SVG)
  const currentLogo =
    document.metadata?.logoBase64 ||
    moduleConfig?.companyLogoBase64 ||
    CITRINE_DEFAULT_LOGO_BASE64 ||
    '/citrine-logo.png';

  const docDate = document.createdAt
    ? new Date(document.createdAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

  const refCode =
    (document.metadata?.referenceNumber || document.metadata?.refCode) ||
    `N° ${String(Math.floor(100000 + Math.random() * 900000))}/RH-CIT/${new Date().getFullYear()}`;

  // Découper le contenu en paragraphes ou phrases
  const rawParagraphs: string[] = document.content
    ? document.content
        .split(/\n\n+/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0 && !p.startsWith('===='))
    : [document.description || 'Contenu du document officiel CITRINE SARL.'];

  // Destinataire
  const recipientName =
    document.employeeName ||
    document.templateParams?.targetAudience ||
    'Monsieur/Madame le Collaborateur';
  const recipientRole =
    document.templateParams?.role ||
    document.templateParams?.positionTitle ||
    document.templateParams?.department ||
    'Service Opérations';

  const handleDownloadPdf = () => {
    const data: OfficialDocumentData = {
      id: document.id,
      referenceNumber: refCode,
      date: document.createdAt,
      city: 'Douala',
      recipient: {
        salutation: `À ${recipientName}`,
        roleOrService: recipientRole,
        city: 'Douala',
      },
      subject: document.title,
      salutationText: `Monsieur/Madame,`,
      paragraphs: rawParagraphs,
      closingSalutation:
        document.templateParams?.closing ||
        "Dans l'attente de la suite réservée à la présente, nous vous prions d'agréer l'expression de nos salutations distinguées.",
      signatoryCompany: 'Pour CITRINE SARL',
      signatoryTitle: 'La Direction Générale',
      logoBase64: currentLogo,
      includeSignature: includeSignature,
      signatureType: includeSignature ? 'direction_only' : 'none',
      collaboratorSignatureLabel: document.employeeName ? `Pour accord : ${document.employeeName}` : 'Le Collaborateur',
    };

    const pdf = generateCitrineOfficialDocumentPdf(data);
    const cleanTitle = document.title.replace(/[^a-zA-Z0-9]/g, '_');
    pdf.save(`${cleanTitle}_officiel.pdf`);
  };

  return (
    <div className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in">
      <div className="bg-stone-100 rounded-3xl max-w-5xl w-full shadow-2xl border border-stone-300 overflow-hidden max-h-[96vh] flex flex-col my-auto">
        {/* Barre de contrôle supérieure */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-white flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-[#2A7B76]/10 text-[#2A7B76] rounded-2xl shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-sm sm:text-base text-stone-900 truncate">
                  {document.title}
                </h3>
                {document.isGeneric ? (
                  <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200">
                    Modèle Volant
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                    Archivé BD RH
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500 font-mono">
                Réf : {refCode}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Toggle Signature Officielle : Strictement désactivée par défaut */}
            <label className="flex items-center gap-2 text-xs font-medium text-stone-700 bg-stone-50 border border-stone-300 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-stone-100 transition shadow-2xs select-none">
              <input
                type="checkbox"
                checked={includeSignature}
                onChange={(e) => setIncludeSignature(e.target.checked)}
                className="rounded border-stone-300 text-[#2A7B76] focus:ring-[#2A7B76]"
              />
              <span className="hidden sm:inline">Signature officielle électronique</span>
              <span className="sm:hidden">Signature</span>
            </label>

            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2 bg-[#2A7B76] hover:bg-[#20635F] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Télécharger PDF Officiel</span>
              <span className="sm:hidden">PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-xl transition cursor-pointer"
              title="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Aperçu Réaliste Feuille A4 */}
        <div className="p-3 sm:p-6 md:p-8 overflow-y-auto flex-1 bg-stone-200/90 flex justify-center items-start">
          <div className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-2xl border border-stone-300/80 p-8 sm:p-14 md:p-16 text-stone-900 font-sans relative flex flex-col justify-between my-2">
            
            {/* 1. En-tête Officiel avec le Logo CITRINE */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                {/* Logo Citrine Officiel conservé en BD (image matricielle, aucun SVG) */}
                <div className="flex items-center gap-3.5">
                  <img
                    src={currentLogo}
                    alt="CITRINE SARL"
                    className="h-14 sm:h-16 w-auto object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/citrine-logo.png';
                    }}
                  />
                </div>

                {/* Sceau / Millésime discret */}
                <div className="text-right text-[10px] text-stone-400 font-mono uppercase tracking-wider">
                  RÉPUBLIQUE DU CAMEROUN<br />
                  DOC. RH OFFICIEL
                </div>
              </div>

              {/* Ligne dorée horizontale de la charte Citrine */}
              <div className="h-[2px] bg-gradient-to-r from-[#D4A82F] via-[#F59E0B] to-[#D4A82F] w-full" />
            </div>

            {/* 2. Coordonnées Émetteur & Destinataire */}
            <div className="grid grid-cols-2 gap-6 pt-4 text-xs">
              {/* Émetteur (Gauche) */}
              <div className="space-y-1 text-stone-700">
                <p className="font-bold text-stone-900 text-sm">CITRINE SARL</p>
                <p>Japoma, Douala - Cameroun</p>
                <p>Tél. : +237 680 59 40 77</p>
                <p className="text-[#2A7B76]">E-mail : info@citrine-mobilite.com</p>
                <p className="pt-2 font-mono text-[11px] text-stone-900 font-bold">
                  Réf. : {refCode}
                </p>
              </div>

              {/* Destinataire & Date (Droite) */}
              <div className="text-right space-y-1">
                <p className="text-stone-700 font-medium">Douala, le {docDate}</p>
                <div className="pt-4 text-stone-900">
                  <p className="font-bold text-sm">À {recipientName}</p>
                  <p className="text-stone-600 text-xs">{recipientRole}</p>
                  <p className="text-stone-500 text-xs">Douala - Cameroun</p>
                </div>
              </div>
            </div>

            {/* 3. Objet Officiel du document */}
            <div className="pt-6">
              <p className="font-bold text-stone-900 text-sm sm:text-base">
                <span className="underline underline-offset-4 decoration-stone-900 decoration-1.5">
                  Objet : {document.title}
                </span>
              </p>
            </div>

            {/* 4. Formule d'appel & Paragraphes du corps */}
            <div className="pt-4 space-y-4 text-stone-800 text-xs sm:text-sm leading-relaxed text-justify flex-1">
              <p className="font-medium text-stone-900">Monsieur/Madame,</p>
              {rawParagraphs.map((para, idx) => (
                <p key={idx} className="indent-4 leading-normal">
                  {para}
                </p>
              ))}
              <p className="pt-2">
                Dans l'attente de la suite réservée à la présente, nous vous prions d'agréer, 
                l'expression de nos salutations distinguées.
              </p>
            </div>

            {/* 5. Bloc Direction & Signature (AUCUNE mention "cadre réservé...") */}
            <div className="pt-6 pb-4">
              {includeSignature ? (
                /* Signature électronique activée explicitement par l'utilisateur */
                <div className="space-y-1 text-xs text-stone-900">
                  <p className="font-bold">Pour CITRINE SARL</p>
                  <p className="font-semibold text-stone-800">La Direction Générale</p>
                  <div className="h-16 flex items-center">
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold">
                      <Check className="h-3.5 w-3.5" />
                      [Signature & Cachet Officiel Électroniques Apposés]
                    </span>
                  </div>
                </div>
              ) : (
                /* Par défaut : espace sobre et noble sans cadre ni mention intrusive */
                <div className="space-y-1 text-xs text-stone-900">
                  <p className="font-bold">Pour CITRINE SARL</p>
                  <p className="font-semibold text-stone-800">La Direction Générale</p>
                  {/* Espace blanc propre pour signature physique au stylo */}
                  <div className="h-16" />
                </div>
              )}
            </div>

            {/* 6. PIED DE PAGE OFFICIEL CITRINE SARL (Toujours présent et visible au bas de la page A4) */}
            <div className="mt-auto pt-6 border-t border-stone-300 text-center space-y-1 shrink-0">
              <div className="flex items-center justify-center gap-2 text-stone-800 font-bold text-[11px] uppercase tracking-wider">
                <span>CITRINE SARL</span>
                <span className="text-[#D4A82F] font-black">•</span>
                <span>JAPOMA, DOUALA - CAMEROUN</span>
              </div>
              <p className="text-[10px] text-stone-600 font-medium">
                Tél. : +237 680 59 40 77  ·  E-mail : info@citrine-mobilite.com  ·  citrinemobilite@gmail.com
              </p>
              <p className="text-[9px] text-stone-400 font-mono">
                SARL au capital de 10 000 000 FRANCS CFA — NUI : M012618579246S — RCCM : CM-DLA-01-2026-B13-00011
              </p>
              <div className="flex items-center justify-end pt-1.5 text-[8.5px] text-stone-400 border-t border-stone-100">
                <span className="font-bold font-mono">Page 1 / 1</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
