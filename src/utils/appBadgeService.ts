export const appBadgeService = {
  updateBadge(count: number) {
    if (typeof window !== 'undefined' && 'setAppBadge' in navigator) {
      try {
        if (count > 0) {
          (navigator as any).setAppBadge(count).catch(() => {});
        } else {
          (navigator as any).clearAppBadge?.().catch(() => {});
        }
      } catch (e) {
        console.warn("App badge update failed:", e);
      }
    }
  },
  clearBadge() {
    if (typeof window !== 'undefined' && 'clearAppBadge' in navigator) {
      try {
        (navigator as any).clearAppBadge().catch(() => {});
      } catch {}
    }
  }
};
