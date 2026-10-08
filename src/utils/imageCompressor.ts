/**
 * Utility to compress images client-side to strictly less than a given max size (default: 350 KB).
 */
export async function compressImageFile(
  file: File,
  maxSizeBytes: number = 350 * 1024
): Promise<{ dataUrl: string; sizeKb: number; originalSizeKb: number }> {
  const originalSizeKb = Math.round(file.size / 1024);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Calculate ideal canvas dimensions (max width/height 1000px for avatars)
        let width = img.width;
        let height = img.height;
        const maxDimension = 1000;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Iteratively adjust quality until under maxSizeBytes
        let quality = 0.92;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Calculate approximate size in bytes from base64 string
        const getByteLength = (b64: string) => {
          const stringLength = b64.length - (b64.indexOf(',') + 1);
          return Math.ceil(stringLength * (3 / 4));
        };

        while (getByteLength(dataUrl) > maxSizeBytes && quality > 0.1) {
          quality -= 0.08;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        // If still too large, downscale canvas dimensions
        if (getByteLength(dataUrl) > maxSizeBytes) {
          canvas.width = Math.round(width * 0.7);
          canvas.height = Math.round(height * 0.7);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          quality = 0.75;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          while (getByteLength(dataUrl) > maxSizeBytes && quality > 0.1) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
        }

        const finalSizeKb = Math.round(getByteLength(dataUrl) / 1024);
        resolve({
          dataUrl,
          sizeKb: finalSizeKb,
          originalSizeKb,
        });
      };
      img.onerror = () => reject(new Error('Erreur de chargement de l\'image'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.readAsDataURL(file);
  });
}
