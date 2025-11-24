import React, { createContext, useContext, useState, useCallback } from "react";

const DaliContext = createContext();

export function DaliProvider({ children }) {
  const [selectedGateway, setSelectedGateway] = useState(null);

  const selectGateway = useCallback((gateway) => {
    setSelectedGateway(gateway);
  }, []);

  const clearGateway = useCallback(() => {
    setSelectedGateway(null);
  }, []);

  const value = {
    selectedGateway,
    selectGateway,
    clearGateway,
  };

  return <DaliContext.Provider value={value}>{children}</DaliContext.Provider>;
}

export function useDali() {
  const context = useContext(DaliContext);
  if (!context) {
    throw new Error("useDali must be used within a DaliProvider");
  }
  return context;
}
