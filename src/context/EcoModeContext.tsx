import React, { createContext, useContext, useState, useEffect } from 'react';

interface EcoModeContextType {
  ecoMode: boolean;
  toggleEcoMode: () => void;
}

const STORAGE_KEY = 'trustnode_eco';
// A user who has never touched the header toggle is assumed to follow their
// OS-level accessibility preference instead: if the system asks for reduced
// motion (make it more usable for us too), eco mode turns on automatically.
// As soon as the user toggles manually, that explicit choice wins and is
// persisted; a later OS change never overrides it.
const CHOICE_KEY = 'trustnode_eco_explicit';

const queried = (): boolean => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export const EcoModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ecoMode, setEcoMode] = useState<boolean>(() => {
    const explicit = localStorage.getItem(CHOICE_KEY);
    if (explicit) return localStorage.getItem(STORAGE_KEY) === 'true';
    // No explicit choice yet — default to the OS reduced-motion preference.
    return queried();
  });

  const toggleEcoMode = () => {
    setEcoMode((prev) => {
      const next = !prev;
      localStorage.setItem(CHOICE_KEY, 'true');
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  // While the user still has no explicit preference, keep following OS changes
  // (e.g. enabling reduced motion while the page is open).
  useEffect(() => {
    if (localStorage.getItem(CHOICE_KEY)) return;
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq || !mq.addEventListener) return;
    const apply = () => setEcoMode(mq.matches);
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (ecoMode) {
      document.documentElement.classList.add('eco-mode');
    } else {
      document.documentElement.classList.remove('eco-mode');
    }
  }, [ecoMode]);

  return (
    <EcoModeContext.Provider value={{ ecoMode, toggleEcoMode }}>
      {children}
    </EcoModeContext.Provider>
  );
};

export const useEcoMode = () => {
  const context = useContext(EcoModeContext);
  if (!context) {
    throw new Error('useEcoMode must be used within an EcoModeProvider');
  }
  return context;
};
