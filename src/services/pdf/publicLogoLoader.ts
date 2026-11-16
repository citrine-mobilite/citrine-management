let cachedLogoDataUrl: string | undefined;
let inflightPromise: Promise<string | undefined> | null = null;

function loadImageAsDataUrl(url: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(undefined);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 400;
        canvas.height = img.naturalHeight || img.height || 120;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(undefined);
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(undefined);
      }
    };
    img.onerror = () => resolve(undefined);
    img.src = url;
  });
}

export async function ensurePublicLogoLoaded(preferredSrc?: string): Promise<string | undefined> {
  if (preferredSrc && preferredSrc.startsWith('data:image/')) {
    return preferredSrc;
  }
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  if (inflightPromise) return inflightPromise;

  inflightPromise = (async () => {
    const primary = await loadImageAsDataUrl(preferredSrc || '/citrine-logo.png');
    if (primary) {
      cachedLogoDataUrl = primary;
      return primary;
    }
    const fallback = await loadImageAsDataUrl('/logo.png');
    if (fallback) {
      cachedLogoDataUrl = fallback;
      return fallback;
    }
    return undefined;
  })();

  const result = await inflightPromise;
  inflightPromise = null;
  return result;
}

export function getCachedPublicLogoDataUrl(): string | undefined {
  return cachedLogoDataUrl;
}

if (typeof window !== 'undefined') {
  ensurePublicLogoLoaded().catch(() => {});
}
