import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface CookieBannerContextType {
  isCookieBannerVisible: boolean;
  setCookieBannerVisible: (visible: boolean) => void;
}

const CookieBannerContext = createContext<CookieBannerContextType | undefined>(undefined);

export const CookieBannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCookieBannerVisible, setCookieBannerVisible] = useState(false);

  const setVisible = useCallback((visible: boolean) => setCookieBannerVisible(visible), []);

  const value = useMemo(
    () => ({ isCookieBannerVisible, setCookieBannerVisible: setVisible }),
    [isCookieBannerVisible, setVisible],
  );

  return <CookieBannerContext.Provider value={value}>{children}</CookieBannerContext.Provider>;
};

export const useCookieBanner = () => {
  const context = useContext(CookieBannerContext);
  if (!context) {
    throw new Error('useCookieBanner must be used within a CookieBannerProvider');
  }
  return context;
};