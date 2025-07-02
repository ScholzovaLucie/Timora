// src/contexts/DataRefreshContext.jsx
import { createContext, useContext, useState, useCallback } from "react";

const DataRefreshContext = createContext();

export function DataRefreshProvider({ children }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <DataRefreshContext.Provider value={{ refreshKey, refresh }}>
      {children}
    </DataRefreshContext.Provider>
  );
}

export function useDataRefresh() {
  return useContext(DataRefreshContext);
}
