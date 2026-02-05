import React, { createContext, useContext, useState } from 'react';

const PerformanceContext = createContext(null);

export function PerformanceProvider({ children }) {
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedRaceId, setSelectedRaceId] = useState(null);

  return (
    <PerformanceContext.Provider
      value={{
        selectedUserId,
        setSelectedUserId,
        selectedRaceId,
        setSelectedRaceId
      }}
    >
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance() {
  return useContext(PerformanceContext);
}
