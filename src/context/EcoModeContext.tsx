import React, { createContext, useContext, useState, useEffect } from 'react';

interface EcoModeContextType {
  ecoMode: boolean;
  toggleEcoMode: () => void;
}

const EcoModeContext = createContext<EcoModeContextType | undefined>(undefined);

export const EcoModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ecoMode is a purely manual user choice (persisted). It is NOT auto-enabled
  // from prefers-reduced-motion: on phones that flag is commonly on by default
  // (iOS reduce-motion), and auto-triggering it there silently disabled the 3D
  // cinematic + logo assembly the site is built around. Reduced-motion users
  // can still opt in explicitly from the header toggle.
  const [ecoMode, setEcoMode] = useState<boolean>(() => {
    return localStorage.getItem('trustnode_eco') === 'true';
  });

  const toggleEcoMode = () => {
    setEcoMode((prev) => {
      const next = !prev;
      localStorage.setItem('trustnode_eco', String(next));
      return next;
    });
  };

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
