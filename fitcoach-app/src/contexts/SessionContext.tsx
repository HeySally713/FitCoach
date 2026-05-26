// src/contexts/SessionContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { useActiveSession, UseActiveSessionResult } from '../hooks/useActiveSession';

const SessionContext = createContext<UseActiveSessionResult | null>(null);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const value = useActiveSession();
  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): UseActiveSessionResult => {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return ctx;
};
