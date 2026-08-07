import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { LanguageProvider } from './i18n/LanguageContext';
import { NavigationProvider } from './navigation/NavigationContext';
import { EcoModeProvider } from './context/EcoModeContext';
import { SeniorModeProvider } from './context/SeniorModeContext';
import { CookieBannerProvider } from './context/CookieBannerContext';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <NavigationProvider>
        <EcoModeProvider>
          <SeniorModeProvider>
            <CookieBannerProvider>
              <App />
            </CookieBannerProvider>
          </SeniorModeProvider>
        </EcoModeProvider>
      </NavigationProvider>
    </LanguageProvider>
  </StrictMode>,
);
