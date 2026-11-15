import React, { useState, useEffect } from 'react';
import { CompanyModuleConfig } from '../../../types';
import { generateAndDownloadQrPoster } from '../../../utils/qrPosterGenerator';
import { confirmActionAlert, showSuccessAlert } from '../../../utils/sweetAlert';

interface UseDoorQrSettingsActionsParams {
  moduleConfig: CompanyModuleConfig;
  onUpdateModuleConfig: (config: CompanyModuleConfig) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'warning') => void;
}

export function useDoorQrSettingsActions({
  moduleConfig,
  onUpdateModuleConfig,
  showToast,
}: UseDoorQrSettingsActionsParams) {
  const currentToken =
    moduleConfig?.doorQrCodeToken || moduleConfig?.qrCodeSecret || 'CITRINE_DOOR_HQ_MAIN_2026';
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
    : 'Configuré par défaut';

  const [siteName, setSiteName] = useState(currentSiteName);
  const [requireGps, setRequireGps] = useState<boolean>(moduleConfig?.doorQrRequireGps ?? false);
  const [tokenInput, setTokenInput] = useState(currentToken);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setTokenInput(currentToken);
  }, [currentToken]);

  const handleGenerateNewDoorQr = () => {
    setIsGenerating(true);
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    const timestampHex = Date.now().toString(36).toUpperCase();
    const newToken = `CITRINE_DOOR_${randomHex}_${timestampHex}`;
    const existingRevoked = Array.isArray(moduleConfig?.revokedDoorTokens)
      ? moduleConfig.revokedDoorTokens
      : [];
    const updatedRevoked =
      currentToken && !existingRevoked.includes(currentToken)
        ? [...existingRevoked, currentToken]
        : existingRevoked;

    onUpdateModuleConfig({
      ...(moduleConfig || {}),
      doorQrCodeToken: newToken,
      qrCodeSecret: newToken,
      doorQrCodeRevoked: false,
      revokedDoorTokens: updatedRevoked,
      doorQrCodeGeneratedAt: new Date().toISOString(),
      doorQrSiteName: siteName.trim() || 'Entrée Principale (HQ Siège)',
      doorQrRequireGps: requireGps,
    } as any);

    setTokenInput(newToken);
    setIsGenerating(false);
    showToast?.(
      "Nouveau QR Code d’Entrée généré ! L'ancien QR code est révoqué et ne permettra plus aucun pointage.",
      'success'
    );
  };

  const handleApplyToken = () => {
    const newToken = tokenInput.trim() || 'CITRINE_DOOR_HQ_MAIN_2026';
    const existingRevoked = Array.isArray(moduleConfig?.revokedDoorTokens)
      ? moduleConfig.revokedDoorTokens
      : [];
    const updatedRevoked =
      currentToken && currentToken !== newToken && !existingRevoked.includes(currentToken)
        ? [...existingRevoked, currentToken]
        : existingRevoked;

    onUpdateModuleConfig({
      ...(moduleConfig || {}),
      doorQrCodeToken: newToken,
      qrCodeSecret: newToken,
      doorQrCodeRevoked: false,
      revokedDoorTokens: updatedRevoked,
      doorQrCodeGeneratedAt: new Date().toISOString(),
      doorQrSiteName: siteName.trim() || 'Entrée Principale (HQ Siège)',
      doorQrRequireGps: requireGps,
    } as any);
    showToast?.('Jeton du QR Code mis à jour avec succès !', 'success');
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
    const revokedToken = `CITRINE_REVOKED_${Math.random().toString(36).substring(2, 8).toUpperCase()}_${Date.now()}`;

    onUpdateModuleConfig({
      ...(moduleConfig || {}),
      doorQrCodeToken: revokedToken,
      qrCodeSecret: revokedToken,
      doorQrCodeRevoked: true,
      revokedDoorTokens: [...updatedRevoked, revokedToken],
      doorQrCodeGeneratedAt: new Date().toISOString(),
      doorQrSiteName: siteName.trim() || 'Entrée Principale (HQ Siège)',
      doorQrRequireGps: requireGps,
    } as any);
    setTokenInput(revokedToken);
    showToast?.('QR Code invalidé et révoqué.', 'success');
    await showSuccessAlert(
      'QR Code invalidé !',
      "Le QR Code d'entrée a été révoqué avec succès. Aucun ancien badge ne sera accepté."
    );
  };

  const handleSaveParams = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateModuleConfig({
      ...(moduleConfig || {}),
      doorQrSiteName: siteName.trim() || 'Entrée Principale (HQ Siège)',
      doorQrRequireGps: requireGps,
    } as any);
    showToast?.('Paramètres de la borne d’entrée enregistrés.', 'success');
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(tokenInput || currentToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleCopyDirectBadgeLink = () => {
    const directUrl = `${window.location.origin}/#clocking?token=${encodeURIComponent(tokenInput || currentToken)}`;
    navigator.clipboard.writeText(directUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadPoster = () => {
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
