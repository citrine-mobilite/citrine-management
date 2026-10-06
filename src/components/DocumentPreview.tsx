import React from 'react';
import { HeroCabLogo } from './CMLogo';

interface DocumentPreviewProps {
  docTitle: string;
  rawText: string;
  empName?: string;
  date?: string;
  reason?: string;
  forceApplyStamp?: boolean;
  stampImage?: string;
}

export default function DocumentPreview({
  docTitle,
  rawText,
  empName,
  date,
  reason,
  forceApplyStamp = false,
  stampImage = ''
}: DocumentPreviewProps) {
  const rawLines = rawText.split('\n').filter(l => !l.includes('====='));
  
  // Paginate lines: First page gets less space due to letterhead and metadata.
  const pages: string[][] = [];
  let currentPage: string[] = [];
  let linesForThisPage = 13; // limit for page 1 content
  
  for (let i = 0; i < rawLines.length; i++) {
    currentPage.push(rawLines[i]);
    if (currentPage.length >= linesForThisPage) {
      pages.push(currentPage);
      currentPage = [];
      linesForThisPage = 23; // limit for page 2+ content
    }
  }
  if (currentPage.length > 0 || pages.length === 0) {
    pages.push(currentPage);
  }

  const totalPages = pages.length;

  return (
    <div className="space-y-6 w-full max-w-[640px] mx-auto select-text font-serif">
      {pages.map((pageLines, pageIdx) => {
        const isFirstPage = pageIdx === 0;
        const isLastPage = pageIdx === totalPages - 1;

        return (
          <div 
            key={pageIdx} 
            className="bg-white shadow-xl rounded-2xl border border-stone-200 p-8 sm:p-12 relative flex flex-col justify-between min-h-[780px]"
            id={`document-page-${pageIdx + 1}`}
          >
            <div className="space-y-5">
              {/* 1. Page Header Letterhead */}
              {isFirstPage ? (
                <div className="border-b-2 border-stone-900 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <HeroCabLogo variant="icon" className="h-10 w-10 shrink-0 drop-shadow-sm" />
                    <div className="text-left">
                      <h1 className="font-sans font-extrabold text-[12px] tracking-widest text-stone-900 uppercase">HERO CAB — CITRINE MANAGEMENT</h1>
                      <p className="text-[9px] text-stone-500 font-sans font-medium">Direction des Opérations & Ressources Humaines • Cameroun</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-mono bg-stone-100 text-stone-700 px-2.5 py-1 rounded border border-stone-300 font-bold uppercase tracking-wider">
                      OFFICIEL • 2026
                    </span>
                  </div>
                </div>
              ) : (
                <div className="border-b border-stone-200 pb-2 flex justify-between items-center text-[9px] text-stone-400 font-sans tracking-wide">
                  <span className="uppercase font-bold text-stone-500">CITRINE MANAGEMENT — DOCUMENT OFFICIEL</span>
                  <span>{docTitle}</span>
                </div>
              )}

              {/* 2. Title (First page only) */}
              {isFirstPage && (
                <div className="text-center border-b border-stone-100 pb-3">
                  <h2 className="font-serif font-extrabold text-base sm:text-lg text-stone-950 tracking-wide uppercase">
                    {docTitle}
                  </h2>
                </div>
              )}

              {/* 3. Metadata references (First page only) */}
              {isFirstPage && (empName || date || reason) && (
                <div className="bg-stone-50 border border-stone-200/60 rounded-xl p-3.5 text-[11px] font-sans space-y-1 text-left">
                  <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[9.5px]">Références du dossier :</h4>
                  {empName && <p className="text-stone-700"><strong>Collaborateur :</strong> {empName}</p>}
                  {date && <p className="text-stone-700"><strong>Date / Période :</strong> {date}</p>}
                  {reason && <p className="text-stone-700"><strong>Motif / Objet :</strong> {reason}</p>}
                </div>
              )}

              {/* 4. Document Lines of This Page */}
              <div className="text-stone-800 text-[11.5px] sm:text-xs leading-relaxed space-y-3 font-serif text-left">
                {pageLines.map((line, idx) => {
                  if (line.includes(':') && line.length < 55 && !line.startsWith('-')) {
                    const parts = line.split(':');
                    return (
                      <p key={idx} className="pt-0.5">
                        <strong className="font-sans font-bold text-stone-900 uppercase text-[10px]">{parts[0]} :</strong>
                        <span className="font-serif text-stone-800">{parts.slice(1).join(':')}</span>
                      </p>
                    );
                  }
                  if (line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.')) {
                    return (
                      <h3 key={idx} className="font-sans font-bold text-stone-955 text-xs pt-3 pb-0.5 uppercase tracking-wider border-b border-stone-100">
                        {line}
                      </h3>
                    );
                  }
                  if (line.startsWith('-')) {
                    return (
                      <p key={idx} className="pl-4 text-stone-700">
                        • {line.substring(1).trim()}
                      </p>
                    );
                  }
                  return (
                    <p key={idx} className="text-justify indent-5">
                      {line}
                    </p>
                  );
                })}
              </div>
            </div>

            {/* 5. Signatures with stamp/signature image (Only on final page) */}
            {isLastPage && (
              <div className="pt-6 mt-6 border-t border-stone-300 text-[11px] font-sans space-y-4 text-left">
                <div className="flex justify-between items-end">
                  <div className="text-center w-48 space-y-1.5">
                    <p className="font-bold text-stone-800 text-[10px]">Pour l'Employeur (Citrine)</p>
                    <div className="h-12 flex items-center justify-center relative">
                      {forceApplyStamp && stampImage ? (
                        <img src={stampImage} alt="Cachet et Signature" className="max-h-12 max-w-[120px] object-contain mx-auto opacity-95" />
                      ) : (
                        <div className="border border-dashed border-stone-200 rounded-lg p-1 text-[8px] text-stone-400 w-full">
                          [ Espace Cachet & Signature ]
                        </div>
                      )}
                    </div>
                    <p className="text-[9px] text-stone-500 border-t border-stone-200 pt-0.5">
                      {forceApplyStamp && stampImage ? "Cachet officiel & Signature" : "Signature Manuelle"}
                    </p>
                  </div>

                  <div className="text-center w-48 space-y-1.5">
                    <p className="font-bold text-stone-800 text-[10px]">Le Collaborateur</p>
                    <div className="h-12 border-b border-stone-300 flex items-end justify-center pb-0.5 font-sans">
                      <span className="text-[9px] text-stone-400 italic">Lu et approuvé</span>
                    </div>
                    <p className="text-[9px] text-stone-500 pt-0.5">Signature précédée de la mention</p>
                  </div>
                </div>
              </div>
            )}

            {/* 6. Dynamic Footer */}
            <div className="pt-4 mt-6 border-t border-stone-100 text-center text-[9px] text-stone-400 font-mono flex justify-between">
              <span>Citrine Management • Officiel</span>
              <span>Page {pageIdx + 1} sur {totalPages}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
