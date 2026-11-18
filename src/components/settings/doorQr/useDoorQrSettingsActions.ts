import React, { useState, useEffect } from 'react';
import { CompanyModuleConfig } from '../../../types';
import { generateAndDownloadQrPoster } from '../../../utils/qrPosterGenerator';
import { confirmActionAlert, executeOperationWithLoading } from '../../../utils/sweetAlert';

interface UseDoorQrSettingsActionsParams {
  moduleConfig: CompanyModuleConfig;
  onUpdateModuleConfig: (config: CompanyModuleConfig) => Promise<void> | void;
  showToast?: (message: string, type?: 'success' | 'error' | 'warning') => void;
}

export function useDoorQrSettingsActions({
  moduleConfig,
  onUpdateModuleConfig,
  showToast,
}: UseDoorQrSettingsActionsParams) {
  const currentToken = moduleConfig?.doorQrCodeToken || moduleConfig?.qrCodeSecret || '';
  const currentSiteName =
    moduleConfig?.doorQrSiteName || moduleConfig?.hqName || 'Entrée Principale (HQ Siège)';
  const generatedAt = moduleConfig?.doorQrCodeGeneratedAt
    ? new Date(moduleConfig.doorQrCodeGeneratedAt).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Non configuré';

  const [siteName, setSiteName] = useState(currentSiteName);
  const [requireGps, setRequireGps] = useState<boolean>(moduleConfig?.doorQrRequireGps ?? false);
  const [tokenInput, setTokenInput] = useState(currentToken);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setTokenInput(currentToken);
  }, [currentToken]);

  const handleGenerateNewDoorQr = async () => {
    setIsGenerating(true);
    const randomBytes = new Uint8Array(20);
    globalThis.crypto.getRandomValues(randomBytes);
    const randomHex = Array.from(randomBytes, value => value.toString(16).padStart(2, '0')).join('').toUpperCase();
    const newToken = `CITRINE_DOOR_${randomHex}`;
    const existingRevoked = Array.isArray(moduleConfig?.revokedDoorTokens)
      ? moduleConfig.revokedDoorTokens
      : [];
    const updatedRevoked =
      currentToken && !existingRevoked.includes(currentToken)
        ? [...existingRevoked, currentToken]
        : existingRevoked;

    try {
      const res = await executeOperationWithLoading({
        loadingTitle: 'Génération du QR Code...',
        loadingText: "Veuillez patienter pendant la création du nouveau QR Code d'entrée...",
        action: async () => {
          await onUpdateModuleConfig({
            ...(moduleConfig || {}),
            doorQrCodeToken: newToken,
            qrCodeSecret: newToken,
            doorQrCodeRevoked: false,
            revokedDoorTokens: updatedRevoked,
            doorQrCodeGeneratedAt: new Date().toISOString(),
            doorQrSiteName: siteName.trim() || 'Entrée Principale (HQ Siège)',
            doorQrRequireGps: requireGps,
          } as any);
        },
        successTitle: 'Nouveau QR Code généré !',
        successMessage: "L'ancien QR code est révoqué et ne permettra plus aucun pointage.",
      });
      if (res.success) {
        setTokenInput(newToken);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyToken = async () => {
    const newToken = tokenInput.trim();
    if (newToken.length < 16) { showToast?.('Le jeton doit contenir au moins 16 caractères.', 'error'); return; }
    const existingRevoked = Array.isArray(moduleConfig?.revokedDoorTokens)
      ? moduleConfig.revokedDoorTokens
      : [];
    const updatedRevoked =
      currentToken && currentToken !== newToken && !existingRevoked.includes(currentToken)
        ? [...existingRevoked, currentToken]
        : existingRevoked;

    await executeOperationWithLoading({
      loadingTitle: 'Mise à jour du jeton...',
      loadingText: 'Veuillez patienter pendant la sauvegarde du jeton QR...',
      action: async () => {
        await onUpdateModuleConfig({
          ...(moduleConfig || {}),
          doorQrCodeToken: newToken,
          qrCodeSecret: newToken,
          doorQrCodeRevoked: false,
          revokedDoorTokens: updatedRevoked,
          doorQrCodeGeneratedAt: new Date().toISOString(),
          doorQrSiteName: siteName.trim() || 'Entrée Principale (HQ Siège)',
          doorQrRequireGps: requireGps,
        } as any);
      },
      successTitle: 'Jeton mis à jour !',
      successMessage: 'Jeton du QR Code mis à jour avec succès.',
    });
  };

  const handleInvalidateToken = async () => {
    const isConfirmed = await confirmActionAlert({
      title: 'Invalider ce QR Code ?',
      text: "Voulez-vous vraiment invalider ce QR Code ? L'ancien jeton cessera immédiatement de fonctionner.",
      confirmButtonText: 'Oui, invalider',
      isDestructive: true,
      icon: 'warning',
    });
    if (!isConfirmed) return;

    const existingRevoked = Array.isArray(moduleConfig?.revokedDoorTokens)
      ? moduleConfig.revokedDoorTokens
      : [];
    const updatedRevoked =
      currentToken && !existingRevoked.includes(currentToken)
        ? [...existingRevoked, currentToken]
        : existingRevoked;
    const revokeBytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(revokeBytes);
    const revokedToken = `CITRINE_REVOKED_${Array.from(revokeBytes, value => value.toString(16).padStart(2, '0')).join('').toUpperCase()}`;

    const res = await executeOperationWithLoading({
      loadingTitle: 'Révocation du QR Code...',
      loadingText: 'Veuillez patienter pendant la révocation du jeton...',
      action: async () => {
        await onUpdateModuleConfig({
          ...(moduleConfig || {}),
          doorQrCodeToken: revokedToken,
          qrCodeSecret: revokedToken,
          doorQrCodeRevoked: true,
          revokedDoorTokens: [...updatedRevoked, revokedToken],
          doorQrCodeGeneratedAt: new Date().toISOString(),
          doorQrSiteName: siteName.trim() || 'Entrée Principale (HQ Siège)',
          doorQrRequireGps: requireGps,
        } as any);
      },
      successTitle: 'QR Code invalidé !',
      successMessage: "Le QR Code d'entrée a été révoqué avec succès. Aucun ancien badge ne sera accepté.",
    });
    if (res.success) {
      setTokenInput(revokedToken);
    }
  };

  const handleSaveParams = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeOperationWithLoading({
      loadingTitle: 'Enregistrement de la borne...',
      loadingText: "Veuillez patienter pendant la sauvegarde des paramètres de la borne d'entrée...",
      action: async () => {
        await onUpdateModuleConfig({
          ...(moduleConfig || {}),
          doorQrSiteName: siteName.trim() || 'Entrée Principale (HQ Siège)',
          doorQrRequireGps: requireGps,
        } as any);
      },
      successTitle: 'Paramètres enregistrés !',
      successMessage: "Paramètres de la borne d'entrée enregistrés avec succès.",
    });
  };

  const handleCopyToken = () => {
    if (!(tokenInput || currentToken)) return;
    navigator.clipboard.writeText(tokenInput || currentToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleCopyDirectBadgeLink = () => {
    if (!(tokenInput || currentToken)) return;
    const directUrl = `${window.location.origin}/#clocking?token=${encodeURIComponent(tokenInput || currentToken)}`;
    navigator.clipboard.writeText(directUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadPoster = () => {
    if (!(tokenInput || currentToken)) { showToast?.('Générez un jeton QR avant de télécharger l’affiche.', 'error'); return; }
    generateAndDownloadQrPoster(tokenInput || currentToken, {
      companyName: moduleConfig?.companyName || 'Citrine SARL',
      siteName: siteName.trim() || 'Entrée Principale (HQ Siège)',
      title: 'BORNE OFFICIELLE DE POINTAGE',
      subtitle: 'Scannez ce QR Code avec l’application Citrine pour valider votre badgeage.',
    });
    showToast?.('Téléchargement de l’affiche HD lancé !', 'success');
  };

  return {
    currentToken,
    generatedAt,
    siteName,
    setSiteName,
    requireGps,
    setRequireGps,
    tokenInput,
    setTokenInput,
    copiedToken,
    copiedLink,
    isGenerating,
    handleGenerateNewDoorQr,
    handleApplyToken,
    handleInvalidateToken,
    handleSaveParams,
    handleCopyToken,
    handleCopyDirectBadgeLink,
    handleDownloadPoster,
  };
}
