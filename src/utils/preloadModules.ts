// Module preloader for Hover Preloading (>80ms hover on sidebar tabs)

const preloaders: Record<string, () => Promise<any>> = {
  calls: () => import('../components/TeamCallsPanel'),
  documents: () => import('../components/DocumentGeneratorPanel'),
  users: () => import('../components/UserManagementPanel'),
  finances: () => import('../components/FinancePanel'),
  inventory: () => import('../components/InventoryPanel'),
  partners: () => import('../components/PartnersPanel'),
  settings: () => import('../components/CompanySettingsPanel'),
  communications: () => import('../components/CommunicationPanel'),
  kiosk: () => import('../components/KioskClockingModal'),
};

const preloadedTabs = new Set<string>();

export function preloadTabModule(tab: string) {
  if (preloadedTabs.has(tab)) return;
  const loader = preloaders[tab];
  if (loader) {
    preloadedTabs.add(tab);
    loader().catch(() => {
      // Ignore preloading errors, standard fallback handles it if clicked
      preloadedTabs.delete(tab);
    });
  }
}
