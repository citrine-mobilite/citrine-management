import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// 1. Render Application UI Immediately - Never block root mount
try {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    createRoot(rootElement).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>
    );
  }
} catch (renderError) {
  console.error("Critical error during initial React createRoot:", renderError);
}

// 2. Register Service Worker for PWA Offline Mode & Push Notifications
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      try {
        navigator.serviceWorker.register('/sw.js', { scope: '/' }).then((reg) => {
          console.log('✅ Service Worker Citrine actif (PWA & Push):', reg.scope);
        }).catch((err) => {
          console.warn('SW registration warning:', err);
        });
      } catch (e) {
        console.warn('SW registration exception:', e);
      }
    });
  }
} catch (swError) {
  console.warn('Service worker check safely ignored:', swError);
}



