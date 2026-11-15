import React, { useEffect } from 'react';
import jsQR from 'jsqr';
import { haptic } from '../../../services/hapticService';

export function usePointageScanLoop(params: {
  currentStep: 'select_method' | 'scan_door' | 'scan_dynamic' | 'code_16';
  isProcessingDetection: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  hiddenCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  scanIntervalRef: React.MutableRefObject<any>;
  setDetectedQrCode: (val: string | null) => void;
  handleProcessScannedQrCode: (raw: string) => Promise<void>;
}) {
  const {
    currentStep,
    isProcessingDetection,
    videoRef,
    hiddenCanvasRef,
    scanIntervalRef,
    setDetectedQrCode,
    handleProcessScannedQrCode,
  } = params;

  useEffect(() => {
    if (currentStep !== 'scan_door' && currentStep !== 'scan_dynamic') {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
      return;
    }

    if (!hiddenCanvasRef.current) {
      hiddenCanvasRef.current = document.createElement('canvas');
    }

    scanIntervalRef.current = setInterval(() => {
      if (isProcessingDetection) return;
      const video = videoRef.current;
      const canvas = hiddenCanvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;
      if (video.videoWidth === 0 || video.videoHeight === 0) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const qrResult = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (qrResult && qrResult.data) {
        const found = qrResult.data.trim();
        if (found.length > 2) {
          setDetectedQrCode(found);
          haptic.success();
          if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
          }
        }
      }
    }, 120);

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    };
  }, [currentStep, isProcessingDetection, videoRef, hiddenCanvasRef, scanIntervalRef, setDetectedQrCode, handleProcessScannedQrCode]);
}

export function decodeQrFromImageFile(
  file: File,
  onDecoded: (raw: string) => void,
  onInvalid: () => void
) {
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const qrResult = jsQR(imageData.data, imageData.width, imageData.height);
      if (qrResult && qrResult.data) {
        onDecoded(qrResult.data);
      } else {
        onInvalid();
      }
    };
    img.src = event.target?.result as string;
  };
  reader.readAsDataURL(file);
}
